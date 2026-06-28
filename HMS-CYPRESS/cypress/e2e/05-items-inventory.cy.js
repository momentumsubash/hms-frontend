describe('E2E: Items, Inventory & Stocks', () => {
  const uniqueId = Date.now()
  const itemName = `Cypress Item ${uniqueId.toString().slice(-4)}`

  beforeEach(() => {
    cy.loginAsManager()
  })

  describe('Item Management', () => {
    it('should view all items', () => {
      cy.get('[data-cy="items-nav"]').click()
      cy.url().should('include', '/items')
      cy.get('[data-cy="items-table"]', { timeout: 10000 }).should('exist')
    })

    it('should search items', () => {
      cy.get('[data-cy="items-nav"]').click()
      cy.get('[data-cy="items-search"]').first().type('Wine', { force: true })
      cy.get('[data-cy="items-table"]', { timeout: 5000 }).should('exist')
      cy.get('[data-cy="items-search"]').first().clear({ force: true })
    })

    it('should filter items by category', () => {
      cy.get('[data-cy="items-nav"]').click()
      cy.get('[data-cy="items-category-filter"]').first().as('catFilter')
      cy.get('@catFilter').find('option:not([disabled]):not([value=""])', { timeout: 10000 }).should('have.length.at.least', 1)
      cy.get('@catFilter').then($el => {
        const val = $el.find('option:not([value=""])').first().val()
        cy.wrap($el).select(val, { force: true })
        cy.wait(500)
        cy.wrap($el).select('', { force: true })
      })
    })

    it('should create a new item', () => {
      cy.login()
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
            body: { name: itemName, price: 500, category: catId, isAvailable: true, hotel: hotel._id }
          }).its('status').should('eq', 201)
        })
      })
      cy.get('[data-cy="items-nav"]').click()
      cy.get('[data-cy="items-table"]', { timeout: 10000 }).should('contain.text', itemName)
    })
  })

  describe('Item Edit & View', () => {
    it('should edit an item', () => {
      cy.get('[data-cy="items-nav"]').click()
      cy.get('[data-cy="items-table"]', { timeout: 5000 }).should('exist')
      cy.get('body').then($body => {
        if ($body.find('[data-cy^="items-edit-btn-"]').length) {
          cy.get('[data-cy^="items-edit-btn-"]').first().click({ force: true })
          cy.get('[data-cy="items-edit-form"]', { timeout: 5000 }).should('be.visible')
          cy.get('[data-cy="items-edit-price"]', { timeout: 5000 }).clear({ force: true })
          cy.get('[data-cy="items-edit-price"]', { timeout: 5000 }).type('600', { force: true })
          cy.get('[data-cy="items-edit-submit"]').click({ force: true })
          cy.get('[data-cy="items-edit-form"]', { timeout: 5000 }).should('not.exist')
        }
      })
    })

    it('should delete an item', () => {
      cy.get('[data-cy="items-nav"]').click()
      cy.get('[data-cy="items-table"]', { timeout: 5000 }).should('exist')
      cy.get('body').then($body => {
        if ($body.find('[data-cy^="items-delete-btn-"]').length) {
          cy.get('[data-cy^="items-delete-btn-"]').first().click({ force: true })
          cy.get('[data-cy="items-delete-confirm"]', { timeout: 5000 }).click({ force: true })
          cy.get('[data-cy="items-delete-modal"]', { timeout: 5000 }).should('not.exist')
        }
      })
    })
  })
})
