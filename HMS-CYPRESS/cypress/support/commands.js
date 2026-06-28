// =====================================================
// CUSTOM COMMANDS FOR HMS E2E TESTS
// =====================================================

// Login alias
Cypress.Commands.add('login', (email = 'manager@momentum.com', password = 'Manager@123') => {
  cy.loginAsManager(email, password);
});

// Login with test credentials
Cypress.Commands.add('loginAsManager', (email = 'manager@momentum.com', password = 'Manager@123') => {
  cy.visit('/login');
  cy.get('[data-cy="login-email"]').clear().type(email);
  cy.get('[data-cy="login-password"]').clear().type(password);
  cy.get('[data-cy="login-submit"]').click();
  cy.url({ timeout: 10000 }).should('include', '/dashboard');
});

// Logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-cy="user-menu-trigger"]').click();
  cy.get('[data-cy="logout-button"]').click();
  cy.url().should('include', '/login');
});

// =====================================================
// GUEST MANAGEMENT
// =====================================================

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

Cypress.Commands.add('getAllGuestCount', () => {
  cy.get('[data-cy="guests-nav"]').click();
  return cy.get('[data-cy="guests-list-count"]').then(el => {
    return parseInt(el.text().match(/\d+/)[0]);
  });
});

// =====================================================
// ROOM MANAGEMENT
// =====================================================

Cypress.Commands.add('checkoutRoom', (roomNumber, guestName) => {
  cy.get('[data-cy="rooms-nav"]').click();
  cy.get(`[data-cy="room-${roomNumber}"]`).click();
  cy.get('[data-cy="room-checkout-button"]').click();
  cy.get('[data-cy="checkout-guest-select"]').type(guestName);
  cy.get('[data-cy="checkout-confirm"]').click();
  cy.get('[data-cy="success-toast"]', { timeout: 5000 }).should('exist');
});

Cypress.Commands.add('checkinRoom', (roomNumber) => {
  cy.get('[data-cy="rooms-nav"]').click();
  cy.get(`[data-cy="room-${roomNumber}"]`).click();
  cy.get('[data-cy="room-checkin-button"]').click();
  cy.get('[data-cy="success-toast"]', { timeout: 5000 }).should('exist');
});

// =====================================================
// ORDERS & CHECKOUT
// =====================================================

Cypress.Commands.add('createOrder', (orderData = {}) => {
  const order = {
    guestName: orderData.guestName || 'Test Guest',
    items: orderData.items || [],
    ...orderData
  };

  cy.get('[data-cy="orders-nav"]').click();
  cy.get('[data-cy="create-order-button"]').click();
  
  cy.get('[data-cy="order-guest-select"]').type(order.guestName);
  cy.get('[data-cy="order-guest-option"]').first().click();
  
  // Add items
  for (const item of order.items) {
    cy.get('[data-cy="add-item-button"]').click();
    cy.get('[data-cy="order-item-select"]').type(item.name);
    cy.get('[data-cy="order-item-option"]').first().click();
    cy.get('[data-cy="order-item-quantity"]').clear().type(item.quantity || 1);
  }
  
  cy.get('[data-cy="order-submit"]').click();
  cy.get('[data-cy="success-toast"]', { timeout: 5000 }).should('exist');
});

Cypress.Commands.add('createCheckout', (checkoutData = {}) => {
  const checkout = {
    guestName: checkoutData.guestName || 'Test Guest',
    discountAmount: checkoutData.discountAmount || 0,
    paymentMethod: checkoutData.paymentMethod || 'cash',
    amountPaid: checkoutData.amountPaid || 'full',
    ...checkoutData
  };

  cy.get('[data-cy="checkout-nav"]').click();
  cy.get('[data-cy="create-checkout-button"]').click();
  
  cy.get('[data-cy="checkout-guest-select"]').type(checkout.guestName);
  cy.get('[data-cy="checkout-guest-option"]').first().click();
  
  // Get total amount
  cy.get('[data-cy="checkout-total-amount"]').then(el => {
    const totalAmount = parseFloat(el.text());
    
    if (checkout.discountAmount > 0) {
      cy.get('[data-cy="checkout-discount-amount"]').clear().type(checkout.discountAmount);
    }
    
    cy.get('[data-cy="checkout-payment-method"]').select(checkout.paymentMethod);
    
    if (checkout.amountPaid === 'half') {
      const halfAmount = Math.floor(totalAmount / 2);
      cy.get('[data-cy="checkout-amount-paid"]').clear().type(halfAmount);
    } else if (checkout.amountPaid === 'custom') {
      cy.get('[data-cy="checkout-amount-paid"]').clear().type(checkout.customAmount);
    } else {
      cy.get('[data-cy="checkout-amount-paid"]').clear().type(totalAmount - checkout.discountAmount);
    }
  });
  
  cy.get('[data-cy="checkout-submit"]').click();
  cy.get('[data-cy="success-toast"]', { timeout: 5000 }).should('exist');
});

// =====================================================
// ITEMS & INVENTORY
// =====================================================

