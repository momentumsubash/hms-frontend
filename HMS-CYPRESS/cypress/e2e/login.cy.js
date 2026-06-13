/// <reference types="cypress" />

const API_BASE = 'http://localhost:3000/api';

describe('Login Page', () => {
  it('should log in via API and reach dashboard', () => {
    cy.log('=== Logging in via API ===')
    cy.visit('http://localhost:3001/login')
    cy.window().then((win) => {
      return cy.request('POST', `${API_BASE}/auth/login`, {
        email: 'manager@momentum.com',
        password: 'Manager@123',
      }).then((resp) => {
        expect(resp.status).to.eq(200)
        expect(resp.body).to.have.property('token')
        win.localStorage.setItem('token', resp.body.token)
        if (resp.body.user) {
          win.localStorage.setItem('user', JSON.stringify(resp.body.user))
        }
        cy.log(`Login successful. Token: ${resp.body.token.substring(0, 20)}...`)
      })
    })
    cy.visit('http://localhost:3001/dashboard')
    cy.url({ timeout: 15000 }).should('include', '/dashboard')
    cy.get('body', { timeout: 10000 }).should('contain.text', 'Dashboard')
    cy.log('=== Dashboard loaded ===')
  })
})
