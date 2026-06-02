import * as helpers from '../support/helpers';

describe('E2E: Guest Management', () => {
  beforeEach(() => {
    cy.loginAsManager();
  });

  it('should create a new guest successfully', () => {
    const guestData = {
      firstName: `Guest_${Date.now()}`,
      lastName: 'TestUser',
      email: `guest${Date.now()}@test.com`,
      phone: '9840000001',
      country: 'Nepal'
    };

    cy.get('[data-cy="guests-nav"]').click();
    cy.get('[data-cy="add-guest-button"]').click();
    
    cy.get('[data-cy="guest-form-firstName"]').type(guestData.firstName);
    cy.get('[data-cy="guest-form-lastName"]').type(guestData.lastName);
    cy.get('[data-cy="guest-form-email"]').type(guestData.email);
    cy.get('[data-cy="guest-form-phone"]').type(guestData.phone);
    cy.get('[data-cy="guest-form-country"]').type(guestData.country);
    
    cy.get('[data-cy="guest-form-submit"]').click();
    cy.get('[data-cy="success-toast"]', { timeout: 5000 }).should('exist');
    
    // Verify guest appears in list
    cy.get(`[data-cy="guest-row-${guestData.email}"]`).should('exist');
  });

  it('should validate required fields in guest form', () => {
    cy.get('[data-cy="guests-nav"]').click();
    cy.get('[data-cy="add-guest-button"]').click();
    
    // Try to submit empty form
    cy.get('[data-cy="guest-form-submit"]').click();
    
    // Should show validation errors
    cy.get('[data-cy="field-error-firstName"]').should('exist');
    cy.get('[data-cy="field-error-lastName"]').should('exist');
    cy.get('[data-cy="field-error-phone"]').should('exist');
  });

  it('should update guest information', () => {
    const guestData = {
      firstName: `UpdateGuest_${Date.now()}`,
      lastName: 'Updated',
      phone: '9840000002'
    };

    cy.get('[data-cy="guests-nav"]').click();
    cy.get('[data-cy="add-guest-button"]').click();
    
    cy.get('[data-cy="guest-form-firstName"]').type(guestData.firstName);
    cy.get('[data-cy="guest-form-lastName"]').type(guestData.lastName);
    cy.get('[data-cy="guest-form-email"]').type(`guest${Date.now()}@test.com`);
    cy.get('[data-cy="guest-form-phone"]').type(guestData.phone);
    cy.get('[data-cy="guest-form-submit"]').click();
    cy.get('[data-cy="success-toast"]', { timeout: 5000 }).should('exist');

    // Edit guest
    cy.get(`[data-cy="guest-edit-${guestData.firstName}"]`).click();
    cy.get('[data-cy="guest-form-phone"]').clear().type('9840000099');
    cy.get('[data-cy="guest-form-submit"]').click();
    cy.get('[data-cy="success-toast"]', { timeout: 5000 }).should('exist');
  });

  it('should track guest stats - total guests should increase', () => {
    let initialCount = 0;
    
    // Get initial count
    cy.get('[data-cy="stat-total-guests"]').then(el => {
      initialCount = parseInt(el.text().replace(/[^0-9]/g, ''));
    });

    // Create new guest
    cy.createNewGuest({
      firstName: `NewGuest_${Date.now()}`,
      lastName: 'TrackTest',
      email: `track${Date.now()}@test.com`,
      phone: '9840000003'
    });

    // Check stats updated
    cy.get('[data-cy="dashboard-nav"]').click();
    cy.get('[data-cy="stat-total-guests"]').then(el => {
      const newCount = parseInt(el.text().replace(/[^0-9]/g, ''));
      expect(newCount).to.equal(initialCount + 1);
    });
  });

  it('should delete guest', () => {
    const guestData = {
      firstName: `DeleteGuest_${Date.now()}`,
      lastName: 'ToDelete',
      email: `delete${Date.now()}@test.com`,
      phone: '9840000004'
    };

    cy.get('[data-cy="guests-nav"]').click();
    cy.get('[data-cy="add-guest-button"]').click();
    
    cy.get('[data-cy="guest-form-firstName"]').type(guestData.firstName);
    cy.get('[data-cy="guest-form-lastName"]').type(guestData.lastName);
    cy.get('[data-cy="guest-form-email"]').type(guestData.email);
    cy.get('[data-cy="guest-form-phone"]').type(guestData.phone);
    cy.get('[data-cy="guest-form-submit"]').click();
    cy.get('[data-cy="success-toast"]').should('exist');

    // Delete guest
    cy.get(`[data-cy="guest-delete-${guestData.email}"]`).click();
    cy.get('[data-cy="confirm-delete-button"]').click();
    cy.get('[data-cy="success-toast"]').should('exist');
  });

  it('should view guest profile and balance', () => {
    const guestData = {
      firstName: `ProfileGuest_${Date.now()}`,
      lastName: 'Profile',
      email: `profile${Date.now()}@test.com`,
      phone: '9840000005'
    };

    cy.createNewGuest(guestData);

    cy.get('[data-cy="guests-nav"]').click();
    cy.get(`[data-cy="guest-row-${guestData.email}"]`).click();
    
    cy.get('[data-cy="guest-profile-name"]').should('exist');
    cy.get('[data-cy="guest-profile-balance"]').should('exist');
    cy.get('[data-cy="guest-profile-email"]').should('contain', guestData.email);
  });

  it('should search guests', () => {
    const guestData = {
      firstName: `SearchGuest_${Date.now()}`,
      lastName: 'Searchable',
      email: `search${Date.now()}@test.com`,
      phone: '9840000006'
    };

    cy.createNewGuest(guestData);

    cy.get('[data-cy="guests-nav"]').click();
    cy.get('[data-cy="guests-search"]').type(guestData.firstName);
    
    // Should show filtered results
    cy.get(`[data-cy="guest-row-${guestData.email}"]`).should('exist');
  });
});
