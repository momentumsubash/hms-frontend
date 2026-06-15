describe('Guests Page - CRUD & Filters', () => {
  const uniqueId = Date.now()
  const phone = `97${uniqueId.toString().slice(-8)}`
  const firstName = 'Guest'
  const lastName = `Test${uniqueId.toString().slice(-4)}`
  const email = `guest${uniqueId}@example.com`

  before(() => {
    cy.login()
  })

  it('should visit guests page and verify table renders', () => {
    cy.visit('/guests')
    cy.get('table', { timeout: 10000 }).should('exist')
  })

  it('should search guests', () => {
    cy.get('[data-cy="guests-search"]').last().type('john', { force: true })
    cy.wait(1500)
    cy.get('[data-cy="guests-search"]').last().clear({ force: true })
  })

  it('should filter by room', () => {
    cy.get('[data-cy="guests-room-filter"]').last().then(($el) => {
      if ($el.find('option').length > 1) {
        cy.wrap($el).select($el.find('option:not([value=""])').first().val(), { force: true })
        cy.wait(1500)
      }
    })
    cy.get('[data-cy="guests-room-filter"]').last().then(($el) => {
      if ($el.find('option[value=""]').length) {
        cy.wrap($el).select('', { force: true })
      }
    })
  })

  it('should filter by customer status', () => {
    cy.get('[data-cy="guests-customer-filter"]').last().select('true', { force: true })
    cy.wait(1500)
    cy.get('[data-cy="guests-customer-filter"]').last().select('', { force: true })
  })

  it('should filter by due status', () => {
    cy.get('[data-cy="guests-due-filter"]').last().select('true', { force: true })
    cy.wait(1500)
    cy.get('[data-cy="guests-due-filter"]').last().select('', { force: true })
  })

  it('should create a new guest', () => {
    cy.intercept('POST', '**/api/guests').as('createGuest')
    cy.visit('/guests')
    cy.get('[data-cy="guests-add-new"]').last().click()
    cy.get('[data-cy="guests-form-phone"]', { timeout: 5000 }).type(phone, { force: true })
    cy.get('[data-cy="guests-form-first-name"]').type(firstName, { force: true })
    cy.get('[data-cy="guests-form-last-name"]').type(lastName, { force: true })
    cy.get('[data-cy="guests-form-email"]').type(email, { force: true })
    cy.get('[data-cy="guests-rooms"]', { timeout: 10000 }).should('exist')
    cy.get('body').then($body => {
      const $opts = $body.find('[data-cy="guests-rooms"] option')
      if ($opts.length && $opts.first().val()) {
        cy.get('[data-cy="guests-rooms"]').select($opts.first().val(), { force: true })
        cy.get('[data-cy="guests-form-submit"]').click()
        cy.wait('@createGuest', { timeout: 10000 }).its('response.statusCode').should('be.eq', 201)
        cy.get('table', { timeout: 5000 }).should('contain.text', lastName)
      }
    })
  })

  it('should edit the guest', () => {
    cy.visit('/guests')
    cy.get('body').then($body => {
      if ($body.find('[data-cy^="guests-edit-btn-"]').length &&
          $body.text().includes(lastName)) {
        cy.intercept('PUT', '**/api/guests**').as('editGuest')
        cy.get('[data-cy^="guests-edit-btn-"]', { timeout: 5000 }).first().click({ force: true })
        cy.get('[data-cy="guests-form-first-name"]', { timeout: 5000 }).clear({ force: true }).type(`${firstName}Edited`, { force: true })
        cy.get('[data-cy="guests-form-submit"]').click({ force: true })
        cy.wait('@editGuest', { timeout: 10000 }).its('response.statusCode').should('be.eq', 200)
        cy.get('table', { timeout: 5000 }).should('contain.text', `${firstName}Edited`)
      }
    })
  })
})
