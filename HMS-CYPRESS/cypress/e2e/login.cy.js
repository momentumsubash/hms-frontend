describe('Login Page', () => {
  it('should log in with valid credentials', () => {
    cy.visit('http://localhost:3001/login');
    cy.get('[data-cy="login-email"]').type('ram@mirana.com');
    cy.get('[data-cy="login-password"]').type('manager123');
    cy.get('[data-cy="login-submit"]').click();
    // Assert redirect to dashboard or presence of dashboard element
    cy.url().should('include', '/dashboard');
    cy.get('body').should('contain.text', 'Dashboard');
  });
});
