describe('Full Org Admin E2E Flow', () => {
  const uniqueId = Date.now()
  const roomNum = `0000${uniqueId.toString().slice(-4)}`
  const guestPhone = `98${uniqueId.toString().slice(-8)}`
  const guestFirstName = 'Full'
  const guestLastName = `E2ETest${uniqueId.toString().slice(-4)}`
  const itemName = `Cypress Item ${uniqueId.toString().slice(-4)}`
  const referrerName = `Referrer ${uniqueId.toString().slice(-4)}`
  const roomDiscount = 500
  const roomRate = 2000
  const itemPrice = 1000

  before(() => {
    cy.login()
  })

  it('should create a room', () => {
    cy.window().then(win => {
      const token = win.localStorage.getItem('token')
      const hotel = JSON.parse(win.localStorage.getItem('hotel') || '{}')
      return cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/api/rooms`,
        headers: { Authorization: `Bearer ${token}` },
        body: { roomNumber: roomNum, type: 'single', rate: roomRate, hotel: hotel._id }
      }).its('status').should('eq', 201)
    })
    cy.visit('/rooms')
    cy.get('[data-cy="rooms-table"]', { timeout: 10000 }).should('contain.text', roomNum)
  })

  it('should create an item', () => {
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
          body: { name: itemName, price: itemPrice, category: catId, isAvailable: true, hotel: hotel._id }
        }).its('status').should('eq', 201)
      })
    })
    cy.visit('/items')
    cy.get('[data-cy="items-table"]', { timeout: 10000 }).should('contain.text', itemName)
  })

  it('should create a guest', () => {
    cy.intercept('POST', '**/api/guests').as('createGuest')
    cy.visit('/guests')
    cy.get('table', { timeout: 5000 }).should('exist')
    cy.get('[data-cy="guests-add-new"]').last().click()
    cy.get('[data-cy="guests-form-phone"]', { timeout: 5000 }).type(guestPhone, { force: true })
    cy.get('[data-cy="guests-form-first-name"]').type(guestFirstName, { force: true })
    cy.get('[data-cy="guests-form-last-name"]').type(guestLastName, { force: true })
    cy.get('[data-cy="guests-form-email"]').type(`fulltest${uniqueId}@example.com`, { force: true })
    cy.get('[data-cy="guests-roomdiscount"]').clear({ force: true }).type(roomDiscount.toString(), { force: true })
    cy.get('[data-cy="guests-advancepaid"]').clear({ force: true }).type('0', { force: true })
    cy.get('[data-cy="guests-rooms"] option').then(($opts) => {
      const matching = $opts.filter((_, o) => o.text.includes(roomNum))
      if (matching.length) {
        cy.get('[data-cy="guests-rooms"]').select(matching.val(), { force: true })
      } else if ($opts.length && $opts.first().val()) {
        cy.get('[data-cy="guests-rooms"]').select($opts.first().val(), { force: true })
      }
    })
    cy.get('[data-cy="guests-form-submit"]').click()
    cy.wait('@createGuest', { timeout: 10000 }).its('response.statusCode').should('be.eq', 201)
    cy.get('table', { timeout: 5000 }).should('contain.text', guestLastName)
  })

  it('should create an order and complete it via UI', () => {
    // Create order via API (number inputs broken in React controlled forms)
    cy.window().then(win => {
      const token = win.localStorage.getItem('token')
      return cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/api/items`,
        headers: { Authorization: `Bearer ${token}` }
      }).then(itemResp => {
        const items = itemResp.body?.data || []
        const matchItem = items.find(i => i.name === itemName)
        if (!matchItem) return
        return cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/api/guests`,
          headers: { Authorization: `Bearer ${token}` }
        }).then(guestResp => {
          const guests = guestResp.body?.data || []
          const matchGuest = guests.find(g => g.lastName === guestLastName)
          if (!matchGuest) return
          return cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/orders`,
            headers: { Authorization: `Bearer ${token}` },
            body: { guestId: matchGuest._id, roomNumber: roomNum, items: [{ itemId: matchItem._id, quantity: 1 }] }
          })
        })
      })
    })

    // Complete order via UI — open status modal and change to 'completed'
    cy.visit('/orders')
    cy.get('[data-cy="orders-table"]', { timeout: 5000 }).should('exist')
    cy.get('[data-cy="orders-table-body"]', { timeout: 5000 }).contains('td', guestLastName)
      .closest('tr').within(() => {
        cy.get('[data-cy^="orders-status-btn-"]').first().click()
      })
    cy.get('[data-cy="orders-status-modal"]', { timeout: 5000 }).should('be.visible')
    cy.get('[data-cy="orders-status-select"]').select('completed')
    cy.get('[data-cy="orders-status-modal-update"]').click()
    cy.get('[data-cy="orders-status-modal"]', { timeout: 5000 }).should('not.exist')
  })

  it('should verify checkout billing breakdown via API', () => {
    cy.window().then(win => {
      const token = win.localStorage.getItem('token')
      return cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/api/checkouts`,
        headers: { Authorization: `Bearer ${token}` }
      }).then(resp => {
        const checkouts = resp.body?.data || resp.body || []
        const checkout = Array.isArray(checkouts)
          ? checkouts.find(c => c.guest?.lastName === guestLastName || c.roomNumber === roomNum)
          : null
        if (!checkout) return
        // Order is now linked: totalOrderCharge = 1000, totalRoomCharge = 2000
        expect(checkout.totalRoomCharge).to.equal(roomRate)
        expect(checkout.roomDiscount).to.equal(roomDiscount)
        expect(checkout.totalOrderCharge).to.equal(itemPrice)
        const total = (roomRate - roomDiscount) + itemPrice // 2500
        expect(checkout.totalBill).to.equal(total)
      })
    })
  })

  it('should complete checkout with partial payment via UI and verify due', () => {
    // Step 1: Complete checkout with payment via UI
    cy.visit('/checkouts')
    cy.get('[data-cy="checkouts-table"]', { timeout: 5000 }).should('exist')
    cy.get('[data-cy="checkouts-table-body"]', { timeout: 5000 }).contains('td', guestLastName)
      .closest('tr').within(() => {
        cy.get('[data-cy^="checkouts-edit-btn-"]').first().click()
      })
    cy.get('[data-cy="checkouts-edit-modal"]', { timeout: 5000 }).should('be.visible')
    cy.get('[data-cy="checkouts-edit-status"]').select('completed')
    cy.get('#paymentAmount').type('{selectall}2000', { delay: 100, force: true })
    cy.get('[data-cy="checkouts-edit-save-btn"]').click()
    cy.get('[data-cy="checkouts-edit-modal"]', { timeout: 5000 }).should('not.exist')

    // Step 2: Verify guest due amount shows on guests page
    cy.visit('/guests')
    cy.get('[data-cy="guests-table"]', { timeout: 5000 }).should('exist')
    cy.get('[data-cy="guests-table"]').contains('td', guestLastName)
      .closest('tr').should('contain.text', 'रु500')

    // Step 3: Pay first installment via Dues page UI
    cy.visit('/dues')
    cy.get('[data-cy="dues-search"]', { timeout: 5000 }).type(guestLastName, { force: true })
    cy.wait(1000)
    cy.contains('button', /Record\s*Payment/).click()
    cy.get('.fixed.inset-0.z-50', { timeout: 5000 }).should('be.visible')
    cy.get('.fixed.inset-0.z-50 input[type="number"]').first().type('{selectall}3', { force: true })
    cy.wait(300)
    cy.get('.fixed.inset-0.z-50 input[type="number"]').first().type('0', { force: true })
    cy.wait(300)
    cy.get('.fixed.inset-0.z-50 input[type="number"]').first().type('0', { force: true })
    cy.get('.fixed.inset-0.z-50 select').first().select('cash')
    cy.get('.fixed.inset-0.z-50 textarea').first().type('First installment via UI', { force: true })
    cy.intercept('POST', '**/api/guests/**').as('duePayment')
    cy.contains('button', 'Save Payment').click()
    cy.wait('@duePayment', { timeout: 10000 }).its('request.body').then(body => {
      cy.log('Due payment body:', JSON.stringify(body))
    })
    cy.get('.fixed.inset-0.z-50', { timeout: 5000 }).should('not.exist')

    // Step 4: Verify remaining due is 200
    cy.visit('/guests')
    cy.get('[data-cy="guests-table"]').contains('td', guestLastName)
      .closest('tr').should('contain.text', 'रु200')

    // Step 5: Pay second installment via Dues page UI
    cy.visit('/dues')
    cy.get('[data-cy="dues-search"]', { timeout: 5000 }).type(guestLastName, { force: true })
    cy.wait(1000)
    cy.contains('button', /Record\s*Payment/).click()
    cy.get('.fixed.inset-0.z-50', { timeout: 5000 }).should('be.visible')
    cy.get('.fixed.inset-0.z-50 input[type="number"]').first().type('{selectall}2', { force: true })
    cy.wait(300)
    cy.get('.fixed.inset-0.z-50 input[type="number"]').first().type('0', { force: true })
    cy.wait(300)
    cy.get('.fixed.inset-0.z-50 input[type="number"]').first().type('0', { force: true })
    cy.get('.fixed.inset-0.z-50 select').first().select('online')
    cy.get('.fixed.inset-0.z-50 textarea').first().type('Second installment via UI', { force: true })
    cy.contains('button', 'Save Payment').click()
    cy.get('.fixed.inset-0.z-50', { timeout: 5000 }).should('not.exist')

    // Step 6: Verify fully paid — dueAmount should be 0 (shows 'None')
    cy.visit('/guests')
    cy.get('[data-cy="guests-table"]').contains('td', guestLastName)
      .closest('tr').should('contain.text', 'None')
  })

  it('should create a referrer', () => {
    cy.intercept('POST', '**/api/referrers').as('createReferrer')
    cy.visit('/referrers')
    cy.get('[data-cy="referrers-table"]', { timeout: 5000 }).should('exist')
    cy.get('[data-cy="referrers-add-new"]').click({ force: true })
    cy.get('.fixed.inset-0.z-50 input[type="text"]').first().type(referrerName, { force: true })
    cy.get('.fixed.inset-0.z-50 input[type="number"]').first().click()
    cy.get('.fixed.inset-0.z-50 input[type="number"]').first().clear({ force: true })
    cy.get('.fixed.inset-0.z-50 input[type="number"]').first().type('500', { force: true })
    cy.get('[data-cy="referrers-form-submit"]').click({ force: true })
    cy.wait('@createReferrer', { timeout: 10000 }).its('response.statusCode').should('be.eq', 201)
    cy.get('[data-cy="referrers-table"]', { timeout: 5000 }).should('contain.text', referrerName)
  })

  it('should verify room and item earnings on stats page', () => {
    cy.visit('/stats')
    cy.get('[data-cy="stats-tab-summary"]', { timeout: 5000 }).click({ force: true })
    cy.wait(2000)
    cy.get('body', { timeout: 5000 }).should('contain.text', 'Room Sales')
    cy.get('body', { timeout: 5000 }).should('contain.text', 'Item Sales')
  })

  it('should verify earnings on recordbook page', () => {
    cy.visit('/recordbook')
    cy.get('[data-cy="recordbook-date"]', { timeout: 5000 }).should('exist')
    cy.get('[data-cy="recordbook-refresh"]', { timeout: 5000 }).click()
    cy.wait(2000)
    cy.get('body', { timeout: 5000 }).should('contain.text', 'Total Revenue')
    cy.get('body', { timeout: 5000 }).should('contain.text', 'Net Profit')
  })
})
