describe('Orders Page - Filters & Modal', () => {
  before(() => {
    cy.login()
  })

  it('should visit orders page and verify table renders', () => {
    cy.visit('/orders')
    cy.get('[data-cy="orders-table"]', { timeout: 10000 }).should('exist')
    cy.get('[data-cy="orders-table-container"]', { timeout: 5000 }).should('exist')
  })

  it('should search orders', () => {
    cy.get('[data-cy="orders-search"]').last().type('101', { force: true })
    cy.wait(1500)
    cy.get('[data-cy="orders-search"]').last().clear({ force: true })
  })

  it('should filter by status', () => {
    cy.get('[data-cy="orders-status-filter"]').then(($el) => {
      const firstVal = $el.find('option:not([value=""])').first().val();
      if (firstVal) {
        $el.val(firstVal).trigger('change');
        cy.wait(1500);
        $el.val('').trigger('change');
      }
    });
  })

  it('should filter by room number', () => {
    cy.get('[data-cy="orders-room-filter"]').last().type('101', { force: true })
    cy.wait(1500)
    cy.get('[data-cy="orders-room-filter"]').last().clear({ force: true })
  })

  it('should open create order modal and cancel', () => {
    cy.get('[data-cy="orders-add-btn"]').first().click()
    cy.get('[data-cy="orders-modal"]', { timeout: 5000 }).should('be.visible')
    cy.get('[data-cy="orders-cancel"]').click()
    cy.get('[data-cy="orders-modal"]', { timeout: 5000 }).should('not.exist')
  })

  it('should open and close status modal', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy^="orders-status-btn-"]').length) {
        cy.get('[data-cy^="orders-status-btn-"]').first().click()
        cy.get('[data-cy="orders-status-modal"]', { timeout: 5000 }).should('be.visible')
        cy.get('[data-cy="orders-status-select"]').should('exist')
        cy.get('[data-cy="orders-status-modal-cancel"]').click()
      }
    })
  })
})
