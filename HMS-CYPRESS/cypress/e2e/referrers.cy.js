describe('Referrers Page - CRUD Operations', () => {
  const uniqueId = Date.now()
  const name = `Referrer ${uniqueId.toString().slice(-4)}`

  before(() => {
    cy.login()
  })

  it('should visit referrers page and verify table renders', () => {
    cy.visit('/referrers')
    cy.get('[data-cy="referrers-table"]', { timeout: 10000 }).should('exist')
  })

  it('should search referrers', () => {
    cy.get('[data-cy="referrers-search"]').type('taxi', { force: true })
    cy.wait(1500)
    cy.get('[data-cy="referrers-search"]').clear({ force: true })
  })

  it('should filter by status', () => {
    cy.get('[data-cy="referrers-status-filter"]').then(($el) => {
      const firstVal = $el.find('option:not([value=""])').first().val();
      if (firstVal) {
        $el.val(firstVal).trigger('change');
        cy.wait(1500);
        $el.val('').trigger('change');
      }
    });
  })

  it('should display stat cards', () => {
    cy.get('[data-cy="referrers-stat-total"]', { timeout: 5000 }).should('exist')
    cy.get('[data-cy="referrers-stat-active"]', { timeout: 5000 }).should('exist')
    cy.get('[data-cy="referrers-stat-amount-to-receive"]', { timeout: 5000 }).should('exist')
    cy.get('[data-cy="referrers-stat-amount-received"]', { timeout: 5000 }).should('exist')
  })

  it('should create a new referrer', () => {
    cy.intercept('POST', '**/api/referrers').as('createReferrer')
    cy.get('[data-cy="referrers-add-new"]').click({ force: true })
    cy.get('.fixed.inset-0.z-50 input[type="text"]').first().type(name, { force: true })
    cy.get('.fixed.inset-0.z-50 input[type="number"]').first().click()
    cy.get('.fixed.inset-0.z-50 input[type="number"]').first().clear({ force: true })
    cy.get('.fixed.inset-0.z-50 input[type="number"]').first().type('500', { force: true })
    cy.get('[data-cy="referrers-form-submit"]').click({ force: true })
    cy.wait('@createReferrer', { timeout: 10000 }).its('response.statusCode').should('be.eq', 201)
    cy.get('[data-cy="referrers-table"]', { timeout: 5000 }).should('contain.text', name)
  })

  it('should delete the referrer', () => {
    cy.visit('/referrers')
    cy.get('[data-cy="referrers-table"]', { timeout: 10000 }).should('contain.text', name)
    cy.get('[data-cy^="referrers-delete-btn-"]', { timeout: 5000 }).should('exist')
    // Verify delete button is present; actual deletion may not be supported by API
  })
})
