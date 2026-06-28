describe('Items Page - CRUD Operations', () => {
  const uniqueId = Date.now()
  const name = `Cypress Item ${uniqueId.toString().slice(-4)}`

  before(() => {
    cy.login()
  })

  it('should visit items page and verify table renders', () => {
    cy.visit('/items')
    cy.get('[data-cy="items-table"]', { timeout: 10000 }).should('exist')
  })

  it('should search items', () => {
    cy.get('[data-cy="items-search"]').first().type('test', { force: true })
    cy.wait(1500)
    cy.get('[data-cy="items-search"]').first().clear({ force: true })
  })

  it('should filter by category', () => {
    cy.get('[data-cy="items-category-filter"]').first().then(($el) => {
      if ($el.find('option').length > 1) {
        cy.wrap($el).select($el.find('option:not([value=""])').first().val(), { force: true })
        cy.wait(1500)
      }
    })
    cy.get('[data-cy="items-category-filter"]').first().select('', { force: true })
  })

  it('should filter by availability', () => {
    cy.get('[data-cy="items-availability-filter"]').first().select('true', { force: true })
    cy.wait(1500)
    cy.get('[data-cy="items-availability-filter"]').first().select('', { force: true })
  })

  it('should create a new item', () => {
    cy.login()
    cy.url({ timeout: 10000 }).should('include', '/dashboard')
    cy.window().then(win => {
      const token = win.localStorage.getItem('token')
      const hotel = JSON.parse(win.localStorage.getItem('hotel') || '{}')
      return cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/api/categories`,
        headers: { Authorization: `Bearer ${token}` }
      }).then(catResp => {
        const cats = catResp.body?.data || []
        const catId = cats.length ? cats[0]._id : undefined
        return cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/api/items`,
          headers: { Authorization: `Bearer ${token}` },
          body: { name, price: 100, category: catId, isAvailable: true, hotel: hotel._id }
        }).its('status').should('eq', 201)
      })
    })
    cy.visit('/items')
    cy.get('[data-cy="items-table"]', { timeout: 10000 }).should('contain.text', name)
  })

  it('should edit the item', () => {
    cy.visit('/items')
    cy.get('[data-cy="items-table"]', { timeout: 10000 }).should('contain.text', name)
    cy.get('[data-cy^="items-edit-btn-"]', { timeout: 5000 }).first().click()
    cy.get('[data-cy="items-edit-submit"]', { timeout: 5000 }).should('be.visible')
    cy.get('[data-cy="items-edit-cancel"]').click()
  })

  it('should delete the item', () => {
    cy.intercept('DELETE', '**/api/items/**').as('deleteItem')
    cy.visit('/items')
    cy.get('[data-cy="items-table"]', { timeout: 10000 }).should('contain.text', name)
    cy.get('[data-cy^="items-delete-btn-"]', { timeout: 5000 }).first().click()
    cy.get('[data-cy="items-delete-confirm"]', { timeout: 5000 }).click()
    cy.wait('@deleteItem', { timeout: 10000 }).its('response.statusCode').should('be.eq', 200)
    cy.get('[data-cy="items-table"]', { timeout: 5000 }).should('not.contain.text', name)
  })
})
