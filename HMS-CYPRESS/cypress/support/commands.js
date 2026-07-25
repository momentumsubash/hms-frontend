// =====================================================
// CUSTOM COMMANDS FOR HMS E2E TESTS
// =====================================================

// ── AUTH ──────────────────────────────────────────────

Cypress.Commands.add('login', (email = 'manager@momentum.com', password = 'Manager@123') => {
  cy.loginAsManager(email, password);
});

Cypress.Commands.add('loginAsManager', (email = 'manager@momentum.com', password = 'Manager@123') => {
  cy.visit('/login');
  cy.get('[data-cy="login-email"]', { timeout: 10000 }).should('not.be.disabled');
  cy.get('[data-cy="login-email"]').clear();
  cy.get('[data-cy="login-email"]').type(email);
  cy.get('[data-cy="login-password"]').clear();
  cy.get('[data-cy="login-password"]').type(password);
  cy.get('[data-cy="login-submit"]').click();
  cy.url({ timeout: 10000 }).should('include', '/dashboard');
});

Cypress.Commands.add('apiLogin', (email = 'manager@momentum.com', password = 'Manager@123') => {
  const apiUrl = Cypress.env('apiUrl');
  cy.visit('/login');
  cy.request({
    method: 'POST',
    url: `${apiUrl}/api/auth/login`,
    body: { email, password },
  }).then((res) => {
    expect(res.status).to.eq(200);
    expect(res.body.token).to.exist;
    Cypress.env('authToken', res.body.token);
    Cypress.env('authUser', res.body.user);
    window.localStorage.setItem('token', res.body.token);
    window.localStorage.setItem('user', JSON.stringify(res.body.user));
  });
  cy.visit('/rooms');
  cy.get('body', { timeout: 15000 }).should('be.visible');
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-cy="user-menu-trigger"]').click();
  cy.get('[data-cy="logout-button"]').click();
  cy.url().should('include', '/login');
});

// ── MOMENTUM RESET ────────────────────────────────────

Cypress.Commands.add('resetMomentumData', () => {
  cy.exec('node scripts/reset-momentum-data.js --force', {
    cwd: 'D:\\Github\\HMS-Projects\\HMS-API',
    timeout: 30000,
    failOnNonZeroExit: false,
  }).then((result) => {
    cy.log(`Reset output: ${result.stdout}`);
    if (result.code !== 0) {
      cy.log(`Reset stderr: ${result.stderr}`);
    }
  });
});

// ── API HELPERS (Momentum-scoped via JWT) ──────────────

Cypress.Commands.add('getApiAuth', () => {
  const apiUrl = Cypress.env('apiUrl');
  const token = localStorage.getItem('token');
  return cy.wrap({ apiUrl, headers: { Authorization: `Bearer ${token}` } });
});

