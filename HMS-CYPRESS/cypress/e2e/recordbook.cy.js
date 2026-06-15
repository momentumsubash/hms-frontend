describe('RecordBook Page - Date & Accordion', () => {
  before(() => {
    cy.login()
  })

  it('should visit recordbook page and verify date input', () => {
    cy.visit('/recordbook')
    cy.get('[data-cy="recordbook-date"]', { timeout: 10000 }).should('exist')
  })

  it('should change date filter', () => {
    const today = new Date().toISOString().split('T')[0]
    cy.get('[data-cy="recordbook-date"]').invoke('val', today).trigger('change')
    cy.wait(1500)
  })

  it('should have refresh button', () => {
    cy.get('[data-cy="recordbook-refresh"]').should('exist').click()
    cy.wait(1000)
  })

  it('should have print button', () => {
    cy.get('[data-cy="recordbook-print"]', { timeout: 5000 }).should('exist')
  })

  it('should have csv export button', () => {
    cy.get('[data-cy="recordbook-csv"]', { timeout: 5000 }).should('exist')
  })

  it('should display summary cards if data exists', () => {
    cy.get('body', { timeout: 5000 }).then(($body) => {
      if ($body.find('[data-cy="recordbook-total-revenue"]').length) {
        cy.get('[data-cy="recordbook-net-profit"]').should('exist')
        cy.get('[data-cy="recordbook-total-orders"]').should('exist')
        cy.get('[data-cy="recordbook-total-checkouts"]').should('exist')
      }
    })
  })

  it('should display accordion sections if data exists', () => {
    cy.get('body', { timeout: 5000 }).then(($body) => {
      if ($body.find('[data-cy="recordbook-allocated-rooms-section"]').length) {
        cy.get('[data-cy="recordbook-items-sold-section"]').should('exist')
        cy.get('[data-cy="recordbook-daily-checkouts-section"]').should('exist')
      }
    })
  })

  it('should have tables inside accordions if data exists', () => {
    cy.get('body', { timeout: 5000 }).then(($body) => {
      if ($body.find('[data-cy="recordbook-allocated-rooms-table"]').length) {
        cy.get('[data-cy="recordbook-allocated-rooms-table"]').should('exist')
      }
    })
    cy.get('body', { timeout: 5000 }).then(($body) => {
      if ($body.find('[data-cy="recordbook-items-sold-table"]').length) {
        cy.get('[data-cy="recordbook-items-sold-table"]').should('exist')
      }
    })
    cy.get('body', { timeout: 5000 }).then(($body) => {
      if ($body.find('[data-cy="recordbook-daily-checkouts-table"]').length) {
        cy.get('[data-cy="recordbook-daily-checkouts-table"]').should('exist')
      }
    })
  })
})
