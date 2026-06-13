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
Cypress.Commands.add('login', (email = 'manager@momentum.com', password = 'Manager@123') => {
  cy.visit('http://localhost:3001/login');
  cy.window().then((win) => {
    return cy.request('POST', 'http://localhost:3000/api/auth/login', { email, password })
      .then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property('token');
        win.localStorage.setItem('token', resp.body.token);
        if (resp.body.user) {
          win.localStorage.setItem('user', JSON.stringify(resp.body.user));
        }
      });
  });
  cy.visit('http://localhost:3001/dashboard');
  cy.url({ timeout: 15000 }).should('include', '/dashboard');
  cy.get('body', { timeout: 10000 }).should('contain.text', 'Dashboard');
});


