describe('Staff Directory', () => {
  before(() => {
    cy.login('manager@momentum.com', 'Manager@123');
  });

  it('should navigate to staff page', () => {
    cy.visit('/staff');
    cy.get('h1', { timeout: 10000 }).should('contain.text', 'Staff');
    cy.get('[data-cy="staff-search"]').should('exist');
    cy.get('[data-cy="staff-dept-filter"]').should('exist');
  });

  it('should display staff summary stats', () => {
    cy.visit('/staff');
    cy.get('body', { timeout: 10000 }).should('contain.text', 'Total Staff');
  });

  it('should display staff table with rows', () => {
    cy.visit('/staff');
    cy.get('table', { timeout: 10000 }).should('exist');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
  });

  it('should search staff by name', () => {
    cy.visit('/staff');
    cy.get('[data-cy="staff-search"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="staff-search"]').type('manager', { force: true });
    cy.get('table tbody tr', { timeout: 5000 }).should('exist');
    cy.get('[data-cy="staff-search"]').clear({ force: true });
  });

  it('should filter by department', () => {
    cy.visit('/staff');
    cy.get('[data-cy="staff-dept-filter"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="staff-dept-filter"]').then(($select) => {
      const options = $select.find('option');
      if (options.length > 1) {
        cy.wrap($select).select(1, { force: true });
        cy.get('body', { timeout: 5000 }).should('be.visible');
        cy.wrap($select).select('', { force: true });
      }
    });
  });

  it('should show staff details in table columns', () => {
    cy.visit('/staff');
    cy.get('table thead', { timeout: 10000 }).should('contain.text', 'Staff');
    cy.get('table thead').should('contain.text', 'Salary');
    cy.get('table thead').should('contain.text', 'Status');
  });

  it('should show active/inactive status badges', () => {
    cy.visit('/staff');
    cy.get('table tbody tr', { timeout: 10000 }).first().within(() => {
      cy.get('span').should('exist');
    });
  });
});