Cypress.Commands.add('apiGetHotel', () => {
  const apiUrl = Cypress.env('apiUrl');
  const token = Cypress.env('authToken');
  return cy.request({
    method: 'GET',
    url: `${apiUrl}/api/hotels/me`,
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.body.data);
});

Cypress.Commands.add('apiCreateItem', (itemData) => {
  const apiUrl = Cypress.env('apiUrl');
  const token = Cypress.env('authToken');
  return cy.request({
    method: 'GET',
    url: `${apiUrl}/api/hotels/me`,
    headers: { Authorization: `Bearer ${token}` },
  }).then((hotelRes) => {
    const hotelId = hotelRes.body.data?._id;
    return cy.request({
      method: 'GET',
      url: `${apiUrl}/api/categories`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((catRes) => {
      const catId = catRes.body.data?.[0]?._id;
      return cy.request({
        method: 'POST',
        url: `${apiUrl}/api/items`,
        headers: { Authorization: `Bearer ${token}` },
        body: {
          name: itemData.name,
          price: itemData.price || 100,
          category: catId,
          hotel: hotelId,
          stock: itemData.stock || 0,
          inventory: itemData.inventory || false,
          isAvailable: itemData.isAvailable !== false,
        },
        failOnStatusCode: false,
      });
    });
  });
});

Cypress.Commands.add('apiCreateGuest', (guestData) => {
  const apiUrl = Cypress.env('apiUrl');
  const token = Cypress.env('authToken');
  return cy.request({
    method: 'GET',
    url: `${apiUrl}/api/hotels/me`,
    headers: { Authorization: `Bearer ${token}` },
  }).then((hotelRes) => {
    const hotelId = hotelRes.body.data?._id;
    return cy.request({
      method: 'GET',
      url: `${apiUrl}/api/rooms/available`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((roomRes) => {
      const rooms = roomRes.body.data?.rooms || [];
      if (rooms.length === 0) throw new Error('No available rooms');
      const room = rooms[0];
      return cy.request({
        method: 'POST',
        url: `${apiUrl}/api/guests`,
        headers: { Authorization: `Bearer ${token}` },
        body: {
          firstName: guestData.firstName || `TestGuest_${Date.now()}`,
          lastName: guestData.lastName || 'Auto',
          email: guestData.email || `test${Date.now()}@auto.com`,
          phone: guestData.phone || `98${Date.now().toString().slice(-8)}`,
          rooms: [room.roomNumber],
          checkInDate: guestData.checkInDate || new Date().toISOString(),
          advancePaid: 0,
          roomDiscount: 0,
          hotel: hotelId,
        },
        failOnStatusCode: false,
      }).then((res) => {
        return cy.wrap({ response: res, room });
      });
    });
  });
});

Cypress.Commands.add('apiCreateOrder', (orderData) => {
  const apiUrl = Cypress.env('apiUrl');
  const token = Cypress.env('authToken');
  return cy.request({
    method: 'POST',
    url: `${apiUrl}/api/orders`,
    headers: { Authorization: `Bearer ${token}` },
    body: {
      roomNumber: orderData.roomNumber,
      items: orderData.items,
    },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('apiCompleteOrder', (orderId) => {
  const apiUrl = Cypress.env('apiUrl');
  const token = Cypress.env('authToken');
  return cy.request({
    method: 'PUT',
    url: `${apiUrl}/api/orders/${orderId}/status`,
    headers: { Authorization: `Bearer ${token}` },
    body: { status: 'completed' },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('apiGetStats', (filter = 'all') => {
  const apiUrl = Cypress.env('apiUrl');
  const token = Cypress.env('authToken');
  return cy.request({
    method: 'GET',
    url: `${apiUrl}/api/stats/summary?filter=${filter}`,
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.body.data);
});

// ── GUEST MANAGEMENT ──────────────────────────────────

Cypress.Commands.add('createNewGuest', (guestData = {}) => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const hh = String(today.getHours()).padStart(2, '0');
  const min = String(today.getMinutes()).padStart(2, '0');

  const guest = {
    firstName: guestData.firstName || `Guest_${Date.now()}`,
    lastName: guestData.lastName || 'Test',
    email: guestData.email || `guest${Date.now()}@test.com`,
    phone: guestData.phone || '9840000000',
    ...guestData
  };

  cy.get('[data-cy="guests-nav"]').click();
  cy.get('[data-cy="guests-add-new"]').last().click({ force: true });
  
  cy.get('[data-cy="guests-form-first-name"]', { timeout: 5000 }).type(guest.firstName, { force: true });
  cy.get('[data-cy="guests-form-last-name"]').type(guest.lastName, { force: true });
  cy.get('[data-cy="guests-form-email"]').type(guest.email, { force: true });
  cy.get('[data-cy="guests-form-phone"]').type(guest.phone, { force: true });
  cy.get('[data-cy="guests-checkin"]').type(`${yyyy}-${mm}-${dd}T${hh}:${min}`, { force: true });
  cy.get('[data-cy="guests-roomdiscount"]').clear({ force: true }).type('0', { force: true });
  cy.get('[data-cy="guests-advancepaid"]').clear({ force: true }).type('0', { force: true });
  cy.get('[data-cy="guests-rooms"]').first().click({ force: true });
  
  cy.get('[data-cy="guests-form-submit"]').click({ force: true });
  cy.get('[data-cy="toast-success"]', { timeout: 10000 }).should('exist');
});

// ── UTILITY ───────────────────────────────────────────

Cypress.Commands.add('waitForLoadingToComplete', () => {
  cy.get('[data-cy="loading-spinner"]', { timeout: 10000 }).should('not.exist');
});
