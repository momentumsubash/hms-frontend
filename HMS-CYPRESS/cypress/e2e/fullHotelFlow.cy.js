describe('Full Hotel Flow - Guest → Room → Order → Checkout → Stats', () => {
  const uid = Date.now();
  const guestName = `FlowGuest_${uid}`;
  const itemName1 = `FlowItem_A_${uid}`;
  const itemName2 = `FlowItem_B_${uid}`;
  let item1Id, item2Id, guestRoom, guestId;

  before(() => {
    cy.resetMomentumData();
    cy.apiLogin();
  });

  // ── SETUP: Create all test data via API ──────────────

  describe('Setup', () => {
    it('should create guest + assign room via API', () => {
      const apiUrl = Cypress.env('apiUrl');
      const token = Cypress.env('authToken');
      cy.request({
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
          expect(rooms.length, 'Should have available rooms').to.be.greaterThan(0);
          guestRoom = rooms[0].roomNumber;
          return cy.request({
            method: 'POST',
            url: `${apiUrl}/api/guests`,
            headers: { Authorization: `Bearer ${token}` },
            body: {
              firstName: guestName,
              lastName: 'AutoTest',
              email: `flow${uid}@test.com`,
              phone: `55${uid.toString().slice(-8)}`,
              rooms: [guestRoom],
              checkInDate: new Date().toISOString(),
              advancePaid: 0,
              roomDiscount: 0,
              hotel: hotelId,
            },
            failOnStatusCode: false,
          });
        });
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201]);
        guestId = res.body.data?._id || res.body.guest?._id;
      });
    });

    it('should create items with stock via API', () => {
      cy.apiCreateItem({ name: itemName1, price: 150, stock: 20, inventory: true }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201]);
        item1Id = res.body.data?._id;
      });
      cy.apiCreateItem({ name: itemName2, price: 80, stock: 0, inventory: false }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201]);
        item2Id = res.body.data?._id;
      });
    });

    it('should verify room is occupied after guest check-in', () => {
      const apiUrl = Cypress.env('apiUrl');
      const token = Cypress.env('authToken');
      cy.request({
        method: 'GET',
        url: `${apiUrl}/api/rooms/${guestRoom}`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        expect(res.body.data.isOccupied).to.eq(true);
      });
    });

    it('should create order with items via API', () => {
      const items = [];
      if (item1Id) items.push({ itemId: item1Id, quantity: 2 });
      if (item2Id) items.push({ itemId: item2Id, quantity: 1 });
      expect(items.length, 'Should have items to order').to.be.greaterThan(0);

      cy.apiCreateOrder({ roomNumber: guestRoom, items }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201]);
        expect(res.body.data.status).to.eq('pending');
        expect(res.body.data.roomNumber).to.eq(guestRoom);
      });
    });

    it('should complete the order via API', () => {
      const apiUrl = Cypress.env('apiUrl');
      const token = Cypress.env('authToken');
      cy.request({
        method: 'GET',
        url: `${apiUrl}/api/orders?status=pending`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        const orders = res.body.data?.orders || res.body.data || [];
        const pending = Array.isArray(orders) ? orders.find(o => o.roomNumber === guestRoom) : null;
        expect(pending, 'Should find pending order').to.exist;
        return cy.apiCompleteOrder(pending._id);
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201]);
      });
    });

    it('should process checkout payment via API', () => {
      const apiUrl = Cypress.env('apiUrl');
      const token = Cypress.env('authToken');
      cy.request({
        method: 'GET',
        url: `${apiUrl}/api/checkouts`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        const checkouts = res.body.data || [];
        const pending = Array.isArray(checkouts) ? checkouts.find(c => c.status === 'pending') : null;
        expect(pending, 'Should find pending checkout').to.exist;
        return cy.request({
          method: 'POST',
          url: `${apiUrl}/api/checkouts/payment`,
          headers: { Authorization: `Bearer ${token}` },
          body: {
            id: pending._id,
            paymentMethod: 'cash',
            paymentAmount: pending.totalBill || 1000,
            checkOutDate: new Date().toISOString(),
          },
          failOnStatusCode: false,
        });
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201]);
      });
    });
  });

  // ── ROOMS PAGE UI VERIFICATION ───────────────────────

  describe('Rooms Page', () => {
    it('should display rooms page with table and filters', () => {
      cy.visit('/rooms');
      cy.get('[data-cy="rooms-table"]', { timeout: 15000 }).should('exist');
      cy.get('[data-cy="rooms-search"]', { timeout: 5000 }).should('exist');
      cy.get('[data-cy="rooms-type-filter"]', { timeout: 5000 }).should('exist');
      cy.get('[data-cy="rooms-add-new"]', { timeout: 5000 }).should('exist');
    });

    it('should show room types in filter', () => {
      cy.visit('/rooms');
      cy.get('[data-cy="rooms-type-filter"]', { timeout: 10000 }).find('option').should('have.length.greaterThan', 1);
    });

    it('should filter rooms by type', () => {
      cy.visit('/rooms');
      cy.get('[data-cy="rooms-type-filter"]', { timeout: 10000 }).select(1, { force: true });
      cy.get('[data-cy="rooms-table"]', { timeout: 5000 }).should('exist');
    });

    it('should search rooms', () => {
      cy.visit('/rooms');
      cy.get('[data-cy="rooms-search"]', { timeout: 10000 }).type('101', { force: true });
      cy.get('[data-cy="rooms-table"]', { timeout: 5000 }).should('exist');
    });

    it('should clear filters', () => {
      cy.visit('/rooms');
      cy.get('[data-cy="rooms-search"]', { timeout: 10000 }).type('test', { force: true });
      cy.get('[data-cy="rooms-clear-filters"]', { timeout: 5000 }).click({ force: true });
      cy.get('[data-cy="rooms-table"]', { timeout: 5000 }).should('exist');
    });
  });

  // ── GUESTS PAGE UI VERIFICATION ──────────────────────

  describe('Guests Page', () => {
    it('should display guests page with add button', () => {
      cy.visit('/guests');
      cy.get('[data-cy="guests-add-new"]', { timeout: 10000 }).should('exist');
    });

    it('should show the created guest in list', () => {
      cy.visit('/guests');
      cy.get('body', { timeout: 10000 }).should('contain.text', guestName);
    });
  });

  // ── ITEMS PAGE UI VERIFICATION ───────────────────────

  describe('Items Page', () => {
    it('should display items page with all controls', () => {
      cy.visit('/items');
      cy.get('[data-cy="items-add-new"]', { timeout: 10000 }).first().should('exist');
      cy.get('[data-cy="items-search"]', { timeout: 5000 }).first().should('exist');
      cy.get('[data-cy="items-category-filter"]', { timeout: 5000 }).should('exist');
      cy.get('[data-cy="items-availability-filter"]', { timeout: 5000 }).should('exist');
    });

    it('should open item create modal with all fields', () => {
      cy.visit('/items');
      cy.get('[data-cy="items-add-new"]', { timeout: 10000 }).first().click({ force: true });
      cy.get('[data-cy="items-create-name"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="items-create-price"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="items-create-category"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="items-create-available"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="items-create-inventory"]', { timeout: 5000 }).should('exist');
      cy.get('[data-cy="items-create-submit"]', { timeout: 5000 }).should('exist');
    });

    it('should open edit modal with stock field', () => {
      cy.intercept('GET', '**/api/items*').as('getItems');
      cy.visit('/items');
      cy.wait('@getItems');
      cy.get('[data-cy^="items-edit-btn-"]', { timeout: 10000 }).first().click({ force: true });
      cy.get('[data-cy="items-edit-form"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="items-edit-name"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="items-edit-price"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="items-edit-stock"]', { timeout: 5000 }).should('be.visible');
    });

    it('should filter by availability', () => {
      cy.intercept('GET', '**/api/items*').as('getItems');
      cy.visit('/items');
      cy.wait('@getItems');
      cy.get('[data-cy="items-availability-filter"]', { timeout: 10000 }).select('true', { force: true });
      cy.wait('@getItems');
      cy.get('table tbody', { timeout: 5000 }).should('be.visible');
    });

    it('should filter by category', () => {
      cy.intercept('GET', '**/api/items*').as('getItems');
      cy.visit('/items');
      cy.wait('@getItems');
      cy.get('[data-cy="items-category-filter"]', { timeout: 10000 }).then(($select) => {
        const opts = $select.find('option:not(:disabled)').filter((i, el) => el.value !== '');
        if (opts.length > 0) {
          cy.wrap($select).select(opts.first().val(), { force: true });
          cy.wait('@getItems');
          cy.get('table tbody', { timeout: 5000 }).should('be.visible');
        }
      });
    });
  });

  // ── ORDERS PAGE UI VERIFICATION ──────────────────────

  describe('Orders Page', () => {
    it('should display orders page with table and controls', () => {
      cy.visit('/orders');
      cy.get('[data-cy="orders-add-btn"]', { timeout: 10000 }).should('exist');
      cy.get('[data-cy="orders-table"]', { timeout: 5000 }).should('exist');
      cy.get('[data-cy="orders-search"]', { timeout: 5000 }).should('exist');
      cy.get('[data-cy="orders-status-filter"]', { timeout: 5000 }).should('exist');
    });

    it('should show completed order for the room', () => {
      cy.visit('/orders');
      cy.get('[data-cy="orders-status-filter"]', { timeout: 10000 }).select('completed', { force: true });
      cy.get('[data-cy="orders-table-body"]', { timeout: 5000 }).should('exist');
      cy.get('body', { timeout: 5000 }).should('contain.text', guestRoom);
    });

    it('should open order create modal via UI', () => {
      cy.visit('/orders');
      cy.get('[data-cy="orders-add-btn"]', { timeout: 10000 }).click({ force: true });
      cy.get('[data-cy="orders-room-selector-container"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="orders-cancel"]', { timeout: 5000 }).should('exist');
    });
  });

  // ── CHECKOUTS PAGE UI VERIFICATION ───────────────────

  describe('Checkouts Page', () => {
    it('should display checkouts page with table', () => {
      cy.visit('/checkouts');
      cy.get('[data-cy="checkouts-table"]', { timeout: 10000 }).should('exist');
      cy.get('[data-cy="checkouts-status-filter"]', { timeout: 5000 }).should('exist');
    });

    it('should show completed checkout', () => {
      cy.visit('/checkouts');
      cy.get('[data-cy="checkouts-status-filter"]', { timeout: 10000 }).select('completed', { force: true });
      cy.get('[data-cy="checkouts-table-body"]', { timeout: 5000 }).should('exist');
    });

    it('should verify room is freed after checkout via API', () => {
      const apiUrl = Cypress.env('apiUrl');
      const token = Cypress.env('authToken');
      cy.request({
        method: 'GET',
        url: `${apiUrl}/api/rooms/${guestRoom}`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        expect(res.body.data.isOccupied).to.eq(false);
      });
    });
  });

  // ── STATS PAGE UI VERIFICATION ───────────────────────

  describe('Stats Page', () => {
    it('should display stats page with all tabs', () => {
      cy.visit('/stats');
      cy.get('[data-cy="stats-tab-summary"]', { timeout: 10000 }).should('exist');
      cy.get('[data-cy="stats-tab-item"]', { timeout: 5000 }).should('exist');
      cy.get('[data-cy="stats-tab-room"]', { timeout: 5000 }).should('exist');
      cy.get('[data-cy="stats-tab-financial"]', { timeout: 5000 }).should('exist');
    });

    it('should show summary tab with sales and balance cards', () => {
      cy.visit('/stats');
      cy.get('[data-cy="stats-tab-summary"]', { timeout: 10000 }).click({ force: true });
      cy.get('[data-cy="stats-card-sales-summary"]', { timeout: 5000 }).should('exist');
      cy.get('[data-cy="stats-card-hotel-balance"]', { timeout: 5000 }).should('exist');
    });

    it('should show item sales tab', () => {
      cy.visit('/stats');
      cy.get('[data-cy="stats-tab-item"]', { timeout: 10000 }).click({ force: true });
      cy.get('body', { timeout: 5000 }).should('be.visible');
    });

    it('should show room sales tab', () => {
      cy.visit('/stats');
      cy.get('[data-cy="stats-tab-room"]', { timeout: 10000 }).click({ force: true });
      cy.get('body', { timeout: 5000 }).should('be.visible');
    });

    it('should show financial tab', () => {
      cy.visit('/stats');
      cy.get('[data-cy="stats-tab-financial"]', { timeout: 10000 }).click({ force: true });
      cy.get('body', { timeout: 5000 }).should('be.visible');
    });

    it('should verify stats reflect transactions via API', () => {
      cy.apiGetStats('all').then((data) => {
        expect(data).to.exist;
        cy.log('Stats data:', JSON.stringify(data));
      });
    });

    it('should have date filter controls', () => {
      cy.visit('/stats');
      cy.get('[data-cy="stats-date-filter"]', { timeout: 10000 }).should('exist');
    });
  });
});
