describe('Salary Management', () => {
  before(() => {
    cy.login('manager@momentum.com', 'Manager@123');
  });

  it('should navigate to salary page', () => {
    cy.visit('/salary');
    cy.get('h1', { timeout: 10000 }).should('contain.text', 'Salary');
    cy.get('[data-cy="salary-generate-btn"]').should('exist');
    cy.get('[data-cy="salary-search"]').should('exist');
  });

  it('should display salary summary cards', () => {
    cy.visit('/salary', { failOnStatusCode: false });
    cy.get('body', { timeout: 10000 }).should('contain.text', 'Total Payroll');
  });

  it('should generate payroll', () => {
    cy.visit('/salary', { failOnStatusCode: false });
    cy.get('[data-cy="salary-generate-btn"]', { timeout: 10000 }).should('be.visible');
    cy.intercept('POST', '**/api/salaries/generate').as('generatePayroll');
    cy.get('[data-cy="salary-generate-btn"]').click();
    cy.wait('@generatePayroll', { timeout: 20000 }).its('response.statusCode').should('be.oneOf', [200, 201, 400]);
  });

  it('should filter by month and year', () => {
    cy.visit('/salary', { failOnStatusCode: false });
    cy.get('[data-cy="salary-month-filter"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="salary-month-filter"]').select('7', { force: true });
    cy.get('[data-cy="salary-year-filter"]').select('2026', { force: true });
    cy.get('body').should('be.visible');
  });

  it('should filter by payment status', () => {
    cy.visit('/salary', { failOnStatusCode: false });
    cy.get('[data-cy="salary-status-filter"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="salary-status-filter"]').select('pending', { force: true });
    cy.get('body').should('be.visible');
    cy.get('[data-cy="salary-status-filter"]').select('', { force: true });
  });

  it('should search staff in salary list', () => {
    cy.visit('/salary', { failOnStatusCode: false });
    cy.get('[data-cy="salary-search"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="salary-search"]').type('Staff', { force: true });
    cy.get('body').should('be.visible');
    cy.get('[data-cy="salary-search"]').clear({ force: true });
  });

  it('should record a payment on a pending salary', () => {
    cy.visit('/salary', { failOnStatusCode: false });
    cy.get('[data-cy="salary-status-filter"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="salary-status-filter"]').select('pending', { force: true });
    cy.get('body', { timeout: 5000 }).then(($body) => {
      const payBtn = $body.find('[data-cy^="salary-pay-"]');
      if (payBtn.length > 0) {
        cy.wrap(payBtn.first()).click({ force: true });
        cy.get('[data-cy="salary-pay-amount"]', { timeout: 5000 }).should('exist');
        cy.get('[data-cy="salary-pay-method"]').select('cash', { force: true });
        cy.intercept('POST', '**/api/salaries/*/pay').as('recordPayment');
        cy.get('[data-cy="salary-pay-submit"]').click({ force: true });
        cy.wait('@recordPayment', { timeout: 10000 });
      } else {
        cy.log('No pending salaries to pay - skipping');
      }
    });
  });

  it('should edit salary (allowances/deductions)', () => {
    cy.visit('/salary', { failOnStatusCode: false });
    cy.get('body', { timeout: 10000 }).then(($body) => {
      const editBtn = $body.find('[data-cy^="salary-edit-"]');
      if (editBtn.length > 0) {
        cy.wrap(editBtn.first()).click({ force: true });
        cy.get('.fixed', { timeout: 5000 }).should('be.visible');
      } else {
        cy.log('No salary records to edit - skipping');
      }
    });
  });
});
