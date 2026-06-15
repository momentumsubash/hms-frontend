Cypress.Commands.add('login', (email = 'manager@momentum.com', password = 'Manager@123') => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3000';
  cy.visit('/login', { log: false });
  cy.window().then(win => {
    const t = win.localStorage.getItem('token');
    if (t && t !== 'null' && t !== 'undefined') {
      cy.visit('/dashboard', { log: false });
      cy.url({ timeout: 10000 }).should('include', '/dashboard');
      cy.get('body', { timeout: 10000 }).should('contain.text', 'Dashboard');
      return;
    }
    cy.request({
      method: 'POST',
      url: `${apiUrl}/api/auth/login`,
      body: { email, password },
      failOnStatusCode: false,
    }).then(resp => {
      const retryWithDelay = (waitMs, maxMs) => {
        if (resp.status === 429 && waitMs <= maxMs) {
          cy.wait(waitMs, { log: false });
          return cy.request({
            method: 'POST',
            url: `${apiUrl}/api/auth/login`,
            body: { email, password },
            failOnStatusCode: false,
          }).then(retryResp => {
            resp = retryResp;
            return retryWithDelay(waitMs * 2, maxMs);
          });
        }
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property('token');
        win.localStorage.setItem('token', resp.body.token);
        if (resp.body.user) {
          win.localStorage.setItem('user', JSON.stringify(resp.body.user));
          if (resp.body.user.hotel) {
            win.localStorage.setItem('hotel', JSON.stringify({
              _id: typeof resp.body.user.hotel === 'string' ? resp.body.user.hotel : resp.body.user.hotel._id || resp.body.user.hotel
            }));
          }
        }
        cy.visit('/dashboard', { log: false });
        cy.url({ timeout: 10000 }).should('include', '/dashboard');
        cy.get('body', { timeout: 10000 }).should('contain.text', 'Dashboard');
      };
      return retryWithDelay(15000, 120000);
    });
  });
});
