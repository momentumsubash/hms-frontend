describe('Sidebar Navigation', () => {
  before(() => {
    cy.login()
  })

  const links = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Rooms', path: '/rooms' },
    { label: 'Items', path: '/items' },
    { label: 'Orders', path: '/orders' },
    { label: 'Guests', path: '/guests' },
    { label: 'Checkouts', path: '/checkouts' },
    { label: 'Stats', path: '/stats' },
    { label: 'Record Book', path: '/recordbook' },
    { label: 'Referrers', path: '/referrers' },
    { label: 'Kitchen', path: '/kitchen' },
    { label: 'Dashboard', path: '/dashboard' },
  ]

  links.forEach(({ label, path }) => {
    it(`should navigate to ${label} page`, () => {
      cy.visit(path)
      cy.url({ timeout: 10000 }).should('include', path)
      cy.get('body', { timeout: 5000 }).should('be.visible')
    })
  })
})
