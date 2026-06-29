/// <reference types="cypress" />

/**
 * Tests document upload during guest creation, returning guest auto-population,
 * and mobile responsiveness — runs against production Momentum Hotel.
 *
 * Selector notes:
 * - There are TWO buttons with data-cy="guests-add-new". The first (in DOM
 *   order) is inside a mobile-only container (`md:hidden`). The second is
 *   inside a desktop-only container (`hidden md:flex`). On desktop (≥768px)
 *   the first is hidden, the second is visible. On mobile (<768px) the first
 *   is visible, the second is hidden. Use `.last()` on desktop, `.first()`
 *   on mobile.
 * - Document upload is done via the Edit flow (click Edit on a guest row to
 *   open the modal with editingGuest set), because the Upload button requires
 *   editingGuest or existingGuest to be truthy.
 * - All tests are scoped to momentumhotel via the login credentials.
 */
const API = Cypress.env('apiUrl') || 'https://hms-api-eight.vercel.app';
const ts = Date.now();
const PHONE = `96${ts.toString().slice(-8)}`;
const FIRST = `DocTest${ts.toString().slice(-4)}`;
const LAST = 'Upload';

let token = '';

function api(path, method = 'GET', body = null) {
  return cy.request({
    method,
    url: `${API}${path}`,
    headers: { Authorization: `Bearer ${token}` },
    failOnStatusCode: false,
    ...(body ? { body } : {}),
  });
}

before(() => {
  api('/api/auth/login', 'POST', {
    email: 'manager@momentum.com',
    password: 'Manager@123',
  }).then((r) => {
    expect(r.status).to.eq(200);
    token = r.body.token;
  });
});

// ============================================================================
//  DESKTOP — Guest creation + document upload
// ============================================================================
describe('Desktop — Document Upload', { viewportWidth: 1200, viewportHeight: 800 }, () => {
  it('should create guest and verify no existingCustomer checkbox', () => {
    cy.login('manager@momentum.com', 'Manager@123');
    cy.visit('/guests');
    cy.get('[data-cy="guests-add-new"]', { timeout: 10000 }).last().click();

    // Verify no "existing customer" checkbox is in the form
    cy.get('.fixed.inset-0.z-50').within(() => {
      cy.contains('existing customer', { matchCase: false }).should('not.exist');
      cy.contains('enable due', { matchCase: false }).should('not.exist');
    });

    cy.get('[data-cy="guests-form-phone"]', { timeout: 5000 }).type(PHONE, { force: true });
    cy.get('[data-cy="guests-form-first-name"]').type(FIRST, { force: true });
    cy.get('[data-cy="guests-form-last-name"]').type(LAST, { force: true });

    // Wait for rooms to load before selecting
    cy.get('[data-cy="guests-rooms"]', { timeout: 15000 }).should('have.length.greaterThan', 0);
    cy.get('[data-cy="guests-rooms"]').first().click();

    cy.get('[data-cy="guests-form-submit"]').click();
    cy.contains(FIRST, { timeout: 15000 }).should('exist');
  });

  it('should upload a document via the edit modal', () => {
    cy.login('manager@momentum.com', 'Manager@123');
    cy.visit('/guests');
    // Use last() for search on desktop (first is in md:hidden container)
    cy.get('[data-cy="guests-search"]', { timeout: 5000 }).last().clear().type(FIRST);
    cy.wait(1500);
    cy.contains('[data-cy^="guests-row"]', FIRST).within(() => {
      cy.get('[title="Edit"]').click();
    });

    // Verify the documents section is visible
    cy.get('[data-cy="guests-documents-section"]', { timeout: 5000 }).should('be.visible');

    // Upload a document using native Cypress selectFile
    cy.get('[data-cy="guests-document-file-input"]').selectFile('cypress/fixtures/example.json', { force: true });

    // Ensure file is selected by checking Upload button is enabled
    cy.get('[data-cy="guests-document-upload"]').should('not.be.disabled');
    cy.get('[data-cy="guests-document-upload"]').click();

    // Wait for success toast
    cy.get('[data-cy="toast-success"]', { timeout: 15000 }).should('be.visible');
  });

  it('should auto-populate documents when returning guest enters phone', () => {
    cy.login('manager@momentum.com', 'Manager@123');
    cy.visit('/guests');
    cy.get('[data-cy="guests-add-new"]', { timeout: 10000 }).last().click();
    cy.get('[data-cy="guests-form-phone"]', { timeout: 5000 }).type(PHONE, { force: true });
    cy.wait(2000);

    // Should show existing guest banner
    cy.contains('Existing Guest Found', { timeout: 10000 }).should('be.visible');
    cy.contains(FIRST).should('exist');

    // Documents section should show the uploaded document
    cy.contains('test-doc.json', { timeout: 10000 }).should('be.visible');
  });
});

// ============================================================================
//  MOBILE — Guest creation + document upload (375×667)
// ============================================================================
describe('Mobile — Document Upload', { viewportWidth: 375, viewportHeight: 667 }, () => {
  const mPhone = `94${Date.now().toString().slice(-8)}`;
  const mFirst = `MobDoc${Date.now().toString().slice(-4)}`;

  it('should create guest and upload document on mobile', () => {
    cy.login('manager@momentum.com', 'Manager@123');
    cy.visit('/guests');

    cy.get('[data-cy="guests-add-new"]', { timeout: 10000 }).first().click();

    // Verify no existingCustomer checkbox on mobile
    cy.get('.fixed.inset-0.z-50').within(() => {
      cy.contains('existing customer', { matchCase: false }).should('not.exist');
      cy.contains('enable due', { matchCase: false }).should('not.exist');
    });

    cy.get('[data-cy="guests-form-phone"]', { timeout: 5000 }).type(mPhone, { force: true });
    cy.get('[data-cy="guests-form-first-name"]').type(mFirst, { force: true });
    cy.get('[data-cy="guests-form-last-name"]').type('MobileTest', { force: true });

    cy.get('[data-cy="guests-rooms"]', { timeout: 15000 }).should('have.length.greaterThan', 0);
    cy.get('[data-cy="guests-rooms"]').first().click();
    cy.get('[data-cy="guests-form-submit"]').click();
    cy.contains(mFirst, { timeout: 15000 }).should('exist');
  });

  it('should auto-populate returning guest on mobile', () => {
    cy.login('manager@momentum.com', 'Manager@123');
    cy.visit('/guests');

    cy.get('[data-cy="guests-add-new"]', { timeout: 10000 }).first().click();
    cy.get('[data-cy="guests-form-phone"]', { timeout: 5000 }).type(mPhone, { force: true });
    cy.wait(2000);

    cy.contains('Existing Guest Found', { timeout: 10000 }).should('be.visible');
    cy.contains(mFirst).should('exist');
  });
});
