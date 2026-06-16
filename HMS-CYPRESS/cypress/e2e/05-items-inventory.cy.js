import * as helpers from '../support/helpers';

describe('E2E: Items, Inventory & Stocks', () => {
  beforeEach(() => {
    cy.loginAsManager();
  });

  describe('Item Management', () => {
    it('should view all items', () => {
      cy.get('[data-cy="items-nav"]').click();
      cy.url().should('include', '/items');
      
      cy.get('[data-cy="items-list"]').should('exist');
      cy.get('[data-cy="item-list-item"]').should('have.length.greaterThan', 0);
    });

    it('should search items', () => {
      cy.get('[data-cy="items-nav"]').click();
      cy.get('[data-cy="items-search"]').type('Wine');
      
      cy.waitForLoadingToComplete();
      
      // Results should contain Wine items
      cy.get('[data-cy="item-list-item"]').each(item => {
        cy.wrap(item).should('contain', 'Wine');
      });
    });

    it('should filter items by category', () => {
      cy.get('[data-cy="items-nav"]').click();
      cy.get('[data-cy="items-filter-category"]').select('Whiskey');
      
      cy.waitForLoadingToComplete();
      
      // Should show only Whiskey items
      cy.get('[data-cy="item-category"]').each(cat => {
        cy.wrap(cat).should('contain', 'Whiskey');
      });
    });

    it('should view item details', () => {
      cy.get('[data-cy="items-nav"]').click();
      cy.get('[data-cy="item-list-item"]').first().click();
      
      cy.get('[data-cy="item-detail-name"]').should('exist');
      cy.get('[data-cy="item-detail-price"]').should('exist');
      cy.get('[data-cy="item-detail-stock"]').should('exist');
      cy.get('[data-cy="item-detail-category"]').should('exist');
    });
  });

  describe('Item Pricing', () => {
    it('should update item price', () => {
      cy.get('[data-cy="items-nav"]').click();
      cy.get('[data-cy="items-search"]').type('Table Wine Red 150ml');
      
      cy.waitForLoadingToComplete();
      
      cy.get('[data-cy="item-edit-button"]').first().click();
      
      let oldPrice = 0;
      cy.get('[data-cy="item-price-input"]').then(el => {
        oldPrice = parseFloat(el.val());
      });

      const newPrice = oldPrice + 50;
      cy.get('[data-cy="item-price-input"]').clear().type(newPrice);
      cy.get('[data-cy="item-save-button"]').click();
      cy.get('[data-cy="success-toast"]').should('exist');

      // Verify price updated
      cy.get('[data-cy="item-list-item"]').first().then(el => {
        cy.wrap(el).should('contain', newPrice);
      });
    });

    it('should validate price is positive', () => {
      cy.get('[data-cy="items-nav"]').click();
      cy.get('[data-cy="items-search"]').type('Whiskey');
      
      cy.waitForLoadingToComplete();
      
      cy.get('[data-cy="item-edit-button"]').first().click();
      
      cy.get('[data-cy="item-price-input"]').clear().type('-100');
      cy.get('[data-cy="item-save-button"]').click();
      
      cy.get('[data-cy="error-toast"]').should('exist');
    });

    it('should show price history', () => {
      cy.get('[data-cy="items-nav"]').click();
      cy.get('[data-cy="items-search"]').type('Wine');
      
      cy.waitForLoadingToComplete();
      
      cy.get('[data-cy="item-list-item"]').first().click();
      cy.get('[data-cy="item-price-history"]').should('exist');
    });
  });

  describe('Stock Management', () => {
    it('should update item stock', () => {
      cy.get('[data-cy="items-nav"]').click();
      cy.get('[data-cy="items-search"]').type('Vodka');
      
      cy.waitForLoadingToComplete();
      
      cy.get('[data-cy="item-edit-button"]').first().click();
      
      const newStock = 50;
      cy.get('[data-cy="item-stock-input"]').clear().type(newStock);
      cy.get('[data-cy="item-save-button"]').click();
      cy.get('[data-cy="success-toast"]').should('exist');
    });

    it('should track stock reduction after order', () => {
      // Get initial stock
      cy.get('[data-cy="items-nav"]').click();
      cy.get('[data-cy="items-search"]').type('Premium Spirits');
      
      cy.waitForLoadingToComplete();
      
      cy.get('[data-cy="item-list-item"]').first().click();
      let initialStock = 0;
      cy.get('[data-cy="item-detail-stock"]').then(el => {
        initialStock = parseInt(el.text().replace(/[^0-9]/g, ''));
      });

      // Create guest and order
      const guestData = {
        firstName: `StockGuest_${Date.now()}`,
        lastName: 'StockTest',
        email: `stock${Date.now()}@test.com`,
        phone: '9880000001'
      };

      cy.createNewGuest(guestData);

      cy.get('[data-cy="orders-nav"]').click();
      cy.get('[data-cy="create-order-button"]').click();
      
      cy.get('[data-cy="order-guest-select"]').type(guestData.firstName);
      cy.get('[data-cy="order-guest-option"]').first().click();
      
      cy.get('[data-cy="add-item-button"]').click();
      cy.get('[data-cy="order-item-select"]').type('Premium Spirits');
      cy.get('[data-cy="order-item-option"]').first().click();
      cy.get('[data-cy="order-item-quantity"]').clear().type('2');
      
      cy.get('[data-cy="order-submit"]').click();
      cy.get('[data-cy="success-toast"]').should('exist');

      // Check updated stock
      cy.get('[data-cy="items-nav"]').click();
      cy.get('[data-cy="items-search"]').type('Premium Spirits');
      
      cy.waitForLoadingToComplete();
      
      cy.get('[data-cy="item-list-item"]').first().click();
      cy.get('[data-cy="item-detail-stock"]').then(el => {
        const updatedStock = parseInt(el.text().replace(/[^0-9]/g, ''));
        expect(updatedStock).to.equal(initialStock - 2);
      });
    });

    it('should prevent order when stock is insufficient', () => {
      const guestData = {
        firstName: `InsufficientGuest_${Date.now()}`,
        lastName: 'Insufficient',
        email: `insufficient${Date.now()}@test.com`,
        phone: '9880000002'
      };

      cy.createNewGuest(guestData);

      // Set item stock to 1
      cy.get('[data-cy="items-nav"]').click();
      cy.get('[data-cy="items-search"]').type('Table Wine White 150ml');
      
      cy.waitForLoadingToComplete();
      
      cy.get('[data-cy="item-edit-button"]').first().click();
      cy.get('[data-cy="item-stock-input"]').clear().type('1');
      cy.get('[data-cy="item-save-button"]').click();
      cy.get('[data-cy="success-toast"]').should('exist');

      // Try to order 2 units
      cy.get('[data-cy="orders-nav"]').click();
      cy.get('[data-cy="create-order-button"]').click();
      
      cy.get('[data-cy="order-guest-select"]').type(guestData.firstName);
      cy.get('[data-cy="order-guest-option"]').first().click();
      
      cy.get('[data-cy="add-item-button"]').click();
      cy.get('[data-cy="order-item-select"]').type('Table Wine White 150ml');
      cy.get('[data-cy="order-item-option"]').first().click();
      cy.get('[data-cy="order-item-quantity"]').clear().type('2');
      
      cy.get('[data-cy="order-submit"]').click();
      
      // Should show error
      cy.get('[data-cy="error-toast"]').should('exist');
    });

    it('should show low stock warning', () => {
      cy.get('[data-cy="items-nav"]').click();
      
      // Items with low stock should have warning icon
      cy.get('[data-cy="item-low-stock-warning"]').each(item => {
        cy.wrap(item).should('be.visible');
      });
    });

    it('should track stock levels over time', () => {
      cy.get('[data-cy="items-nav"]').click();
      cy.get('[data-cy="items-search"]').type('Whiskey');
      
      cy.waitForLoadingToComplete();
      
      cy.get('[data-cy="item-list-item"]').first().click();
      cy.get('[data-cy="item-stock-history"]').should('exist');
      cy.get('[data-cy="stock-history-chart"]').should('exist');
    });
  });

  describe('Item Categories', () => {
    it('should display all categories', () => {
      cy.get('[data-cy="items-nav"]').click();
      cy.get('[data-cy="items-filter-category"]').should('exist');
      
      // Click to open category list
      cy.get('[data-cy="items-filter-category"]').click();
      cy.get('[data-cy="category-option"]').should('have.length.greaterThan', 0);
    });

    it('should filter items by multiple categories', () => {
      cy.get('[data-cy="items-nav"]').click();
      
      cy.get('[data-cy="items-filter-category"]').select('Wine');
      cy.waitForLoadingToComplete();
      
      cy.get('[data-cy="item-list-item"]').should('have.length.greaterThan', 0);
    });
  });

  describe('Item Availability', () => {
    it('should toggle item availability', () => {
      cy.get('[data-cy="items-nav"]').click();
      cy.get('[data-cy="items-search"]').type('Wine');
      
      cy.waitForLoadingToComplete();
      
      cy.get('[data-cy="item-availability-toggle"]').first().click();
      cy.get('[data-cy="success-toast"]').should('exist');
      
      // Verify toggle state changed
      cy.get('[data-cy="item-availability-toggle"]').first().should('have.attr', 'aria-checked', 'false');
    });

    it('should prevent ordering unavailable items', () => {
      const guestData = {
        firstName: `UnavailableGuest_${Date.now()}`,
        lastName: 'Unavailable',
        email: `unavailable${Date.now()}@test.com`,
        phone: '9880000003'
      };

      cy.createNewGuest(guestData);

      // Disable item
      cy.get('[data-cy="items-nav"]').click();
      cy.get('[data-cy="items-search"]').type('Chivas');
      
      cy.waitForLoadingToComplete();
      
      cy.get('[data-cy="item-availability-toggle"]').first().click();
      cy.get('[data-cy="success-toast"]').should('exist');

      // Try to order disabled item
      cy.get('[data-cy="orders-nav"]').click();
      cy.get('[data-cy="create-order-button"]').click();
      
      cy.get('[data-cy="order-guest-select"]').type(guestData.firstName);
      cy.get('[data-cy="order-guest-option"]').first().click();
      
      cy.get('[data-cy="add-item-button"]').click();
      cy.get('[data-cy="order-item-select"]').type('Chivas');
      
      // Disabled item should not appear or should show as unavailable
      cy.get('[data-cy="order-item-option"]').should('not.exist');
    });
  });
});
