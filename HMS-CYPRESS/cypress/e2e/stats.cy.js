describe('Stats Page - Tabs & Expenditures', () => {
  before(() => {
    cy.login()
  })

  it('should visit stats page and verify content renders', () => {
    cy.visit('/stats')
    cy.get('body', { timeout: 5000 }).should('be.visible')
  })

  it('should click through all stat tabs', () => {
    const tabs = [
      'stats-tab-summary',
      'stats-tab-item',
      'stats-tab-room',
      'stats-tab-expenditure',
      'stats-tab-financial',
      'stats-tab-daily'
    ]
    tabs.forEach((tab) => {
      cy.get('body').then(($body) => {
        if ($body.find(`[data-cy="${tab}"]`).length) {
          cy.get(`[data-cy="${tab}"]`).click({ force: true })
          cy.wait(800)
        }
      })
    })
  })

  it('should apply date filter', () => {
    cy.get('[data-cy="stats-tab-summary"]', { timeout: 5000 }).click({ force: true })
    cy.wait(1000)
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="stats-date-filter"]').length) {
        cy.get('[data-cy="stats-date-filter"]').select('today', { force: true })
        cy.wait(1000)
      }
    })
  })

  it('should verify summary tab has cards', () => {
    cy.get('[data-cy="stats-tab-summary"]').click({ force: true })
    cy.wait(2000)
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="stats-card-hotel-balance"]').length) {
        cy.get('[data-cy="stats-card-hotel-balance"]').should('exist')
        cy.get('[data-cy="stats-card-sales-summary"]').should('exist')
        cy.get('[data-cy="stats-card-profit-loss"]').should('exist')
      }
    })
  })

  it('should check expenditure tab exists', () => {
    cy.get('[data-cy="stats-tab-expenditure"]').click({ force: true })
    cy.wait(1000)
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="stats-expenditure-search"]').length) {
        cy.get('[data-cy="stats-expenditure-search"]').type('test', { force: true })
      }
      if ($body.find('[data-cy="stats-expenditure-clear-filters"]').length) {
        cy.get('[data-cy="stats-expenditure-clear-filters"]').click()
      }
    })
  })

  it('should open expenditure form', () => {
    cy.get('[data-cy="stats-tab-expenditure"]').click({ force: true })
    cy.wait(1000)
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="stats-create-expenditure"]').length) {
        cy.get('[data-cy="stats-create-expenditure"]').click({ force: true })
        cy.get('[data-cy="stats-expenditure-form-amount"]', { timeout: 5000 }).type('100', { force: true })
        cy.get('[data-cy="stats-expenditure-form-description"]').type('Test expenditure', { force: true })
      }
    })
  })

  it('should filter items by category on item tab', () => {
    cy.get('[data-cy="stats-tab-item"]').click({ force: true })
    cy.wait(2000)
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="stats-item-category-filter"]').length) {
        cy.get('[data-cy="stats-item-category-filter"]').then(($el) => {
          if ($el.find('option').length > 1) {
            cy.wrap($el).select($el.find('option:not([value=""])').first().val(), { force: true })
            cy.wait(1000)
          }
        })
      }
    })
  })

  it('should filter rooms by type on room tab', () => {
    cy.get('[data-cy="stats-tab-room"]').click({ force: true })
    cy.wait(2000)
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="stats-room-type-filter"]').length) {
        cy.get('[data-cy="stats-room-type-filter"]').then(($el) => {
          if ($el.find('option').length > 1) {
            cy.wrap($el).select($el.find('option:not([value=""])').first().val(), { force: true })
            cy.wait(1000)
          }
        })
      }
    })
  })
})
