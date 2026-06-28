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
    cy.get('[data-cy="stat-total-guests"]').should('exist');
    cy.get('[data-cy="stat-occupied-rooms"]').should('exist');
    cy.get('[data-cy="stat-restaurant-orders"]').should('exist');
    cy.get('[data-cy="stat-checked-out"]').should('exist');
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
    
    cy.get('[data-cy="login-error"]', { timeout: 5000 }).should('exist');
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
    cy.get('[data-cy="guests-search"]', { timeout: 5000 }).should('exist');
  });

  it('should navigate to Rooms page', () => {
    cy.get('[data-cy="rooms-nav"]').click();
    cy.url().should('include', '/rooms');
    cy.get('[data-cy="rooms-search"]', { timeout: 5000 }).should('exist');
  });

  it('should navigate to Orders page', () => {
    cy.get('[data-cy="orders-nav"]').click();
    cy.url().should('include', '/orders');
    cy.get('table', { timeout: 5000 }).should('exist');
  });

  it('should navigate to Checkout page', () => {
    cy.get('[data-cy="checkouts-nav"]').click();
    cy.url().should('include', '/checkouts');
    cy.get('body', { timeout: 5000 }).should('exist');
  });

  it('should navigate to Items page', () => {
    cy.get('[data-cy="items-nav"]').click();
    cy.url().should('include', '/items');
    cy.get('[data-cy="items-search"]', { timeout: 5000 }).should('exist');
  });

  it('should navigate to Stats page', () => {
    cy.get('[data-cy="stats-nav"]').click();
    cy.url().should('include', '/stats');
    cy.get('body', { timeout: 5000 }).should('exist');
  });
});
