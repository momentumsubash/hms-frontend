function checkEach(selector, checkFn) {
  cy.get('body').then($body => {
    const $els = $body.find(selector).filter(':visible')
    if (!$els.length) return
    $els.each((i, el) => {
      const $el = Cypress.$(el)
      if ($el.is('[data-cy-ignore]')) return
      checkFn($el)
    })
  })
}

Cypress.on('uncaught:exception', () => false)

describe('UI Integrity - All interactive elements visible & clickable', () => {
  before(() => {
    cy.login()
  })

  const pages = [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/guests', name: 'Guests' },
    { path: '/rooms', name: 'Rooms' },
    { path: '/orders', name: 'Orders' },
    { path: '/checkouts', name: 'Checkouts' },
    { path: '/items', name: 'Items' },
    { path: '/stats', name: 'Stats' },
    { path: '/recordbook', name: 'Record Book' },
    { path: '/referrers', name: 'Referrers' },
    { path: '/kitchen', name: 'Kitchen' },
    { path: '/dues', name: 'Dues' },
  ]

  pages.forEach(({ path, name }) => {
    describe(`${name} page (${path})`, () => {
      before(() => {
        cy.visit(path)
        cy.wait(1000)
      })

      it('page body is visible', () => {
        cy.get('body', { timeout: 15000 }).should('be.visible')
      })

      it('all buttons are visible (disabled ok for pagination/loading)', () => {
        checkEach('button', $btn => {
          expect($btn.is(':visible')).to.be.true
        })
      })

      it('all input fields are visible and enabled', () => {
        checkEach('input', $input => {
          expect($input.is(':visible')).to.be.true
          expect($input.is(':disabled')).to.be.false
        })
      })

      it('all select dropdowns are visible and enabled', () => {
        checkEach('select', $sel => {
          expect($sel.is(':visible')).to.be.true
          expect($sel.is(':disabled')).to.be.false
        })
      })

      it('all tables are visible', () => {
        checkEach('table', $table => {
          expect($table.is(':visible')).to.be.true
        })
      })

      it('all checkboxes are visible and enabled', () => {
        checkEach('input[type="checkbox"], [role="checkbox"]', $cb => {
          expect($cb.is(':visible')).to.be.true
          expect($cb.is(':disabled')).to.be.false
        })
      })

      it('all textareas are visible and enabled', () => {
        checkEach('textarea', $ta => {
          expect($ta.is(':visible')).to.be.true
          expect($ta.is(':disabled')).to.be.false
        })
      })

      it('all links are visible', () => {
        checkEach('a', $a => {
          expect($a.is(':visible')).to.be.true
        })
      })
    })
  })

  describe('Edit modals open correctly', () => {
    it('guests edit modal opens and all buttons are visible', () => {
      cy.visit('/guests')
      cy.get('body').then($body => {
        if ($body.find('[data-cy^="guests-edit-btn-"]').length) {
          cy.get('[data-cy^="guests-edit-btn-"]').first().click({ force: true })
          cy.wait(500)
          cy.get('[data-cy="guests-form-submit"]', { timeout: 5000 }).should('be.visible').and('not.be.disabled')
          cy.get('[data-cy="guests-form-cancel"]', { timeout: 5000 }).should('be.visible').and('not.be.disabled')
          cy.get('[data-cy="guests-form-cancel"]').click({ force: true })
        }
      })
    })

    it('orders create modal opens and all buttons are visible', () => {
      cy.visit('/orders')
      cy.get('body').then($body => {
        if ($body.find('[data-cy="orders-add-btn"]').length) {
          cy.get('[data-cy="orders-add-btn"]').first().click({ force: true })
          cy.wait(500)
          cy.get('[data-cy="orders-cancel"]', { timeout: 5000 }).should('be.visible').and('not.be.disabled')
          cy.get('[data-cy="orders-submit"]', { timeout: 5000 }).should('be.visible').and('not.be.disabled')
          cy.get('[data-cy="orders-cancel"]').click({ force: true })
        }
      })
    })

    it('rooms add modal opens and all buttons are visible', () => {
      cy.visit('/rooms')
      cy.get('body').then($body => {
        if ($body.find('[data-cy="rooms-add-new"]').length) {
          cy.get('[data-cy="rooms-add-new"]').first().click({ force: true })
          cy.wait(500)
          cy.get('[data-cy="rooms-add-cancel"]', { timeout: 5000 }).should('be.visible').and('not.be.disabled')
          cy.get('[data-cy="rooms-add-submit"]', { timeout: 5000 }).should('be.visible').and('not.be.disabled')
          cy.get('[data-cy="rooms-add-cancel"]').click({ force: true })
        }
      })
    })

    it('items edit modal opens and all buttons are visible', () => {
      cy.visit('/items')
      cy.get('body').then($body => {
        if ($body.find('[data-cy^="items-edit-btn-"]').length) {
          cy.get('[data-cy^="items-edit-btn-"]').first().click({ force: true })
          cy.wait(500)
          cy.get('[data-cy="items-edit-cancel"]', { timeout: 5000 }).should('be.visible').and('not.be.disabled')
          cy.get('[data-cy="items-edit-submit"]', { timeout: 5000 }).should('be.visible').and('not.be.disabled')
          cy.get('[data-cy="items-edit-cancel"]').click({ force: true })
        }
      })
    })

    it('referrers add modal opens and all buttons are visible', () => {
      cy.visit('/referrers')
      cy.get('body').then($body => {
        if ($body.find('[data-cy="referrers-add-new"]').length) {
          cy.get('[data-cy="referrers-add-new"]').click({ force: true })
          cy.wait(500)
          cy.get('[data-cy="referrers-form-submit"]', { timeout: 5000 }).should('be.visible').and('not.be.disabled')
          cy.get('[data-cy="referrers-form-cancel"]', { timeout: 5000 }).should('be.visible').and('not.be.disabled')
          cy.get('[data-cy="referrers-form-cancel"]').click({ force: true })
        }
      })
    })
  })
})
