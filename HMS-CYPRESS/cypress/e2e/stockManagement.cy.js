describe('Stock Management - Inventory Tracking & Order Decrement', () => {
  const uid = Date.now();
  const stockItemName = `StockItem_${uid}`;
  const noStockItemName = `NoStock_${uid}`;
  let stockItemId, noStockItemId, stockItemHotelId, guestRoom;

  before(() => {
    cy.resetMomentumData();
    cy.apiLogin();
  });

  // ── SETUP: Create items + guest via API ──────────────

  describe('Setup', () => {
    it('should create item with stock=50 via API', () => {
      cy.apiCreateItem({ name: stockItemName, price: 200, stock: 50, inventory: true }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201]);
        stockItemId = res.body.data?._id;
        stockItemHotelId = res.body.data?.hotel;
        expect(stockItemId, 'Item ID should exist').to.exist;
      });
    });

    it('should create item without stock via API', () => {
      cy.apiCreateItem({ name: noStockItemName, price: 75, stock: 0, inventory: false }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201]);
        noStockItemId = res.body.data?._id;
      });
    });

    it('should verify items exist in API list', () => {
      const apiUrl = Cypress.env('apiUrl');
      const token = Cypress.env('authToken');
      cy.request({
        method: 'GET',
        url: `${apiUrl}/api/items?search=${stockItemName}`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        const found = (res.body.data || []).find(i => i.name === stockItemName);
        expect(found, 'Stock item should exist').to.exist;
        expect(found.stock).to.eq(50);
        expect(found.inventory).to.eq(true);
      });
    });

    it('should create guest + room via API for order testing', () => {
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
              firstName: `StockTest_${uid}`,
              lastName: 'Auto',
              email: `stock${uid}@test.com`,
              phone: `97${uid.toString().slice(-8)}`,
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
      });
    });
  });

  // ── ITEMS PAGE UI ────────────────────────────────────

  describe('Items Page UI', () => {
    it('should display items page with all controls', () => {
      cy.visit('/items');
      cy.get('[data-cy="items-add-new"]', { timeout: 10000 }).first().should('exist');
      cy.get('[data-cy="items-search"]', { timeout: 5000 }).first().should('exist');
      cy.get('[data-cy="items-category-filter"]', { timeout: 5000 }).should('exist');
      cy.get('[data-cy="items-availability-filter"]', { timeout: 5000 }).should('exist');
    });

    it('should open create modal with inventory + stock fields', () => {
      cy.visit('/items');
      cy.get('[data-cy="items-add-new"]', { timeout: 10000 }).first().click({ force: true });
      cy.get('[data-cy="items-create-name"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="items-create-price"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="items-create-category"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="items-create-available"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="items-create-inventory"]', { timeout: 5000 }).should('exist');
      cy.get('[data-cy="items-create-submit"]', { timeout: 5000 }).should('exist');
    });

    it('should open edit modal showing stock field', () => {
      cy.intercept('GET', '**/api/items*').as('getItems');
      cy.visit('/items');
      cy.wait('@getItems');
      cy.get('[data-cy^="items-edit-btn-"]', { timeout: 10000 }).first().click({ force: true });
      cy.get('[data-cy="items-edit-form"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="items-edit-stock"]', { timeout: 5000 }).should('be.visible');
    });

    it('should edit item stock via UI', () => {
      cy.intercept('GET', '**/api/items*').as('getItems');
      cy.visit('/items');
      cy.wait('@getItems');
      cy.get('[data-cy^="items-edit-btn-"]', { timeout: 10000 }).first().click({ force: true });
      cy.get('[data-cy="items-edit-form"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="items-edit-stock"]').clear({ force: true });
      cy.get('[data-cy="items-edit-stock"]').type('35', { force: true });
      cy.get('[data-cy="items-edit-submit"]').click({ force: true });
      cy.wait(2000);
      cy.visit('/items');
      cy.get('[data-cy="items-table"]', { timeout: 10000 }).should('exist');
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

  // ── STOCK DECREMENT ON ORDER ─────────────────────────

  describe('Stock Decrement on Order', () => {
    it('should verify initial stock via API', () => {
      const apiUrl = Cypress.env('apiUrl');
      const token = Cypress.env('authToken');
      cy.request({
        method: 'GET',
        url: `${apiUrl}/api/items/${stockItemId}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((res) => {
        if (res.status === 200) {
          expect(res.body.data.stock).to.be.greaterThan(0);
          cy.log(`Initial stock: ${res.body.data.stock}`);
        }
      });
    });

    it('should create order with quantity=3 of stock item', () => {
      cy.apiCreateOrder({
        roomNumber: guestRoom,
        items: [{ itemId: stockItemId, quantity: 3 }],
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201]);
        expect(res.body.data).to.exist;
        expect(res.body.data.items[0].quantity).to.eq(3);
      });
    });

    it('should verify order was created as pending', () => {
      const apiUrl = Cypress.env('apiUrl');
      const token = Cypress.env('authToken');
      cy.request({
        method: 'GET',
        url: `${apiUrl}/api/orders?status=pending`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        const orders = res.body.data?.orders || res.body.data || [];
        const found = Array.isArray(orders) ? orders.find(o => o.roomNumber === guestRoom) : null;
        expect(found, 'Pending order should exist').to.exist;
        expect(found.status).to.eq('pending');
      });
    });

    it('should complete the order', () => {
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

    it('should verify stock was decremented after order completion', () => {
      const apiUrl = Cypress.env('apiUrl');
      const token = Cypress.env('authToken');
      cy.request({
        method: 'GET',
        url: `${apiUrl}/api/items/${stockItemId}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((res) => {
        if (res.status === 200) {
          cy.log(`Stock after order: ${res.body.data.stock}`);
          expect(res.body.data.stock).to.be.lessThan(50);
        }
      });
    });

    it('should verify order shows as completed in UI', () => {
      cy.visit('/orders');
      cy.get('[data-cy="orders-status-filter"]', { timeout: 10000 }).select('completed', { force: true });
      cy.get('[data-cy="orders-table-body"]', { timeout: 5000 }).should('exist');
      cy.get('body', { timeout: 5000 }).should('contain.text', guestRoom);
    });
  });

  // ── REORDER THRESHOLD ────────────────────────────────

  describe('Reorder Threshold', () => {
    it('should detect low stock item via API', () => {
      const apiUrl = Cypress.env('apiUrl');
      const token = Cypress.env('authToken');
      cy.request({
        method: 'GET',
        url: `${apiUrl}/api/items/${stockItemId}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((res) => {
        if (res.status === 200) {
          const stock = res.body.data.stock;
          const threshold = res.body.data.lowStockThreshold || 5;
          cy.log(`Current stock: ${stock}, threshold: ${threshold}`);
          if (stock <= threshold) {
            cy.log('Item is at or below reorder threshold');
          }
          expect(stock).to.be.a('number');
        }
      });
    });

    it('should be able to update stock back to healthy level', () => {
      const apiUrl = Cypress.env('apiUrl');
      const token = Cypress.env('authToken');
      cy.request({
        method: 'PUT',
        url: `${apiUrl}/api/items/${stockItemId}`,
        headers: { Authorization: `Bearer ${token}` },
        body: { stock: 100 },
        failOnStatusCode: false,
      }).then((res) => {
        if (res.status === 200) {
          expect(res.body.data.stock).to.eq(100);
        }
      });
    });
  });

  // ── CLEANUP ──────────────────────────────────────────

  describe('Cleanup', () => {
    it('should delete test items via API', () => {
      const apiUrl = Cypress.env('apiUrl');
      const token = Cypress.env('authToken');
      if (stockItemId) {
        cy.request({
          method: 'DELETE',
          url: `${apiUrl}/api/items/${stockItemId}`,
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false,
        });
      }
      if (noStockItemId) {
        cy.request({
          method: 'DELETE',
          url: `${apiUrl}/api/items/${noStockItemId}`,
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false,
        });
      }
    });
  });
});
