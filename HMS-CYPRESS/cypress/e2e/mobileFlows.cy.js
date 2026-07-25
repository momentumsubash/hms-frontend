describe('Mobile Viewport (375x812) - Key Flows', () => {
  const uid = Date.now();

  before(() => {
    cy.resetMomentumData();
    cy.viewport(375, 812);
    cy.apiLogin();
  });

  beforeEach(() => {
    cy.viewport(375, 812);
  });

  // ── PAGE LOADS ───────────────────────────────────────

  describe('Page Loads', () => {
    const pages = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Guests', path: '/guests' },
      { name: 'Rooms', path: '/rooms' },
      { name: 'Orders', path: '/orders' },
      { name: 'Checkouts', path: '/checkouts' },
      { name: 'Items', path: '/items' },
      { name: 'Stats', path: '/stats' },
      { name: 'Departments', path: '/departments' },
      { name: 'Salary', path: '/salary' },
      { name: 'Leaves', path: '/leaves' },
      { name: 'Staff', path: '/staff' },
    ];

    pages.forEach(({ name, path }) => {
      it(`Mobile: ${name} page loads`, () => {
        cy.visit(path);
        cy.get('body', { timeout: 15000 }).should('be.visible');
      });
    });
  });

  // ── NAVIGATION ───────────────────────────────────────

  describe('Navigation', () => {
    it('should navigate between pages on mobile', () => {
      cy.visit('/dashboard');
      cy.get('body', { timeout: 10000 }).should('be.visible');
      cy.visit('/guests');
      cy.get('[data-cy="guests-add-new"]', { timeout: 10000 }).should('exist');
      cy.visit('/rooms');
      cy.get('[data-cy="rooms-table"]', { timeout: 10000 }).should('exist');
      cy.visit('/orders');
      cy.get('[data-cy="orders-add-btn"]', { timeout: 10000 }).should('exist');
    });
  });

  // ── GUEST CREATION ───────────────────────────────────

  describe('Guest Creation on Mobile', () => {
    it('should create a guest via mobile form', () => {
      cy.intercept('POST', '**/api/guests').as('createGuest');
      cy.visit('/guests');
      cy.get('[data-cy="guests-add-new"]', { timeout: 10000 }).last().click({ force: true });
      cy.get('[data-cy="guests-form-first-name"]', { timeout: 5000 }).type(`MobGuest_${uid}`, { force: true });
      cy.get('[data-cy="guests-form-last-name"]').type('Test', { force: true });
      cy.get('[data-cy="guests-form-phone"]').type(`98${uid.toString().slice(-8)}`, { force: true });
      cy.get('[data-cy="guests-form-email"]').type(`mob${uid}@test.com`, { force: true });
      cy.get('[data-cy="guests-rooms"]').first().click({ force: true });
      cy.get('[data-cy="guests-form-submit"]').click({ force: true });
      cy.wait('@createGuest', { timeout: 10000 }).its('response.statusCode').should('be.oneOf', [200, 201]);
    });
  });

  // ── ORDER CREATION ───────────────────────────────────

  describe('Order Creation on Mobile', () => {
    it('should open order create modal on mobile', () => {
      cy.visit('/orders');
      cy.get('[data-cy="orders-add-btn"]', { timeout: 10000 }).click({ force: true });
      cy.get('[data-cy="orders-room-selector-container"]', { timeout: 5000 }).should('be.visible');
    });

    it('should show room dropdown on mobile', () => {
      cy.visit('/orders');
      cy.get('[data-cy="orders-add-btn"]', { timeout: 10000 }).click({ force: true });
      cy.get('[data-cy="orders-room-selector-container"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="orders-cancel"]', { timeout: 5000 }).should('exist');
    });
  });

  // ── ITEMS ────────────────────────────────────────────

  describe('Items on Mobile', () => {
    it('should display items page with add button', () => {
      cy.visit('/items');
      cy.get('[data-cy="items-add-new"]', { timeout: 10000 }).first().should('exist');
    });

    it('should search items on mobile', () => {
      cy.visit('/items');
      cy.get('[data-cy="items-search"]', { timeout: 10000 }).first().type('test', { force: true });
      cy.get('body', { timeout: 5000 }).should('be.visible');
    });

    it('should open create modal on mobile', () => {
      cy.visit('/items');
      cy.get('[data-cy="items-add-new"]', { timeout: 10000 }).first().click({ force: true });
      cy.get('[data-cy="items-create-name"]', { timeout: 5000 }).should('be.visible');
    });
  });

  // ── CHECKOUTS ────────────────────────────────────────

  describe('Checkouts on Mobile', () => {
    it('should display checkouts table on mobile', () => {
      cy.visit('/checkouts');
      cy.get('[data-cy="checkouts-table"]', { timeout: 10000 }).should('exist');
    });

    it('should filter checkouts by status on mobile', () => {
      cy.visit('/checkouts');
      cy.get('[data-cy="checkouts-status-filter"]', { timeout: 10000 }).select('pending', { force: true });
      cy.get('[data-cy="checkouts-table"]', { timeout: 5000 }).should('exist');
    });
  });

  // ── STATS ────────────────────────────────────────────

  describe('Stats on Mobile', () => {
    it('should display stats with tabs on mobile', () => {
      cy.visit('/stats');
      cy.get('[data-cy="stats-tab-summary"]', { timeout: 10000 }).should('exist');
    });

    it('should switch between stats tabs on mobile', () => {
      cy.visit('/stats');
      cy.get('[data-cy="stats-tab-summary"]', { timeout: 10000 }).click({ force: true });
      cy.get('[data-cy="stats-card-sales-summary"]', { timeout: 5000 }).should('exist');
      cy.get('[data-cy="stats-tab-item"]', { timeout: 5000 }).click({ force: true });
      cy.get('[data-cy="stats-item-sales-table"]', { timeout: 5000 }).should('exist');
    });
  });

  // ── HR PAGES ─────────────────────────────────────────

  describe('HR Pages on Mobile', () => {
    it('should display departments page on mobile', () => {
      cy.visit('/departments');
      cy.get('body', { timeout: 10000 }).should('be.visible');
    });

    it('should display salary page on mobile', () => {
      cy.visit('/salary');
      cy.get('body', { timeout: 10000 }).should('be.visible');
    });

    it('should display leaves page on mobile', () => {
      cy.visit('/leaves');
      cy.get('body', { timeout: 10000 }).should('be.visible');
    });

    it('should display staff page on mobile', () => {
      cy.visit('/staff');
      cy.get('body', { timeout: 10000 }).should('be.visible');
    });
  });
});
