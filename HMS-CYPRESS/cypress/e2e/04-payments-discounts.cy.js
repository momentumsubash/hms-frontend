import * as helpers from '../support/helpers';

describe('E2E: Referrers & Discounts', () => {
  const uniqueId = Date.now();

  beforeEach(() => {
    cy.loginAsManager();
  });

  describe('Referrer Management', () => {
    it('should view referrers page', () => {
      cy.get('[data-cy="referrers-nav"]').click();
      cy.get('[data-cy="referrers-table"]', { timeout: 5000 }).should('exist');
      cy.get('[data-cy="referrers-search"]').first().should('exist');
    });

    it('should search referrers', () => {
      cy.get('[data-cy="referrers-nav"]').click();
      cy.get('[data-cy="referrers-search"]').first().type('test', { force: true });
      cy.wait(500);
      cy.get('[data-cy="referrers-search"]').first().clear({ force: true });
    });

    it('should show referrer stats', () => {
      cy.get('[data-cy="referrers-nav"]').click();
      cy.get('[data-cy="referrers-stat-total"]', { timeout: 5000 }).should('exist');
      cy.get('[data-cy="referrers-stat-active"]').should('exist');
    });
  });

  describe('Discount Management', () => {
    it('should view checkouts page', () => {
      cy.get('[data-cy="checkouts-nav"]').click();
      cy.get('[data-cy="checkouts-table"]', { timeout: 5000 }).should('exist');
    });
  });
});
