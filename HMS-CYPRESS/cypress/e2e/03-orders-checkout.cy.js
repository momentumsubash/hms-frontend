import * as helpers from '../support/helpers';

describe('E2E: Orders & Checkouts with Stats Tracking', () => {
  let beforeStats = {};
  let afterStats = {};
  let testGuest = {};

  beforeEach(() => {
    cy.loginAsManager();
    
    // Create test guest
    testGuest = {
      firstName: `OrderGuest_${Date.now()}`,
      lastName: 'OrderTest',
      email: `order${Date.now()}@test.com`,
      phone: '9850000001'
    };

    cy.createNewGuest(testGuest);
  });

  it('should create order and verify stats impact', () => {
    // Capture stats before
    cy.get('[data-cy="stat-total-orders"]').then(el => {
      beforeStats.totalOrders = parseInt(el.text().replace(/[^0-9]/g, ''));
    });
    cy.get('[data-cy="stat-total-revenue"]').then(el => {
      beforeStats.totalRevenue = parseFloat(el.text().replace(/[^0-9.-]+/g, ''));
    });

    // Create order
    cy.get('[data-cy="orders-nav"]').click();
    cy.get('[data-cy="create-order-button"]').click();
    
    cy.get('[data-cy="order-guest-select"]').type(testGuest.firstName);
    cy.get('[data-cy="order-guest-option"]').first().click();
    
    // Add items
    cy.get('[data-cy="add-item-button"]').click();
    cy.get('[data-cy="order-item-select"]').type('Table Wine Red 150ml');
    cy.get('[data-cy="order-item-option"]').first().click();
    cy.get('[data-cy="order-item-quantity"]').clear().type('2');
    
    cy.get('[data-cy="order-submit"]').click();
    cy.get('[data-cy="success-toast"]').should('exist');

    // Capture stats after
    cy.get('[data-cy="dashboard-nav"]').click();
    cy.get('[data-cy="stat-total-orders"]').then(el => {
      afterStats.totalOrders = parseInt(el.text().replace(/[^0-9]/g, ''));
    });

    // Verify order count increased
    expect(afterStats.totalOrders).to.equal(beforeStats.totalOrders + 1);
  });

  it('should create checkout with full payment', () => {
    // First create an order
    cy.get('[data-cy="orders-nav"]').click();
    cy.get('[data-cy="create-order-button"]').click();
    
    cy.get('[data-cy="order-guest-select"]').type(testGuest.firstName);
    cy.get('[data-cy="order-guest-option"]').first().click();
    
    cy.get('[data-cy="add-item-button"]').click();
    cy.get('[data-cy="order-item-select"]').type('Premium Spirits');
    cy.get('[data-cy="order-item-option"]').first().click();
    cy.get('[data-cy="order-item-quantity"]').clear().type('1');
    
    cy.get('[data-cy="order-submit"]').click();
    cy.get('[data-cy="success-toast"]').should('exist');

    // Capture stats before checkout
    cy.get('[data-cy="stat-total-checkouts"]').then(el => {
      beforeStats.totalCheckouts = parseInt(el.text().replace(/[^0-9]/g, ''));
    });

    // Create checkout
    cy.get('[data-cy="checkout-nav"]').click();
    cy.get('[data-cy="create-checkout-button"]').click();
    
    cy.get('[data-cy="checkout-guest-select"]').type(testGuest.firstName);
    cy.get('[data-cy="checkout-guest-option"]').first().click();
    
    // Get and verify amount
    cy.get('[data-cy="checkout-total-amount"]').should('exist');
    cy.get('[data-cy="checkout-payment-method"]').select('cash');
    
    cy.get('[data-cy="checkout-submit"]').click();
    cy.get('[data-cy="success-toast"]').should('exist');

    // Verify stats updated
    cy.get('[data-cy="stat-total-checkouts"]').then(el => {
      afterStats.totalCheckouts = parseInt(el.text().replace(/[^0-9]/g, ''));
      expect(afterStats.totalCheckouts).to.equal(beforeStats.totalCheckouts + 1);
    });
  });

  it('should create checkout with discount', () => {
    // Create order first
    cy.get('[data-cy="orders-nav"]').click();
    cy.get('[data-cy="create-order-button"]').click();
    
    cy.get('[data-cy="order-guest-select"]').type(testGuest.firstName);
    cy.get('[data-cy="order-guest-option"]').first().click();
    
    cy.get('[data-cy="add-item-button"]').click();
    cy.get('[data-cy="order-item-select"]').type('Wine');
    cy.get('[data-cy="order-item-option"]').first().click();
    cy.get('[data-cy="order-item-quantity"]').clear().type('1');
    
    cy.get('[data-cy="order-submit"]').click();
    cy.get('[data-cy="success-toast"]').should('exist');

    // Create checkout with discount
    cy.get('[data-cy="checkout-nav"]').click();
    cy.get('[data-cy="create-checkout-button"]').click();
    
    cy.get('[data-cy="checkout-guest-select"]').type(testGuest.firstName);
    cy.get('[data-cy="checkout-guest-option"]').first().click();
    
    const discountAmount = 100;
    cy.get('[data-cy="checkout-discount-amount"]').clear().type(discountAmount);
    cy.get('[data-cy="checkout-payment-method"]').select('cash');
    
    // Verify discounted amount is calculated
    cy.get('[data-cy="checkout-final-amount"]').then(el => {
      const finalAmount = parseFloat(el.text().replace(/[^0-9.-]+/g, ''));
      expect(finalAmount).to.be.greaterThan(0);
    });
    
    cy.get('[data-cy="checkout-submit"]').click();
    cy.get('[data-cy="success-toast"]').should('exist');
  });

  it('should create checkout with partial payment', () => {
    // Create order
    cy.get('[data-cy="orders-nav"]').click();
    cy.get('[data-cy="create-order-button"]').click();
    
    cy.get('[data-cy="order-guest-select"]').type(testGuest.firstName);
    cy.get('[data-cy="order-guest-option"]').first().click();
    
    cy.get('[data-cy="add-item-button"]').click();
    cy.get('[data-cy="order-item-select"]').type('Whiskey');
    cy.get('[data-cy="order-item-option"]').first().click();
    cy.get('[data-cy="order-item-quantity"]').clear().type('1');
    
    cy.get('[data-cy="order-submit"]').click();
    cy.get('[data-cy="success-toast"]').should('exist');

    // Create checkout with half payment
    cy.get('[data-cy="checkout-nav"]').click();
    cy.get('[data-cy="create-checkout-button"]').click();
    
    cy.get('[data-cy="checkout-guest-select"]').type(testGuest.firstName);
    cy.get('[data-cy="checkout-guest-option"]').first().click();
    
    // Get total and pay half
    let totalAmount = 0;
    cy.get('[data-cy="checkout-total-amount"]').then(el => {
      totalAmount = parseFloat(el.text().replace(/[^0-9.-]+/g, ''));
      const halfAmount = Math.floor(totalAmount / 2);
      cy.get('[data-cy="checkout-amount-paid"]').clear().type(halfAmount);
    });
    
    cy.get('[data-cy="checkout-payment-method"]').select('cash');
    cy.get('[data-cy="checkout-submit"]').click();
    cy.get('[data-cy="success-toast"]').should('exist');

    // Verify guest now has pending balance
    cy.get('[data-cy="guests-nav"]').click();
    cy.get('[data-cy="guests-search"]').type(testGuest.firstName);
    cy.get(`[data-cy="guest-row-${testGuest.email}"]`).click();
    
    cy.get('[data-cy="guest-profile-balance"]').then(el => {
      const balance = parseFloat(el.text().replace(/[^0-9.-]+/g, ''));
      expect(balance).to.be.greaterThan(0);
    });
  });

  it('should track revenue correctly after multiple checkouts', () => {
    let initialRevenue = 0;
    
    // Get initial revenue
    cy.get('[data-cy="stat-total-revenue"]').then(el => {
      initialRevenue = parseFloat(el.text().replace(/[^0-9.-]+/g, ''));
    });

    // Create multiple orders and checkouts
    for (let i = 0; i < 2; i++) {
      const guestName = `MultiGuest_${Date.now()}_${i}`;
      cy.createNewGuest({
        firstName: guestName,
        lastName: 'Multi',
        email: `multi${Date.now()}_${i}@test.com`,
        phone: `98500000${i}`
      });

      cy.get('[data-cy="orders-nav"]').click();
      cy.get('[data-cy="create-order-button"]').click();
      
      cy.get('[data-cy="order-guest-select"]').type(guestName);
      cy.get('[data-cy="order-guest-option"]').first().click();
      
      cy.get('[data-cy="add-item-button"]').click();
      cy.get('[data-cy="order-item-select"]').type('Wine');
      cy.get('[data-cy="order-item-option"]').first().click();
      
      cy.get('[data-cy="order-submit"]').click();
      cy.get('[data-cy="success-toast"]').should('exist');
    }

    // Verify revenue increased
    cy.get('[data-cy="stat-total-revenue"]').then(el => {
      const newRevenue = parseFloat(el.text().replace(/[^0-9.-]+/g, ''));
      expect(newRevenue).to.be.greaterThan(initialRevenue);
    });
  });

  it('should show checkout history', () => {
    cy.get('[data-cy="checkout-nav"]').click();
    cy.get('[data-cy="checkouts-list"]').should('exist');
    
    // Filter by guest
    cy.get('[data-cy="checkout-filter-guest"]').type(testGuest.firstName);
    cy.waitForLoadingToComplete();
    
    // Results should be shown
    cy.get('[data-cy="checkout-list-item"]').should('have.length.greaterThan', 0);
  });
});
