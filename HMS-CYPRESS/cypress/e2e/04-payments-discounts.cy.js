import * as helpers from '../support/helpers';

describe('E2E: Payments, Discounts & Referrals', () => {
  let testGuest = {};

  beforeEach(() => {
    cy.loginAsManager();
    
    testGuest = {
      firstName: `PaymentGuest_${Date.now()}`,
      lastName: 'PaymentTest',
      email: `payment${Date.now()}@test.com`,
      phone: '9860000001'
    };

    cy.createNewGuest(testGuest);
  });

  describe('Payment Management', () => {
    it('should record partial payment and reduce balance', () => {
      // Create order first
      cy.get('[data-cy="orders-nav"]').click();
      cy.get('[data-cy="create-order-button"]').click();
      
      cy.get('[data-cy="order-guest-select"]').type(testGuest.firstName);
      cy.get('[data-cy="order-guest-option"]').first().click();
      
      cy.get('[data-cy="add-item-button"]').click();
      cy.get('[data-cy="order-item-select"]').type('Wine');
      cy.get('[data-cy="order-item-option"]').first().click();
      cy.get('[data-cy="order-item-quantity"]').clear().type('2');
      
      cy.get('[data-cy="order-submit"]').click();
      cy.get('[data-cy="success-toast"]').should('exist');

      // Get initial balance
      cy.get('[data-cy="guests-nav"]').click();
      cy.get('[data-cy="guests-search"]').type(testGuest.firstName);
      cy.get(`[data-cy="guest-row-${testGuest.email}"]`).click();
      
      let initialBalance = 0;
      cy.get('[data-cy="guest-profile-balance"]').then(el => {
        initialBalance = parseFloat(el.text().replace(/[^0-9.-]+/g, ''));
      });

      // Make partial payment
      const paymentAmount = 100;
      cy.get('[data-cy="guest-pay-due-button"]').click();
      cy.get('[data-cy="payment-amount-input"]').clear().type(paymentAmount);
      cy.get('[data-cy="payment-method-select"]').select('cash');
      cy.get('[data-cy="payment-submit"]').click();
      cy.get('[data-cy="success-toast"]').should('exist');

      // Verify balance decreased
      cy.get('[data-cy="guest-profile-balance"]').then(el => {
        const newBalance = parseFloat(el.text().replace(/[^0-9.-]+/g, ''));
        expect(newBalance).to.equal(initialBalance - paymentAmount);
      });
    });

    it('should record full payment and clear balance', () => {
      // Create checkout with known amount
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

      // Create checkout with partial payment
      cy.get('[data-cy="checkout-nav"]').click();
      cy.get('[data-cy="create-checkout-button"]').click();
      
      cy.get('[data-cy="checkout-guest-select"]').type(testGuest.firstName);
      cy.get('[data-cy="checkout-guest-option"]').first().click();
      
      let totalAmount = 0;
      cy.get('[data-cy="checkout-total-amount"]').then(el => {
        totalAmount = parseFloat(el.text().replace(/[^0-9.-]+/g, ''));
        const halfAmount = Math.floor(totalAmount / 2);
        cy.get('[data-cy="checkout-amount-paid"]').clear().type(halfAmount);
      });
      
      cy.get('[data-cy="checkout-payment-method"]').select('cash');
      cy.get('[data-cy="checkout-submit"]').click();
      cy.get('[data-cy="success-toast"]').should('exist');

      // Now pay remaining balance
      cy.get('[data-cy="guests-nav"]').click();
      cy.get('[data-cy="guests-search"]').type(testGuest.firstName);
      cy.get(`[data-cy="guest-row-${testGuest.email}"]`).click();
      
      cy.get('[data-cy="guest-pay-due-button"]').click();
      cy.get('[data-cy="payment-amount-input"]').then(el => {
        const remaining = Math.floor(totalAmount / 2);
        cy.get('[data-cy="payment-amount-input"]').clear().type(remaining);
      });
      cy.get('[data-cy="payment-method-select"]').select('cash');
      cy.get('[data-cy="payment-submit"]').click();
      cy.get('[data-cy="success-toast"]').should('exist');

      // Verify balance is zero or minimal
      cy.get('[data-cy="guest-profile-balance"]').then(el => {
        const finalBalance = parseFloat(el.text().replace(/[^0-9.-]+/g, ''));
        expect(finalBalance).to.be.lessThanOrEqual(0.01);
      });
    });

    it('should track payment history', () => {
      // Make payment
      cy.get('[data-cy="orders-nav"]').click();
      cy.get('[data-cy="create-order-button"]').click();
      
      cy.get('[data-cy="order-guest-select"]').type(testGuest.firstName);
      cy.get('[data-cy="order-guest-option"]').first().click();
      
      cy.get('[data-cy="add-item-button"]').click();
      cy.get('[data-cy="order-item-select"]').type('Premium Spirits');
      cy.get('[data-cy="order-item-option"]').first().click();
      
      cy.get('[data-cy="order-submit"]').click();
      cy.get('[data-cy="success-toast"]').should('exist');

      cy.get('[data-cy="guests-nav"]').click();
      cy.get('[data-cy="guests-search"]').type(testGuest.firstName);
      cy.get(`[data-cy="guest-row-${testGuest.email}"]`).click();
      
      cy.get('[data-cy="guest-pay-due-button"]').click();
      cy.get('[data-cy="payment-amount-input"]').clear().type('50');
      cy.get('[data-cy="payment-method-select"]').select('card');
      cy.get('[data-cy="payment-submit"]').click();
      cy.get('[data-cy="success-toast"]').should('exist');

      // View payment history
      cy.get('[data-cy="guest-payment-history"]').should('exist');
      cy.get('[data-cy="payment-history-item"]').should('have.length.greaterThan', 0);
    });
  });

  describe('Discount Management', () => {
    it('should apply discount to checkout', () => {
      // Create order
      cy.get('[data-cy="orders-nav"]').click();
      cy.get('[data-cy="create-order-button"]').click();
      
      cy.get('[data-cy="order-guest-select"]').type(testGuest.firstName);
      cy.get('[data-cy="order-guest-option"]').first().click();
      
      cy.get('[data-cy="add-item-button"]').click();
      cy.get('[data-cy="order-item-select"]').type('Wine');
      cy.get('[data-cy="order-item-option"]').first().click();
      cy.get('[data-cy="order-item-quantity"]').clear().type('3');
      
      cy.get('[data-cy="order-submit"]').click();
      cy.get('[data-cy="success-toast"]').should('exist');

      // Create checkout with discount
      cy.get('[data-cy="checkout-nav"]').click();
      cy.get('[data-cy="create-checkout-button"]').click();
      
      cy.get('[data-cy="checkout-guest-select"]').type(testGuest.firstName);
      cy.get('[data-cy="checkout-guest-option"]').first().click();
      
      let totalBeforeDiscount = 0;
      let totalAfterDiscount = 0;
      const discountAmount = 200;
      
      cy.get('[data-cy="checkout-total-amount"]').then(el => {
        totalBeforeDiscount = parseFloat(el.text().replace(/[^0-9.-]+/g, ''));
      });

      cy.get('[data-cy="checkout-discount-amount"]').clear().type(discountAmount);
      
      cy.get('[data-cy="checkout-final-amount"]').then(el => {
        totalAfterDiscount = parseFloat(el.text().replace(/[^0-9.-]+/g, ''));
        expect(totalAfterDiscount).to.equal(totalBeforeDiscount - discountAmount);
      });

      cy.get('[data-cy="checkout-payment-method"]').select('cash');
      cy.get('[data-cy="checkout-submit"]').click();
      cy.get('[data-cy="success-toast"]').should('exist');
    });

    it('should validate discount does not exceed total', () => {
      cy.get('[data-cy="orders-nav"]').click();
      cy.get('[data-cy="create-order-button"]').click();
      
      cy.get('[data-cy="order-guest-select"]').type(testGuest.firstName);
      cy.get('[data-cy="order-guest-option"]').first().click();
      
      cy.get('[data-cy="add-item-button"]').click();
      cy.get('[data-cy="order-item-select"]').type('Whiskey');
      cy.get('[data-cy="order-item-option"]').first().click();
      
      cy.get('[data-cy="order-submit"]').click();
      cy.get('[data-cy="success-toast"]').should('exist');

      cy.get('[data-cy="checkout-nav"]').click();
      cy.get('[data-cy="create-checkout-button"]').click();
      
      cy.get('[data-cy="checkout-guest-select"]').type(testGuest.firstName);
      cy.get('[data-cy="checkout-guest-option"]').first().click();
      
      // Try to apply discount greater than total
      cy.get('[data-cy="checkout-discount-amount"]').clear().type('9999');
      cy.get('[data-cy="checkout-submit"]').click();
      
      // Should show validation error
      cy.get('[data-cy="error-toast"]').should('exist');
    });
  });

  describe('Referral Management', () => {
    it('should create referrer', () => {
      const referrerData = {
        name: `Referrer_${Date.now()}`,
        phone: '9870000001',
        commissionPercent: 5
      };

      cy.get('[data-cy="referrers-nav"]').click();
      cy.get('[data-cy="add-referrer-button"]').click();
      
      cy.get('[data-cy="referrer-form-name"]').type(referrerData.name);
      cy.get('[data-cy="referrer-form-phone"]').type(referrerData.phone);
      cy.get('[data-cy="referrer-form-commission"]').type(referrerData.commissionPercent);
      
      cy.get('[data-cy="referrer-form-submit"]').click();
      cy.get('[data-cy="success-toast"]').should('exist');
      
      // Verify referrer appears in list
      cy.get(`[data-cy="referrer-${referrerData.name}"]`).should('exist');
    });

    it('should track referrals in guest profile', () => {
      // Create referrer
      const referrerData = {
        name: `TrackReferrer_${Date.now()}`,
        phone: '9870000002',
        commissionPercent: 10
      };

      cy.get('[data-cy="referrers-nav"]').click();
      cy.get('[data-cy="add-referrer-button"]').click();
      
      cy.get('[data-cy="referrer-form-name"]').type(referrerData.name);
      cy.get('[data-cy="referrer-form-phone"]').type(referrerData.phone);
      cy.get('[data-cy="referrer-form-commission"]').type(referrerData.commissionPercent);
      
      cy.get('[data-cy="referrer-form-submit"]').click();
      cy.get('[data-cy="success-toast"]').should('exist');

      // Update guest with referrer
      cy.get('[data-cy="guests-nav"]').click();
      cy.get('[data-cy="guests-search"]').type(testGuest.firstName);
      cy.get(`[data-cy="guest-row-${testGuest.email}"]`).click();
      
      cy.get('[data-cy="guest-edit-button"]').click();
      cy.get('[data-cy="guest-referrer-select"]').type(referrerData.name);
      cy.get('[data-cy="guest-referrer-option"]').first().click();
      cy.get('[data-cy="guest-form-submit"]').click();
      cy.get('[data-cy="success-toast"]').should('exist');

      // Verify referrer is set
      cy.get('[data-cy="guest-profile-referrer"]').should('contain', referrerData.name);
    });

    it('should calculate referral commission', () => {
      // Create referrer with commission
      const referrerData = {
        name: `CommissionReferrer_${Date.now()}`,
        phone: '9870000003',
        commissionPercent: 15
      };

      cy.get('[data-cy="referrers-nav"]').click();
      cy.get('[data-cy="add-referrer-button"]').click();
      
      cy.get('[data-cy="referrer-form-name"]').type(referrerData.name);
      cy.get('[data-cy="referrer-form-phone"]').type(referrerData.phone);
      cy.get('[data-cy="referrer-form-commission"]').type(referrerData.commissionPercent);
      
      cy.get('[data-cy="referrer-form-submit"]').click();
      cy.get('[data-cy="success-toast"]').should('exist');

      // View referrer details
      cy.get(`[data-cy="referrer-${referrerData.name}"]`).click();
      
      cy.get('[data-cy="referrer-commission-percent"]').should('contain', referrerData.commissionPercent);
      cy.get('[data-cy="referrer-total-earnings"]').should('exist');
    });
  });
});
