import * as helpers from '../support/helpers';

describe('E2E: Authentication & Dashboard', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should login with valid Momentum manager credentials', () => {
    cy.get('[data-cy="login-email"]').type('manager@momentum.com');
    cy.get('[data-cy="login-password"]').type('Manager@123');
    cy.get('[data-cy="login-submit"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.get('[data-cy="dashboard-header"]', { timeout: 10000 }).should('exist');
    cy.get('[data-cy="user-welcome-text"]').should('contain', 'Welcome');
  });

  it('should display dashboard stats on load', () => {
    cy.loginAsManager();
    
    cy.get('[data-cy="dashboard-stats"]').should('exist');
    cy.get('[data-cy="stat-total-revenue"]').should('exist');
    cy.get('[data-cy="stat-total-guests"]').should('exist');
    cy.get('[data-cy="stat-total-orders"]').should('exist');
  });

  it('should logout successfully', () => {
    cy.loginAsManager();
    cy.logout();
    
    cy.url().should('include', '/login');
  });

  it('should reject invalid credentials', () => {
    cy.get('[data-cy="login-email"]').type('invalid@test.com');
    cy.get('[data-cy="login-password"]').type('wrongpassword');
    cy.get('[data-cy="login-submit"]').click();
    
    cy.get('[data-cy="error-toast"]', { timeout: 5000 }).should('exist');
    cy.url().should('not.include', '/dashboard');
  });
});

describe('E2E: Navigation & Menu', () => {
  beforeEach(() => {
    cy.loginAsManager();
  });

  it('should navigate to Guests page', () => {
    cy.get('[data-cy="guests-nav"]').click();
    cy.url().should('include', '/guests');
    cy.get('[data-cy="guests-header"]').should('exist');
  });

  it('should navigate to Rooms page', () => {
    cy.get('[data-cy="rooms-nav"]').click();
    cy.url().should('include', '/rooms');
    cy.get('[data-cy="rooms-header"]').should('exist');
  });

  it('should navigate to Orders page', () => {
    cy.get('[data-cy="orders-nav"]').click();
    cy.url().should('include', '/orders');
    cy.get('[data-cy="orders-header"]').should('exist');
  });

  it('should navigate to Checkout page', () => {
    cy.get('[data-cy="checkout-nav"]').click();
    cy.url().should('include', '/checkout');
    cy.get('[data-cy="checkout-header"]').should('exist');
  });

  it('should navigate to Items page', () => {
    cy.get('[data-cy="items-nav"]').click();
    cy.url().should('include', '/items');
    cy.get('[data-cy="items-header"]').should('exist');
  });

  it('should navigate to Stats page', () => {
    cy.get('[data-cy="stats-nav"]').click();
    cy.url().should('include', '/stats');
    cy.get('[data-cy="stats-header"]').should('exist');
  });
});