Cypress.Commands.add('updateItemPrice', (itemName, newPrice) => {
  cy.get('[data-cy="items-nav"]').click();
  cy.get('[data-cy="items-search"]').type(itemName);
  cy.get(`[data-cy="item-${itemName}"]`).click();
  cy.get('[data-cy="item-edit-button"]').click();
  cy.get('[data-cy="item-price-input"]').clear().type(newPrice);
  cy.get('[data-cy="item-save-button"]').click();
  cy.get('[data-cy="success-toast"]', { timeout: 5000 }).should('exist');
});

Cypress.Commands.add('updateItemStock', (itemName, newStock) => {
  cy.get('[data-cy="items-nav"]').click();
  cy.get('[data-cy="items-search"]').type(itemName);
  cy.get(`[data-cy="item-${itemName}"]`).click();
  cy.get('[data-cy="item-edit-button"]').click();
  cy.get('[data-cy="item-stock-input"]').clear().type(newStock);
  cy.get('[data-cy="item-save-button"]').click();
  cy.get('[data-cy="success-toast"]', { timeout: 5000 }).should('exist');
});

// =====================================================
// DISCOUNTS & REFERRALS
// =====================================================

Cypress.Commands.add('applyDiscount', (guestName, discountAmount) => {
  cy.get('[data-cy="discounts-nav"]').click();
  cy.get('[data-cy="create-discount-button"]').click();
  cy.get('[data-cy="discount-guest-select"]').type(guestName);
  cy.get('[data-cy="discount-guest-option"]').first().click();
  cy.get('[data-cy="discount-amount-input"]').type(discountAmount);
  cy.get('[data-cy="discount-submit"]').click();
  cy.get('[data-cy="success-toast"]', { timeout: 5000 }).should('exist');
});

Cypress.Commands.add('createReferrer', (referrerData = {}) => {
  const referrer = {
    name: referrerData.name || `Referrer_${Date.now()}`,
    phone: referrerData.phone || '9840000001',
    commissionPercent: referrerData.commissionPercent || 5,
    ...referrerData
  };

  cy.get('[data-cy="referrers-nav"]').click();
  cy.get('[data-cy="add-referrer-button"]').click();
  
  cy.get('[data-cy="referrer-form-name"]').type(referrer.name);
  cy.get('[data-cy="referrer-form-phone"]').type(referrer.phone);
  cy.get('[data-cy="referrer-form-commission"]').type(referrer.commissionPercent);
  
  cy.get('[data-cy="referrer-form-submit"]').click();
  cy.get('[data-cy="success-toast"]', { timeout: 5000 }).should('exist');
  
  return { ...referrer };
});

// =====================================================
// PAYMENT MANAGEMENT
// =====================================================

Cypress.Commands.add('payPartialDue', (guestName, amount) => {
  cy.get('[data-cy="guests-nav"]').click();
  cy.get('[data-cy="guests-search"]').type(guestName);
  cy.get(`[data-cy="guest-${guestName}"]`).click();
  cy.get('[data-cy="guest-pay-due-button"]').click();
  cy.get('[data-cy="payment-amount-input"]').clear().type(amount);
  cy.get('[data-cy="payment-submit"]').click();
  cy.get('[data-cy="success-toast"]', { timeout: 5000 }).should('exist');
});

Cypress.Commands.add('getGuestBalance', (guestName) => {
  cy.get('[data-cy="guests-nav"]').click();
  cy.get('[data-cy="guests-search"]').type(guestName);
  cy.get(`[data-cy="guest-${guestName}"]`).click();
  return cy.get('[data-cy="guest-balance"]').then(el => {
    return parseFloat(el.text().match(/[\d.]+/)[0]);
  });
});

// =====================================================
// STATS & REPORTING
// =====================================================

Cypress.Commands.add('getStatsSnapshot', () => {
  cy.get('[data-cy="stats-nav"]').click();
  
  const stats = {};
  
  cy.get('[data-cy="stats-total-revenue"]').then(el => {
    stats.totalRevenue = parseFloat(el.text().match(/[\d.]+/)[0]);
  });
  
  cy.get('[data-cy="stats-total-guests"]').then(el => {
    stats.totalGuests = parseInt(el.text().match(/\d+/)[0]);
  });
  
  cy.get('[data-cy="stats-total-orders"]').then(el => {
    stats.totalOrders = parseInt(el.text().match(/\d+/)[0]);
  });
  
  cy.get('[data-cy="stats-total-checkouts"]').then(el => {
    stats.totalCheckouts = parseInt(el.text().match(/\d+/)[0]);
  });
  
  return cy.wrap(stats);
});

// =====================================================
// UTILITY COMMANDS
// =====================================================

Cypress.Commands.add('waitForLoadingToComplete', () => {
  cy.get('[data-cy="loading-spinner"]', { timeout: 10000 }).should('not.exist');
});

Cypress.Commands.add('captureScreenshot', (name) => {
  cy.screenshot(name, { onBeforeScreenshot() { cy.waitForLoadingToComplete(); } });
});

Cypress.Commands.add('compareDates', (dateStr1, dateStr2) => {
  const date1 = new Date(dateStr1);
  const date2 = new Date(dateStr2);
  return date1.getTime() === date2.getTime();
});

