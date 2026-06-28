import * as helpers from '../support/helpers';

describe('E2E: Orders & Checkouts', () => {
  beforeEach(() => {
    cy.loginAsManager();
  });

  it('should view orders table', () => {
    cy.get('[data-cy="orders-nav"]').click();
    cy.get('[data-cy="orders-table"]', { timeout: 5000 }).should('exist');
    cy.get('[data-cy="orders-search"]').first().should('exist');
  });

  it('should open order form', () => {
    cy.get('[data-cy="orders-nav"]').click();
    cy.get('[data-cy="orders-add-btn"]', { timeout: 5000 }).click({ force: true });
    cy.get('[data-cy="orders-room-selector-container"]', { timeout: 5000 }).should('exist');
    cy.get('[data-cy="orders-cancel"]', { timeout: 5000 }).click({ force: true });
  });

  it('should search orders', () => {
    cy.get('[data-cy="orders-nav"]').click();
    cy.get('[data-cy="orders-search"]').first().type('test', { force: true });
    cy.wait(1000);
    cy.get('[data-cy="orders-search"]').first().clear({ force: true });
  });

  it('should view checkouts table', () => {
    cy.get('[data-cy="checkouts-nav"]').click();
    cy.get('[data-cy="checkouts-table"]', { timeout: 5000 }).should('exist');
    cy.get('[data-cy="checkouts-search"]').should('exist');
  });

  it('should filter checkouts by status', () => {
    cy.get('[data-cy="checkouts-nav"]').click();
    cy.get('[data-cy="checkouts-status-filter"]', { timeout: 5000 }).select('completed', { force: true });
    cy.wait(500);
    cy.get('[data-cy="checkouts-status-filter"]').select('', { force: true });
  });
});
