describe('Full Flow', () => {
  it('should log in with valid credentials', () => {
    cy.login()
  })

  it('Should navigate to guests page', () => {
    cy.get('a[href="/guests"]', { timeout: 10000 }).first().click({force:true})
    cy.url({ timeout: 10000 }).should('include', '/guests')
  })
})
