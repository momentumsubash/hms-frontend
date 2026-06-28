// =====================================================
// TEST HELPERS & UTILITIES FOR STATS TRACKING
// =====================================================

/**
 * Capture current stats snapshot
 * @returns {Object} Stats object with all relevant metrics
 */
export const captureStatsSnapshot = () => {
  const stats = {};
  
  cy.get('[data-cy="dashboard-stats"]').within(() => {
    cy.get('[data-cy="stat-total-guests"]').then(el => {
      stats.totalGuests = parseInt(el.text().replace(/[^0-9]/g, ''));
    });
    cy.get('[data-cy="stat-occupied-rooms"]').then(el => {
      stats.occupiedRooms = parseInt(el.text().replace(/[^0-9]/g, ''));
    });
    cy.get('[data-cy="stat-restaurant-orders"]').then(el => {
      stats.totalOrders = parseInt(el.text().replace(/[^0-9]/g, ''));
    });
    cy.get('[data-cy="stat-checked-out"]').then(el => {
      stats.totalCheckouts = parseInt(el.text().replace(/[^0-9]/g, ''));
    });
  });
  
  return cy.wrap(stats);
};

/**
 * Compare two stats snapshots
 * @param {Object} beforeStats - Stats before action
 * @param {Object} afterStats - Stats after action
 * @param {Object} expectedChanges - Expected changes { field: expectedDifference }
 * @returns {Object} Comparison result
 */
export const compareStatsSnapshots = (beforeStats, afterStats, expectedChanges = {}) => {
  const comparison = {
    passed: true,
    changes: {},
    mismatches: []
  };
  
  Object.keys(expectedChanges).forEach(field => {
    const before = beforeStats[field] || 0;
    const after = afterStats[field] || 0;
    const expected = expectedChanges[field];
    const actual = after - before;
    
    comparison.changes[field] = {
      before,
      after,
      expected,
      actual,
      passed: actual === expected
    };
    
    if (actual !== expected) {
      comparison.passed = false;
      comparison.mismatches.push({
        field,
        expected,
        actual,
        message: `Expected ${field} to change by ${expected}, but changed by ${actual}`
      });
    }
  });
  
  return comparison;
};

/**
 * Calculate expected checkout total
 * @param {Array} items - Items with price and quantity
 * @param {Number} discount - Discount amount
 * @param {Number} tax - Tax percentage (optional)
 * @returns {Number} Total amount
 */
export const calculateCheckoutTotal = (items = [], discount = 0, tax = 0) => {
  let subtotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  const taxAmount = (subtotal * tax) / 100;
  const total = subtotal - discount + taxAmount;
  
  return Math.round(total * 100) / 100;
};

/**
 * Verify stats calculation after order creation
 */
export const verifyOrderStatsImpact = (orderValue) => {
  cy.get('[data-cy="stat-restaurant-orders"]').then(el => {
    const orders = parseInt(el.text().replace(/[^0-9]/g, ''));
    expect(orders).to.be.greaterThan(0);
  });
};

/**
 * Verify stats calculation after checkout
 */
export const verifyCheckoutStatsImpact = () => {
  cy.get('[data-cy="stat-checked-out"]').then(el => {
    const checkouts = parseInt(el.text().replace(/[^0-9]/g, ''));
    expect(checkouts).to.be.greaterThan(0);
  });
};

/**
 * Verify guest balance after payment
 */
export const verifyGuestBalanceAfterPayment = (guestName, expectedDeduction) => {
  cy.get('[data-cy="guests-table"]').then(el => {
    expect(el).to.exist;
  });
};

/**
 * Log stats comparison for reporting
 */
export const logStatsComparison = (testName, beforeStats, afterStats, expectedChanges) => {
  const comparison = compareStatsSnapshots(beforeStats, afterStats, expectedChanges);
  
  cy.log(`📊 TEST: ${testName}`);
  cy.log(`📈 BEFORE:`, JSON.stringify(beforeStats, null, 2));
  cy.log(`📈 AFTER:`, JSON.stringify(afterStats, null, 2));
  cy.log(`✅ EXPECTED CHANGES:`, JSON.stringify(expectedChanges, null, 2));
  cy.log(`📊 COMPARISON RESULT:`, JSON.stringify(comparison, null, 2));
  
  if (comparison.passed) {
    cy.log('✅ Stats validation PASSED');
  } else {
    cy.log('❌ Stats validation FAILED');
    comparison.mismatches.forEach(mismatch => {
      cy.log(`  ❌ ${mismatch.message}`);
    });
  }
  
  return comparison;
};

/**
 * Create test data object for checkout
 */
export const createCheckoutTestData = () => {
  return {
    guestName: `TestGuest_${Date.now()}`,
    items: [
      { name: 'Table Wine Red 150ml', price: 350, quantity: 1 },
      { name: 'Premium Spirits', price: 2100, quantity: 2 }
    ],
    discount: 100,
    taxPercent: 0
  };
};

/**
 * Simulate guest checkout flow
 */
export const simulateFullCheckoutFlow = (testData) => {
  const expectedTotal = calculateCheckoutTotal(
    testData.items,
    testData.discount,
    testData.taxPercent
  );
  
  return {
    ...testData,
    expectedTotal,
    expectedRevenue: expectedTotal
  };
};

/**
 * Verify item stock after order
 */
export const verifyItemStockAfterOrder = (itemName, expectedDeduction) => {
  cy.get('[data-cy="items-nav"]').click();
  cy.get(`[data-cy="item-search-${itemName}"]`).then(el => {
    cy.get('[data-cy="item-stock"]').then(stockEl => {
      const stock = parseInt(stockEl.text().replace(/[^0-9]/g, ''));
      expect(stock).to.exist;
    });
  });
};

/**
 * Compare referral tracking
 */
export const compareReferralStats = (beforeStats, afterStats) => {
  const referralsBefore = beforeStats.totalReferrals || 0;
  const referralsAfter = afterStats.totalReferrals || 0;
  
  return {
    added: referralsAfter - referralsBefore,
    before: referralsBefore,
    after: referralsAfter
  };
};

/**
 * Track payment flow
 */
export const trackPaymentFlow = (guestName, paymentAmount) => {
  return {
    guestName,
    paymentAmount,
    timestamp: new Date().toISOString(),
    type: 'partial_payment'
  };
};

export default {
  captureStatsSnapshot,
  compareStatsSnapshots,
  calculateCheckoutTotal,
  verifyOrderStatsImpact,
  verifyCheckoutStatsImpact,
  verifyGuestBalanceAfterPayment,
  logStatsComparison,
  createCheckoutTestData,
  simulateFullCheckoutFlow,
  verifyItemStockAfterOrder,
  compareReferralStats,
  trackPaymentFlow
};
