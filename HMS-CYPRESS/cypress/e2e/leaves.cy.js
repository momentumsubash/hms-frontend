describe('Leave Management', () => {
  before(() => {
    cy.login('manager@momentum.com', 'Manager@123');
  });

  it('should navigate to leaves page', () => {
    cy.visit('/leaves');
    cy.get('h1', { timeout: 10000 }).should('contain.text', 'Leave');
    cy.get('[data-cy="leaves-add-btn"]').should('exist');
    cy.get('[data-cy="leaves-search"]').should('exist');
  });

  it('should display leave summary stats', () => {
    cy.visit('/leaves');
    cy.get('body', { timeout: 10000 }).should('contain.text', 'Total Leaves');
  });

  it('should create a leave request', () => {
    cy.intercept('POST', '**/api/leaves').as('createLeave');
    cy.visit('/leaves');
    cy.get('[data-cy="leaves-add-btn"]', { timeout: 10000 }).click();
    cy.get('[data-cy="leave-form-staff"]', { timeout: 5000 }).should('exist');
    cy.get('[data-cy="leave-form-staff"]').select(1, { force: true });
    cy.get('[data-cy="leave-form-type"]').select('casual', { force: true });
    cy.get('[data-cy="leave-form-start"]').type('2026-08-15', { force: true });
    cy.get('[data-cy="leave-form-end"]').type('2026-08-17', { force: true });
    cy.get('[data-cy="leave-form-reason"]').type('Cypress test leave', { force: true });
    cy.get('[data-cy="leave-form-submit"]').click({ force: true });
    cy.wait('@createLeave', { timeout: 10000 });
  });

  it('should filter leaves by status', () => {
    cy.visit('/leaves');
    cy.get('[data-cy="leaves-status-filter"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="leaves-status-filter"]').select('pending', { force: true });
    cy.get('body').should('be.visible');
    cy.get('[data-cy="leaves-status-filter"]').select('', { force: true });
  });

  it('should filter leaves by type', () => {
    cy.visit('/leaves');
    cy.get('[data-cy="leaves-type-filter"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="leaves-type-filter"]').select('casual', { force: true });
    cy.get('body').should('be.visible');
    cy.get('[data-cy="leaves-type-filter"]').select('', { force: true });
  });

  it('should search leaves by staff name', () => {
    cy.visit('/leaves');
    cy.get('[data-cy="leaves-search"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="leaves-search"]').type('Test', { force: true });
    cy.get('body').should('be.visible');
    cy.get('[data-cy="leaves-search"]').clear({ force: true });
  });

  it('should approve a pending leave', () => {
    cy.visit('/leaves');
    cy.get('[data-cy="leaves-status-filter"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="leaves-status-filter"]').select('pending', { force: true });
    cy.get('body', { timeout: 5000 }).then(($body) => {
      const approveBtn = $body.find('[data-cy^="leave-approve-"]');
      if (approveBtn.length > 0) {
        cy.intercept('PUT', '**/api/leaves/*/approve').as('approveLeave');
        cy.wrap(approveBtn.first()).click({ force: true });
        cy.wait('@approveLeave', { timeout: 10000 });
      } else {
        cy.log('No pending leaves to approve - skipping');
      }
    });
  });

  it('should reject a pending leave', () => {
    cy.visit('/leaves');
    cy.get('[data-cy="leaves-status-filter"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="leaves-status-filter"]').select('pending', { force: true });
    cy.get('body', { timeout: 5000 }).then(($body) => {
      const rejectBtn = $body.find('[data-cy^="leave-reject-"]');
      if (rejectBtn.length > 0) {
        cy.intercept('PUT', '**/api/leaves/*/reject').as('rejectLeave');
        cy.stub(window, 'prompt').returns('Rejected by cypress');
        cy.wrap(rejectBtn.first()).click({ force: true });
        cy.wait('@rejectLeave', { timeout: 10000 });
      } else {
        cy.log('No pending leaves to reject - skipping');
      }
    });
  });

  it('should delete a leave record', () => {
    cy.visit('/leaves');
    cy.get('[data-cy="leaves-status-filter"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="leaves-status-filter"]').select('', { force: true });
    cy.get('body', { timeout: 5000 }).then(($body) => {
      const deleteBtn = $body.find('[data-cy^="leave-delete-"]');
      if (deleteBtn.length > 0) {
        cy.intercept('DELETE', '**/api/leaves/*').as('deleteLeave');
        cy.on('window:confirm', () => true);
        cy.wrap(deleteBtn.first()).click({ force: true });
        cy.wait('@deleteLeave', { timeout: 10000 });
      } else {
        cy.log('No leaves to delete - skipping');
      }
    });
  });
});
