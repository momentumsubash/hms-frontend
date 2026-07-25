describe('Departments Management', () => {
  const uniqueId = Date.now();
  const deptName = `TestDept_${uniqueId}`;

  before(() => {
    cy.login('manager@momentum.com', 'Manager@123');
  });

  it('should navigate to departments page', () => {
    cy.visit('/departments');
    cy.get('h1', { timeout: 5000 }).should('contain.text', 'Departments');
    cy.get('[data-cy="departments-search"]').should('exist');
    cy.get('[data-cy="departments-add-btn"]').should('exist');
  });

  it('should display existing departments', () => {
    cy.visit('/departments');
    cy.get('[data-cy="departments-add-btn"]', { timeout: 5000 }).should('exist');
  });

  it('should create a new department', () => {
    cy.intercept('POST', '**/api/departments').as('createDept');
    cy.visit('/departments');
    cy.get('[data-cy="departments-add-btn"]').click();
    cy.get('[data-cy="department-form-name"]', { timeout: 5000 }).type(deptName);
    cy.get('[data-cy="department-form-description"]').type('Cypress test department');
    cy.get('[data-cy="department-form-submit"]').click();
    cy.wait('@createDept', { timeout: 10000 }).its('response.statusCode').should('be.eq', 201);
    cy.get('body').should('contain.text', deptName);
  });

  it('should search departments', () => {
    cy.visit('/departments');
    cy.get('[data-cy="departments-search"]').type(deptName);
    cy.get(`[data-cy="department-card-${deptName}"]`, { timeout: 5000 }).should('exist');
  });

  it('should edit a department', () => {
    cy.intercept('PUT', '**/api/departments/*').as('updateDept');
    cy.visit('/departments');
    cy.get('[data-cy="departments-search"]').type(deptName);
    cy.get(`[data-cy="department-edit-${deptName}"]`, { timeout: 5000 }).click();
    cy.get('[data-cy="department-form-name"]').clear().type(`${deptName}_edited`);
    cy.get('[data-cy="department-form-submit"]').click();
    cy.wait('@updateDept', { timeout: 10000 }).its('response.statusCode').should('be.eq', 200);
    cy.get('body').should('contain.text', `${deptName}_edited`);
  });

  it('should delete a department', () => {
    cy.intercept('DELETE', '**/api/departments/*').as('deleteDept');
    cy.visit('/departments');
    cy.get('[data-cy="departments-search"]').type(`${deptName}_edited`);
    cy.get(`[data-cy="department-delete-${deptName}_edited"]`, { timeout: 5000 }).click();
    cy.on('window:confirm', () => true);
    cy.wait('@deleteDept', { timeout: 10000 }).its('response.statusCode').should('be.eq', 200);
  });
});
