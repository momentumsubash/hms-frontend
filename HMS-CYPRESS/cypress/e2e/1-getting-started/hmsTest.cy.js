/// <reference types="cypress" />

import 'cypress-real-events/support';

const API_BASE = 'http://localhost:3000/api';

function loginViaAPI() {
  cy.request('POST', `${API_BASE}/auth/login`, {
    email: 'momentum.acharya@mirana.com',
    password: 'Manager@123',
  }).then((resp) => {
    expect(resp.status).to.eq(200)
    expect(resp.body).to.have.property('token')
    
    window.localStorage.setItem('token', resp.body.token)
    if (resp.body.user) {
      window.localStorage.setItem('user', JSON.stringify(resp.body.user))
    }
    
    cy.log(`Login successful. Token: ${resp.body.token.substring(0, 20)}...`)
  })
}

describe('Test HMS', () => {
  it('should log in via API and navigate to dashboard', () => {
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

  it('should navigate to guests after login', () => {
    cy.log('=== Navigating to guests page ===')
    cy.get('a[href="/guests"]', { timeout: 10000 }).should('exist').first().click({force:true})
    cy.url({ timeout: 10000 }).should('include', '/guests')
    cy.get('[data-cy="guests-add-btn"]', { timeout: 10000 }).should('be.visible').click()
    cy.log('=== Guests page loaded, add button clicked ===')
  })

  it('should add guest', () => {
    cy.log('=== Filling guest form ===')
    cy.get('[data-cy="guests-phone"]', { timeout: 5000 }).type('1234567899')
    cy.get('[data-cy="guests-idno"]').clear().type('ID-123/456')
    cy.get('[data-cy="guests-firstname"]').clear().type('John Doe')
    cy.get('[data-cy="guests-lastname"]').clear().type('Smith')
    cy.get('[data-cy="guests-occupation"]').clear().type('Engineer')
    cy.get('[data-cy="guests-email"]').clear().type('guestuser@noemail.com')
    cy.get('[data-cy="guests-vehicleno"]').clear().type('ABC-1234')
    cy.get('[data-cy="guests-purpose"]').clear().type('Business Trip')
    cy.get('[data-cy="guests-address"]').clear().type('123 Main St, Anytown, Nepal')

    cy.get('[data-cy="guests-rooms"]').select(2)

    cy.get('[data-cy="guests-roomdiscount"]').type('200')
    cy.get('[data-cy="guests-advancepaid"]').type('300')

    cy.get('[data-cy="guests-submit"]').scrollIntoView().click()
    cy.wait(3000)
    cy.log('=== Guest submitted ===')
  })

  it('Should add order', () => {
    cy.log('=== Navigating to orders page ===')
    cy.get('a[href="/orders"]', { timeout: 10000 }).first().click({force:true})
    cy.url({ timeout: 10000 }).should('include', '/orders')
    cy.log('=== Orders page loaded ===')

    cy.get('[data-cy="orders-add-btn"]', { timeout: 10000 }).should('be.visible').click()
    cy.get('[data-cy="orders-room-select"]', { timeout: 15000 }).click()
    cy.get('[data-cy="orders-room-dropdown"]', { timeout: 5000 }).should('be.visible')
    cy.get('[data-cy="orders-room-0"]', { timeout: 10000 }).click()
    cy.get('[data-cy="orders-items-list"]', { timeout: 10000 }).click()
    cy.get('[data-cy="orders-submit"]', { timeout: 10000 }).scrollIntoView().click({force:true}).wait(3000)
    cy.log('=== Order submitted ===')
  })

  it('Should change order status', () => {
    cy.log('=== Changing order status ===')
    cy.get('[data-cy="orders-status-btn-0"]', { timeout: 10000 }).scrollIntoView().click({force:true})
    cy.get('[data-cy="orders-status-modal"]', { timeout: 5000 }).should('be.visible').click({force:true})
    cy.get('[data-cy="orders-status-select"]').select(1)
    cy.get('[data-cy="orders-status-modal-update"]', { timeout: 5000 }).click({force:true}).wait(3000)
    cy.log('=== Order status changed ===')
  })

  it('Should checkout out', () => {
    cy.log('=== Navigating to checkouts page ===')
    cy.get('a[href="/checkouts"]', { timeout: 10000 }).first().click({force:true})
    cy.url({ timeout: 10000 }).should('include', '/checkouts')
    cy.log('=== Checkouts page loaded ===')
    
    cy.get('[data-cy="checkouts-edit-btn-0"]', { timeout: 10000 }).click({force:true})
    cy.get('[data-cy="checkouts-edit-status"]', { timeout: 5000 }).select(1)
    cy.get('#editVatPercent', { timeout: 5000 }).scrollIntoView().clear().type('13', { force: true })
    cy.get('[data-cy="checkouts-edit-save-btn"]', { timeout: 5000 }).scrollIntoView().click().wait(3000)
    cy.log('=== Checkout processed ===')
  })
})
