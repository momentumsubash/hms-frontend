describe('Checkouts Page', () => {
  before(() => {
    cy.login()
  })

  it('should visit checkouts page', () => {
    cy.visit('/checkouts')
    cy.get('body', { timeout: 10000 }).should('be.visible')
  })

  it('should search by guest name if search exists', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="checkouts-search"]').length) {
        cy.get('[data-cy="checkouts-search"]').type('john', { force: true })
        cy.wait(1500)
        cy.get('[data-cy="checkouts-search-clear"]', { timeout: 5000 }).click()
      }
    })
  })

  it('should filter by status if filter exists', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="checkouts-status-filter"]').length) {
        cy.get('[data-cy="checkouts-status-filter"] option', { timeout: 5000 }).then(($opt) => {
          const pendingOpt = $opt.filter('[value="pending"]')
          if (pendingOpt.length) {
            cy.window().then(win => {
              const sel = win.document.querySelector('[data-cy="checkouts-status-filter"]')
              if (sel) {
                sel.value = 'pending'
                sel.dispatchEvent(new Event('change', { bubbles: true }))
              }
            })
            cy.wait(1500)
            cy.window().then(win => {
              const sel = win.document.querySelector('[data-cy="checkouts-status-filter"]')
              if (sel) {
                sel.value = ''
                sel.dispatchEvent(new Event('change', { bubbles: true }))
              }
            })
          }
        })
      }
    })
  })

  it('should view checkout details if available', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy^="checkouts-view-btn-"]').length) {
        cy.get('[data-cy^="checkouts-view-btn-"]').first().click()
        cy.get('[data-cy="checkouts-details-modal"]', { timeout: 5000 }).should('be.visible')
        cy.get('[data-cy="checkouts-details-modal-close"]').click()
      }
    })
  })

  it('should open and close edit modal if available', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy^="checkouts-edit-btn-"]').length) {
        cy.get('[data-cy^="checkouts-edit-btn-"]').first().click()
        cy.get('[data-cy="checkouts-edit-modal"]', { timeout: 5000 }).should('be.visible')
        cy.get('[data-cy="checkouts-edit-modal-close"]').click()
      }
    })
  })
})
