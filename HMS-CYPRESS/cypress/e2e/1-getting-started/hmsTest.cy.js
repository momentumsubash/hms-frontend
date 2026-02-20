/// <reference types="cypress" />

// Welcome to Cypress!
//
// This spec file contains a variety of sample tests
// for a todo list app that are designed to demonstrate
// the power of writing tests in Cypress.
//
// To learn more about how Cypress works and
// what makes it such an awesome testing tool,
// please read our getting started guide:
// https://on.cypress.io/introduction-to-cypress

import 'cypress-real-events/support';

describe('Test HMS', () => {
  before(() => {
    cy.visit('http://localhost:3001/login')
    cy.wait(3000)
  })

  it('should log in with valid credentials', () => {
    cy.get('[type="email"]').type('momentum.acharya@mirana.com')
    cy.get('[placeholder="Password"]').type('Manager@123')
    cy.contains('button','Login').click().wait(3000)
  })

  it('should navigate to guests after login', () => {
    cy.get('[href="/guests"]').eq(0).click({force:true}).wait(3000)
    cy.get('[data-cy="guests-add-btn"]').should('be.visible').click()
  })

    it('should add guest', () => {
cy.get('[data-cy="guests-phone"]').type('1234567899')
cy.get('[data-cy="guests-idno"]').clear().type('ID-123/456')
cy.get('[data-cy="guests-firstname"]').clear().type('John Doe')
cy.get('[data-cy="guests-lastname"]').clear().type('Smith')
cy.get('[data-cy="guests-occupation"]').clear().type('Engineer')
cy.get('[data-cy="guests-email"]').clear().type('guestuser@noemail.com')
cy.get('[data-cy="guests-vehicleno"]').clear().type('ABC-1234')
cy.get('[data-cy="guests-purpose"]').clear().type('Business Trip')
cy.get('[data-cy="guests-address"]').clear().type('123 Main St, Anytown, Nepal')

cy.get('[data-cy="guests-rooms"]').select(2);

cy.get('[data-cy="guests-roomdiscount"]').type('200')
cy.get('[data-cy="guests-advancepaid"]').type('300')



cy.get('[data-cy="guests-submit"]').scrollIntoView().click().wait(3000)
  })

  it('Should add order', () => {
    // cy.pause()
    cy.get('[href="/orders"]').eq(0).click({force:true}).wait(3000)

    cy.get('[data-cy="orders-add-btn"]').should('be.visible').click()
    cy.get('[data-cy="orders-room-select"]',{timeout: 10000}).realClick()
    //  cy.get('[data-cy="orders-room-0"]').should('be.visible').click({force:true})
     cy.get('[data-cy="orders-room-0"]').scrollIntoView().realClick()
    cy.get('[data-cy="orders-items-list"]').click()
    cy.get('[data-cy="orders-submit"]').scrollIntoView().click().wait(3000)
  })

  it('Should change order status', () => {
    cy.get('[data-cy="orders-status-btn-0"]').click()
    cy.get('[data-cy="orders-status-modal"]').should('be.visible').click()
    cy.get('[data-cy="orders-status-select"]').select(1)
cy.get('[data-cy="orders-status-modal-update"]').click().wait(3000)

  })

  it('Should checkout out', () => {
    cy.get('[href="/checkouts"]').eq(0).click({force:true}).wait(3000)
    cy.get('[data-cy="checkouts-edit-btn-0"]').click()
    cy.get('[data-cy="checkouts-edit-status"]').select(1)
    cy.get('#editVatPercent').scrollIntoView().clear().type('13')
    cy.get('[data-cy="checkouts-edit-save-btn"]').scrollIntoView().click().wait(3000)

  })

})
