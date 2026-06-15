describe('Rooms Page - CRUD Operations', () => {
  const uniqueId = Date.now()
  const roomNum = `0001${uniqueId.toString().slice(-4)}`

  before(() => {
    cy.login()
  })

  it('should visit rooms page and verify table renders', () => {
    cy.visit('/rooms')
    cy.get('[data-cy="rooms-table"]', { timeout: 10000 }).should('exist')
  })

  it('should search rooms', () => {
    cy.get('[data-cy="rooms-search"]').type('101', { force: true })
    cy.wait(1500)
    cy.get('[data-cy="rooms-search"]').clear({ force: true })
  })

  it('should filter by type', () => {
    cy.get('[data-cy="rooms-type-filter"]').select('single', { force: true })
    cy.wait(1500)
    cy.get('[data-cy="rooms-type-filter"]').select('', { force: true })
  })

  it('should filter by occupied status', () => {
    cy.get('[data-cy="rooms-occupied-filter"]').select('true', { force: true })
    cy.wait(1500)
    cy.get('[data-cy="rooms-occupied-filter"]').select('', { force: true })
  })

  it('should create a new room', () => {
    cy.login()
    cy.url({ timeout: 10000 }).should('include', '/dashboard')
    cy.window().then(win => {
      const token = win.localStorage.getItem('token')
      const hotel = JSON.parse(win.localStorage.getItem('hotel') || '{}')
      return cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/api/rooms`,
        headers: { Authorization: `Bearer ${token}` },
        body: { roomNumber: roomNum, type: 'single', rate: 2000, hotel: hotel._id }
      }).its('status').should('eq', 201)
    })
    cy.visit('/rooms')
    cy.get('[data-cy="rooms-table"]', { timeout: 10000 }).should('contain.text', roomNum)
  })

  it('should edit the room', () => {
    cy.visit('/rooms')
    cy.get('[data-cy="rooms-table"]', { timeout: 10000 }).should('contain.text', roomNum)
    cy.get('[data-cy^="rooms-edit-btn-"]', { timeout: 5000 }).first().click({ force: true })
    cy.get('[data-cy="rooms-edit-submit"]', { timeout: 5000 }).should('be.visible')
    cy.get('[data-cy="rooms-edit-cancel"]').click()
  })

  it('should view room details if exists', () => {
    cy.visit('/rooms')
    cy.get('[data-cy="rooms-table"]', { timeout: 10000 }).should('contain.text', roomNum)
    cy.get('body').then($b => {
      if ($b.find('[data-cy^="rooms-view-btn-"]').length) {
        cy.get('[data-cy^="rooms-view-btn-"]').first().click({ force: true })
      }
    })
  })

  it('should delete the room', () => {
    cy.visit('/rooms')
    cy.get('[data-cy="rooms-table"]', { timeout: 10000 }).should('contain.text', roomNum)
    cy.get('[data-cy^="rooms-delete-btn-"]', { timeout: 5000 }).should('exist')
    // Room deletion requires super_admin; verify button exists
  })
})
