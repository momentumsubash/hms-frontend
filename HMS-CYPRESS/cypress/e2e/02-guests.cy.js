import * as helpers from '../support/helpers';

describe('E2E: Guest Management', () => {
  beforeEach(() => {
    cy.loginAsManager();
  });

  it('should view guests list', () => {
    cy.get('[data-cy="guests-nav"]').click();
    cy.get('[data-cy="guests-table"]', { timeout: 5000 }).should('exist');
    cy.get('[data-cy^="guests-row-"]', { timeout: 5000 }).should('have.length.at.least', 1);
  });

  it('should search guests', () => {
    cy.get('[data-cy="guests-nav"]').click();
    cy.get('[data-cy="guests-search"]').first().type('test', { force: true });
    cy.wait(500);
    cy.get('[data-cy="guests-search"]').first().clear({ force: true });
  });

  it('should open add guest form', () => {
    cy.get('[data-cy="guests-nav"]').click();
    cy.get('[data-cy="guests-add-new"]').last().click({ force: true });
    cy.get('[data-cy="guests-form-first-name"]', { timeout: 5000 }).should('exist');
    cy.get('[data-cy="guests-form-cancel"]', { timeout: 5000 }).click({ force: true });
  });

  it('should filter guests by customer type', () => {
    cy.get('[data-cy="guests-nav"]').click();
    cy.get('[data-cy="guests-customer-filter"]').first().select('true', { force: true });
    cy.wait(500);
    cy.get('[data-cy="guests-customer-filter"]').first().select('', { force: true });
  });

  it('should filter guests by due status', () => {
    cy.get('[data-cy="guests-nav"]').click();
    cy.get('[data-cy="guests-due-filter"]').first().should('exist');
  });
});
