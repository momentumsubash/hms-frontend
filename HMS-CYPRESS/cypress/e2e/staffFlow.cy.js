describe('Staff Flow - Simple Test', () => {
  const staffEmail = 'reception@momentum.com'
  const staffPassword = 'Staff@123'
  const uniqueId = Date.now()
  const guestPhone = `98${uniqueId.toString().slice(-8)}`
  const guestFirstName = 'Cypress'
  const guestLastName = `StaffTest${uniqueId.toString().slice(-4)}`

  before(() => {
    cy.login(staffEmail, staffPassword)
  })

  it('should navigate to guests page and create a guest', () => {
    cy.intercept('POST', '**/api/guests').as('createGuest')
    cy.visit('/guests')
    cy.get('table', { timeout: 5000 }).should('exist')
    cy.get('[data-cy="guests-add-new"]').last().click()
    cy.get('[data-cy="guests-form-phone"]', { timeout: 5000 }).type(guestPhone, { force: true })
    cy.get('[data-cy="guests-form-first-name"]').type(guestFirstName, { force: true })
    cy.get('[data-cy="guests-form-last-name"]').type(guestLastName, { force: true })
    cy.get('[data-cy="guests-form-email"]').type(`stafftest${uniqueId}@example.com`, { force: true })
    cy.get('[data-cy="guests-rooms"] option').then(($opts) => {
      if ($opts.length && $opts.first().val()) {
        cy.get('[data-cy="guests-rooms"]').select($opts.first().val(), { force: true })
      }
    })
    cy.get('[data-cy="guests-form-submit"]').click()
    cy.wait('@createGuest', { timeout: 10000 }).its('response.statusCode').should('be.eq', 201)
    cy.get('table', { timeout: 5000 }).should('contain.text', guestLastName)
  })

  it('should navigate to checkouts page', () => {
    cy.visit('/checkouts')
    cy.get('body', { timeout: 5000 }).should('be.visible')
  })

  it('should navigate to orders page', () => {
    cy.visit('/orders')
    cy.get('[data-cy="orders-table"]', { timeout: 5000 }).should('exist')
  })
})
