// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
Cypress.Commands.add('login', (email, password) => {
 cy.visit('http://localhost:3001/login');
    cy.get('[data-cy="login-email"]').type('ram@mirana.com');
    cy.get('[data-cy="login-password"]').type('manager123');
    cy.get('[data-cy="login-submit"]').click();
    // Assert redirect to dashboard or presence of dashboard element
    cy.url().should('include', '/dashboard');
    cy.get('body').should('contain.text', 'Dashboard');
});


