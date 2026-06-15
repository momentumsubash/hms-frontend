describe('Login Page', () => {
  it('should display login page and login as manager', () => {
    cy.visit('/login')
    cy.get('body', { timeout: 5000 }).should('be.visible')
    cy.get('input[type="email"]').type('manager@momentum.com')
    cy.get('input[type="password"]').type('Manager@123')
    cy.get('button[type="submit"]').click()
    cy.url({ timeout: 10000 }).should('include', '/dashboard')
  })

  it('should display login page and login as staff', () => {
    cy.visit('/login')
    cy.get('input[type="email"]').clear().type('reception@momentum.com')
    cy.get('input[type="password"]').clear().type('Staff@123')
    cy.get('button[type="submit"]').click()
    cy.url({ timeout: 10000 }).should('include', '/dashboard')
  })

  it('should reject invalid credentials', () => {
    cy.visit('/login')
    cy.get('input[type="email"]').clear().type('wrong@email.com')
    cy.get('input[type="password"]').clear().type('wrongpass')
    cy.get('button[type="submit"]').click()
    cy.url({ timeout: 5000 }).should('include', '/login')
  })

  it('should login via API', () => {
    cy.login()
    cy.url({ timeout: 10000 }).should('include', '/dashboard')
    cy.get('body', { timeout: 5000 }).should('contain.text', 'Dashboard')
  })
})
