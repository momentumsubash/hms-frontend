describe('Login Page', () => {
  it('should log in with valid credentials', () => {
cy.login()
  });

  it("Should add guest",()=>{

    cy.get('[href="/guests"]',{timeout:10000}).click();
  })
});
