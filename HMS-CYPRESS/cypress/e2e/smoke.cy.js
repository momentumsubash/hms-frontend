/// <reference types="cypress" />

/**
 * =============================================================================
 * COMPREHENSIVE SMOKE TEST — Momentum Hotel
 * =============================================================================
 * Resets only Momentum Hotel data, then runs the full business flow:
 *   Guest creation (single + multi-room, advance, room discount),
 *   Order (3 items → delete 1 → 2), KOT kitchen flow, status change,
 *   Checkout (partial + full), due payments, referrer, stats,
 *   expenditure, and record-book verification.
 *
 * Runs for TWO roles (org-admin / staff) on TWO viewports (desktop / mobile).
 * =============================================================================
 */

const API = Cypress.env('apiUrl') || 'http://localhost:30005';
const MGR = { email: 'manager@momentum.com', password: 'Manager@123' };
const STAFF = { email: 'reception@momentum.com', password: 'Staff@123' };

const ts = Date.now();
const GUEST_A = `SmokeGA_${ts}`;
const GUEST_B = `SmokeGB_${ts}`;
const PHONE_A = `98${ts.toString().slice(-8)}`;
const PHONE_B = `97${ts.toString().slice(-8)}`;
const REF_NAME = `Ref_${ts}`;
const STAFF_GUEST = `StaffG_${ts}`;
const STAFF_PHONE = `95${ts.toString().slice(-8)}`;

let token = '';
let hotelId = '';
let guestAId = '';
let guestBId = '';
let roomA = '';
let roomBNumbers = [];
let itemIds = [];
let orderId = '';
let kotNum = '';

// ── Authenticated API helper ───────────────────────────────────────────────
function api(path, method = 'GET', body = null) {
  const opts = {
    method,
    url: `${API}${path}`,
    headers: { Authorization: `Bearer ${token}` },
    failOnStatusCode: false,
  };
  if (body) opts.body = body;
  return cy.request(opts);
}

// ── Reset data ─────────────────────────────────────────────────────────────
before(() => {
  api('/api/auth/login', 'POST', {
    email: MGR.email,
    password: MGR.password,
  }).then((r) => {
    token = r.body.token;
    hotelId = r.body.user.hotel;

    api('/api/admin/reset-test-data', 'POST', { confirm: 'RESET_MOMENTUM_DATA' }).then((resetRes) => {
      expect(resetRes.status).to.be.oneOf([200, 201]);
    });
  });
});

// ============================================================================
//  ORG ADMIN — DESKTOP  (1200×800)
// ============================================================================
describe('Org Admin — Desktop', { viewportWidth: 1200, viewportHeight: 800 }, () => {
  /* ── 1. Login ─────────────────────────────────────────────────────────── */
  it('01 — login as org admin', () => {
    cy.login(MGR.email, MGR.password);
    cy.url().should('include', '/dashboard');
  });

  /* ── 2. Create Referrer ───────────────────────────────────────────────── */
  it('02 — create referrer', () => {
    cy.visit('/referrers');
    cy.get('[data-cy="referrers-add-new"]', { timeout: 10000 }).click();
    cy.get('.fixed.inset-0.z-50 input[type="text"]').first().type(REF_NAME);
    cy.get('.fixed.inset-0.z-50 input[type="number"]').first().clear().type('500');
    cy.get('[data-cy="referrers-form-submit"]').click();
    cy.get('[data-cy="referrers-table"]', { timeout: 10000 }).should('contain', REF_NAME);
  });

  /* ── 3. Guest A — single room, advance, referrer ─────────────────────── */
  it('03 — create guest A (single room, advance, referrer)', () => {
    // Fetch referrer ID to assign
    api('/api/referrers').then((refRes) => {
      const refs = Array.isArray(refRes.body.data) ? refRes.body.data : [];
      const refId = refs.find((r) => r.fullName === REF_NAME)?._id || '';

      api('/api/rooms?limit=20').then((r) => {
        const rooms = Array.isArray(r.body.data) ? r.body.data : [];
        const firstRoom = rooms.find((rm) => !rm.isOccupied) || rooms[0];
        roomA = firstRoom.roomNumber;

        const payload = {
          firstName: GUEST_A,
          lastName: 'Test',
          phone: PHONE_A,
          email: `${GUEST_A}@test.com`,
          advancePaid: 1000,
          rooms: [firstRoom.roomNumber],
          checkInDate: new Date(Date.now() + 60000).toISOString(),
          hotel: hotelId,
          referrer: refId || undefined,
        };

        api('/api/guests', 'POST', payload).then((r2) => {
          expect(r2.status).to.be.oneOf([200, 201]);
          guestAId = r2.body.data._id;

          cy.visit('/guests');
          cy.contains(GUEST_A, { timeout: 15000 }).should('exist');
        });
      });
    });
  });

  /* ── 4. Guest B — multi-room, room discount ──────────────────────────── */
  it('04 — create guest B (multi-room, room discount)', () => {
    api('/api/rooms?limit=20').then((r) => {
      const rooms = Array.isArray(r.body.data) ? r.body.data : [];
      const avail = rooms.filter((rm) => !rm.isOccupied);
      roomBNumbers = avail.slice(0, 2).map((rm) => rm.roomNumber);

      const payload = {
        firstName: GUEST_B,
        lastName: 'Test',
        phone: PHONE_B,
        email: `${GUEST_B}@test.com`,
        roomDiscount: 200,
        rooms: roomBNumbers,
        checkInDate: new Date(Date.now() + 60000).toISOString(),
        hotel: hotelId,
      };

      api('/api/guests', 'POST', payload).then((r2) => {
        expect(r2.status).to.be.oneOf([200, 201]);
        guestBId = r2.body.data._id;

        cy.visit('/guests');
        cy.contains(GUEST_B, { timeout: 15000 }).should('exist');
      });
    });
  });

  /* ── 5. Create 3 test items, create order, delete 1 via UI → 2 remain ── */
  it('05 — create items + order, delete 1 item via UI', () => {
    expect(roomA).to.not.be.empty;

    // Get categories then create 3 test items
    api('/api/categories').then((catRes) => {
      const cats = Array.isArray(catRes.body.data) ? catRes.body.data : [];
      const catId = cats.length ? cats[0]._id : undefined;

      api('/api/items', 'POST', {
        name: `SmokeItem_${ts}_1`, price: 200, category: catId, isAvailable: true, hotel: hotelId, stock: 100,
      }).then((r1) => {
        api('/api/items', 'POST', {
          name: `SmokeItem_${ts}_2`, price: 200, category: catId, isAvailable: true, hotel: hotelId, stock: 100,
        }).then((r2) => {
          api('/api/items', 'POST', {
            name: `SmokeItem_${ts}_3`, price: 200, category: catId, isAvailable: true, hotel: hotelId, stock: 100,
          }).then((r3) => {
            itemIds = [r1.body.data?._id || r1.body._id, r2.body.data?._id || r2.body._id, r3.body.data?._id || r3.body._id];

            api('/api/orders', 'POST', {
              roomNumber: roomA,
              items: itemIds.map((id) => ({ itemId: id, quantity: 1 })),
            }).then((ordRes) => {
              expect(ordRes.status).to.be.oneOf([200, 201]);
              orderId = ordRes.body.data._id;
              kotNum = ordRes.body.data.kotNumber;

              api(`/api/orders/${orderId}`).then(() => {
                cy.visit('/orders');
                cy.get('[data-cy="orders-table"]', { timeout: 15000 }).should('be.visible');

                cy.get('[data-cy="orders-table-body"]')
                  .contains('td', kotNum)
                  .closest('tr')
                  .find('[data-cy^="orders-edit-btn-"]')
                  .click();

                cy.get('[data-cy="orders-modal"]', { timeout: 10000 }).should('be.visible');
                cy.get('[data-cy="orders-remove-item-2"]').click();
                cy.wait(300);
                cy.get('[data-cy="orders-submit"]').click();
                cy.get('[data-cy="orders-modal"]', { timeout: 10000 }).should('not.exist');

                api(`/api/orders/${orderId}`).then((r4) => {
                  const finalItems = r4.body.data?.items || r4.body.items || [];
                  expect(finalItems.length).to.equal(2);
                });
              });
            });
          });
        });
      });
    });
  });

  /* ── 6. Send KOT & Kitchen flow pending → preparing → ready → served ── */
  it('06 — send KOT and complete kitchen flow', () => {
    api(`/api/kot/send/${orderId}`, 'POST').then((r) => {
      expect(r.status).to.be.oneOf([200, 201]);
    });

    cy.visit('/kitchen');
    cy.get('[data-cy="kitchen-refresh"]', { timeout: 15000 }).click();
    cy.wait(2000);
    cy.get('[data-cy="kitchen-refresh"]').click();

    // Pending → Preparing
    cy.get('[data-cy="kitchen-tab-pending"]').click();
    cy.get(`[data-cy="kitchen-start-preparing-${kotNum}"]`, { timeout: 15000 }).click();
    cy.get('[data-cy="kitchen-tab-preparing"]').click();

    // Preparing → Ready
    cy.get(`[data-cy="kitchen-mark-ready-${kotNum}"]`, { timeout: 10000 }).click();
    cy.get('[data-cy="kitchen-tab-ready"]').click();

    // Ready → Served
    cy.get(`[data-cy="kitchen-mark-served-${kotNum}"]`, { timeout: 10000 }).click();

    // Verify via API
    cy.wait(1000).then(() => {
      api(`/api/orders/${orderId}`).then((r) => {
        const ks = r.body.data?.kotStatus || r.body.kotStatus;
        expect(ks).to.equal('served');
      });
    });
  });

  /* ── 7. Complete order ───────────────────────────────────────────────── */
  it('07 — mark order as completed', () => {
    cy.visit('/orders');
    cy.get('[data-cy="orders-table"]', { timeout: 15000 }).should('be.visible');

    cy.get('[data-cy="orders-table-body"]')
      .contains('td', kotNum)
      .closest('tr')
      .find('[data-cy^="orders-status-btn-"]')
      .click();

    cy.get('[data-cy="orders-status-modal"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="orders-status-select"]').select('completed');
    cy.get('[data-cy="orders-status-modal-update"]').click();
    cy.get('[data-cy="orders-status-modal"]', { timeout: 10000 }).should('not.exist');
  });

  /* ── 8. Verify checkout billing breakdown ────────────────────────────── */
  it('08 — verify checkout billing breakdown', () => {
    api('/api/checkouts').then((cr) => {
      const checkouts = Array.isArray(cr.body.data) ? cr.body.data : [];
      const co = checkouts.find((c) => {
        const gid = typeof c.guest === 'object' ? c.guest._id || c.guest : c.guest;
        return String(gid) === String(guestAId);
      });
      expect(co).to.exist;

      // Verify room charges and order charges are present
      expect(co.totalRoomCharge).to.be.gt(0);
      expect(co.totalOrderCharge).to.be.gt(0);
      expect(co.totalBill).to.be.gt(0);
    });
  });

  /* ── 9. Guest A — partial checkout (pay less → creates due) ─────────── */
  it('09 — partial checkout for guest A (creates due)', () => {
    api('/api/checkouts').then((cr) => {
      const checkouts = Array.isArray(cr.body.data) ? cr.body.data : [];
      const co = checkouts.find((c) => {
        const gid = typeof c.guest === 'object' ? c.guest._id || c.guest : c.guest;
        return String(gid) === String(guestAId);
      });
      expect(co).to.exist;

      // Pay less than total → creates due
      const payAmount = Math.max(0, co.totalBill - 500);
      return api('/api/checkouts/payment', 'POST', {
        id: co._id,
        paymentAmount: payAmount,
        paymentMethod: 'cash',
        roomDiscount: 0,
        orderDiscount: 0,
        checkOutDate: new Date(Date.now() + 60000).toISOString(),
      });
    }).then((pr) => {
      expect(pr.status).to.be.oneOf([200, 201]);
      return api(`/api/guests/${guestAId}`);
    }).then((gr) => {
      const data = gr.body.data?.guest || gr.body.data;
      const due = data?.dueAmount;
      expect(due).to.be.gt(0);
    });
  });

  /* ── 10. Guest B — full checkout via UI ──────────────────────────────── */
  it('10 — full checkout for guest B via UI', () => {
    cy.visit('/checkouts');
    cy.get('[data-cy="checkouts-table"]', { timeout: 10000 }).should('be.visible');

    cy.contains(GUEST_B, { timeout: 15000 })
      .closest('tr')
      .find('[data-cy^="checkouts-edit-btn-"]')
      .click();

    cy.get('[data-cy="checkouts-edit-modal"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="checkouts-edit-status"]').select('completed');
    cy.get('#paymentAmount').clear().type('99999');
    cy.get('[data-cy="checkouts-edit-save-btn"]').click();
    cy.get('[data-cy="checkouts-edit-modal"]', { timeout: 15000 }).should('not.exist');
  });

  /* ── 11. Pay due in multiple installments ─────────────────────────────── */
  it('11 — pay guest A due in 2 installments via UI', () => {
    // First installment
    cy.visit('/dues');
    cy.get('[data-cy="dues-search"]', { timeout: 10000 }).clear().type(PHONE_A);
    cy.wait(1500);

    cy.contains(GUEST_A).closest('tr').find('[data-cy="dues-record-payment"]').click();
    cy.get('.fixed.inset-0.z-50 input[type="number"]').first().invoke('val', '300').trigger('input');
    cy.get('.fixed.inset-0.z-50 textarea').first().type('Due payment 1/2');
    cy.get('[data-cy="dues-save-payment"]').click();
    cy.wait(2000);

    // Second installment
    cy.contains(GUEST_A).closest('tr').find('[data-cy="dues-record-payment"]').click();
    cy.get('.fixed.inset-0.z-50 input[type="number"]').first().invoke('val', '250').trigger('input');
    cy.get('.fixed.inset-0.z-50 select').first().select('online');
    cy.get('.fixed.inset-0.z-50 textarea').first().type('Due payment 2/2');
    cy.get('[data-cy="dues-save-payment"]').click();
  });

  /* ── 12. Verify stats page ──────────────────────────────────────────── */
  it('12 — stats page shows data', () => {
    cy.visit('/stats');
    cy.get('[data-cy="stats-tab-summary"]', { timeout: 10000 }).click({ force: true });
    cy.wait(2000);
    cy.get('[data-cy="stats-card-sales-summary"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-cy="stats-card-hotel-balance"]').should('be.visible');
    cy.get('[data-cy="stats-card-profit-loss"]').should('be.visible');
  });

  /* ── 13. Create expenditure ─────────────────────────────────────────── */
  it('13 — create an expenditure', () => {
    cy.visit('/stats');
    cy.get('[data-cy="stats-tab-expenditure"]', { timeout: 10000 }).click({ force: true });
    cy.wait(1000);
    cy.get('[data-cy="stats-create-expenditure"]').click({ force: true });
    cy.get('[data-cy="stats-expenditure-form-amount"]', { timeout: 5000 }).clear().type('1500');
    cy.get('[data-cy="stats-expenditure-form-description"]').type('Smoke test expenditure');
    cy.get('[data-cy="stats-expenditure-form-category"]').select('Supplies');
    cy.get('[data-cy="stats-expenditure-form-date"]').invoke('val', new Date().toISOString().slice(0, 10));
    cy.get('[data-cy="stats-expenditure-form-submit"]').click();
    cy.get('[data-cy="stats-expenditure-table"]', { timeout: 10000 }).should('contain', 'Smoke test expenditure');
  });

  /* ── 14. Verify record book ─────────────────────────────────────────── */
  it('14 — record book shows expected data', () => {
    cy.visit('/recordbook');
    cy.get('[data-cy="recordbook-date"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="recordbook-refresh"]').click();
    cy.wait(2000);
    cy.get('[data-cy="recordbook-total-revenue"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="recordbook-net-profit"]').should('be.visible');
    cy.get('[data-cy="recordbook-total-orders"]').should('be.visible');
    cy.get('[data-cy="recordbook-total-checkouts"]').should('be.visible');
    cy.get('[data-cy="recordbook-allocated-rooms-section"]').should('be.visible');
    cy.get('[data-cy="recordbook-items-sold-section"]').should('be.visible');
    cy.get('[data-cy="recordbook-daily-checkouts-section"]').should('be.visible');
  });
});

// ============================================================================
//  STAFF — DESKTOP  (1200×800)
// ============================================================================
describe('Staff — Desktop', { viewportWidth: 1200, viewportHeight: 800 }, () => {
  /* ── 1. Login as staff ──────────────────────────────────────────────── */
  it('01 — login as staff', () => {
    cy.login(STAFF.email, STAFF.password);
    cy.url().should('include', '/dashboard');
  });

  /* ── 2. Create guest via UI ──────────────────────────────────────────── */
  it('02 — staff creates a guest via UI', () => {
    cy.visit('/guests');
    cy.get('[data-cy="guests-add-new"]').last().click();

    cy.get('[data-cy="guests-form-first-name"]', { timeout: 5000 }).type('Staff');
    cy.get('[data-cy="guests-form-last-name"]').type(STAFF_GUEST);
    cy.get('[data-cy="guests-form-phone"]').invoke('val', STAFF_PHONE).trigger('input');
    cy.get('[data-cy="guests-checkin"]').invoke('val', new Date(Date.now() + 6 * 60000).toISOString().slice(0, 16));

    cy.get('[data-cy="guests-rooms"]', { timeout: 15000 }).should('exist');
    cy.get('[data-cy="guests-rooms"]').first().click();
    cy.get('[data-cy="guests-form-submit"]').should('be.enabled').click();
    cy.contains(STAFF_GUEST, { timeout: 15000 }).should('exist');
  });

  /* ── 3. View kitchen ─────────────────────────────────────────────────── */
  it('03 — staff views kitchen page', () => {
    cy.visit('/kitchen');
    cy.get('[data-cy="kitchen-refresh"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="kitchen-tab-pending"]').should('be.visible');
    cy.get('[data-cy="kitchen-tab-preparing"]').should('be.visible');
    cy.get('[data-cy="kitchen-tab-ready"]').should('be.visible');
    cy.get('[data-cy="kitchen-tab-served"]').should('be.visible');
  });
});

// ============================================================================
//  ORG ADMIN — MOBILE  (375×667)
// ============================================================================
describe('Org Admin — Mobile', { viewportWidth: 375, viewportHeight: 667 }, () => {
  const tsM = Date.now();
  const GA = `MobGA_${tsM}`;
  const GB = `MobGB_${tsM}`;
  const PA = `91${tsM.toString().slice(-8)}`;
  const PB = `92${tsM.toString().slice(-8)}`;
  const RF = `MobRef_${tsM}`;
  let gAId = '';
  let gBId = '';
  let rA = '';
  let oId = '';
  let kn = '';

  function mApi(path, method = 'GET', body = null) {
    const opts = {
      method,
      url: `${API}${path}`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    };
    if (body) opts.body = body;
    return cy.request(opts);
  }

  it('01 — login', () => {
    cy.login(MGR.email, MGR.password);
    cy.url().should('include', '/dashboard');
  });

  it('02 — create referrer', () => {
    cy.visit('/referrers');
    cy.get('[data-cy="referrers-add-new"]', { timeout: 10000 }).click();
    cy.get('.fixed.inset-0.z-50 input[type="text"]').first().type(RF);
    cy.get('.fixed.inset-0.z-50 input[type="number"]').first().clear().type('300');
    cy.get('[data-cy="referrers-form-submit"]').click();
    cy.get('[data-cy="referrers-table"]', { timeout: 10000 }).should('contain', RF);
  });

  it('03 — create guest A via API (single room)', () => {
    mApi('/api/referrers').then((refRes) => {
      const refs = Array.isArray(refRes.body.data) ? refRes.body.data : [];
      const refId = refs.find((r) => r.fullName === RF)?._id || '';

      mApi('/api/rooms?limit=10').then((r) => {
        const rooms = Array.isArray(r.body.data) ? r.body.data : [];
        const room = rooms.find((rm) => !rm.isOccupied) || rooms[0];
        rA = room.roomNumber;

        mApi('/api/guests', 'POST', {
          firstName: GA,
          lastName: 'Test',
          phone: PA,
          email: `${GA}@test.com`,
          advancePaid: 500,
          rooms: [room.roomNumber],
          checkInDate: new Date(Date.now() + 60000).toISOString(),
          hotel: hotelId,
          referrer: refId || undefined,
        }).then((r2) => {
          expect(r2.status).to.be.oneOf([200, 201]);
          gAId = r2.body.data._id;

          cy.visit('/guests');
          cy.contains(GA, { timeout: 15000 }).should('exist');
        });
      });
    });
  });

  it('04 — create guest B via API (multi-room, room discount)', () => {
    mApi('/api/rooms?limit=10').then((r) => {
      const rooms = Array.isArray(r.body.data) ? r.body.data : [];
      const avail = rooms.filter((rm) => !rm.isOccupied);
      const rnums = avail.slice(0, 2).map((rm) => rm.roomNumber);

      mApi('/api/guests', 'POST', {
        firstName: GB,
        lastName: 'Test',
        phone: PB,
        email: `${GB}@test.com`,
        roomDiscount: 100,
        rooms: rnums,
        checkInDate: new Date(Date.now() + 60000).toISOString(),
        hotel: hotelId,
      }).then((r2) => {
        expect(r2.status).to.be.oneOf([200, 201]);
        gBId = r2.body.data._id;

        cy.visit('/guests');
        cy.contains(GB, { timeout: 15000 }).should('exist');
      });
    });
  });

  it('05 — create items + order, delete 1 item via API', () => {
    mApi('/api/categories').then((catRes) => {
      const cats = Array.isArray(catRes.body.data) ? catRes.body.data : [];
      const catId = cats.length ? cats[0]._id : undefined;

      // Create 3 test items
      mApi('/api/items', 'POST', {
        name: `MobItem_${tsM}_1`, price: 200, category: catId, isAvailable: true, hotel: hotelId, stock: 100,
      }).then((i1) => {
        mApi('/api/items', 'POST', {
          name: `MobItem_${tsM}_2`, price: 200, category: catId, isAvailable: true, hotel: hotelId, stock: 100,
        }).then((i2) => {
          mApi('/api/items', 'POST', {
            name: `MobItem_${tsM}_3`, price: 200, category: catId, isAvailable: true, hotel: hotelId, stock: 100,
          }).then((i3) => {
            const ids = [i1.body.data?._id || i1.body._id, i2.body.data?._id || i2.body._id, i3.body.data?._id || i3.body._id];

            mApi('/api/orders', 'POST', {
              roomNumber: rA,
              items: ids.map((id) => ({ itemId: id, quantity: 1 })),
            }).then((r2) => {
              expect(r2.status).to.be.oneOf([200, 201]);
              oId = r2.body.data._id;
              kn = r2.body.data.kotNumber;

              // Remove 1 item via API
              mApi(`/api/orders/${oId}`, 'GET').then((r3) => {
                const existing = r3.body.data?.items || r3.body.items || [];
                const reduced = existing.slice(0, 2).map((i) => ({
                  itemId: i.itemId || i._id, quantity: i.quantity,
                }));

                mApi(`/api/orders/${oId}`, 'PUT', { items: reduced }).then((r4) => {
                  expect(r4.status).to.be.oneOf([200, 201]);

                  mApi(`/api/orders/${oId}`).then((r5) => {
                    const final = r5.body.data?.items || r5.body.items || [];
                    expect(final.length).to.equal(2);

                    cy.visit('/orders');
                    cy.get('[data-cy="orders-table"]', { timeout: 15000 }).should('be.visible');
                    cy.contains(kn).should('exist');
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  it('06 — kitchen flow on mobile', () => {
    mApi(`/api/kot/send/${oId}`, 'POST');

    cy.visit('/kitchen');
    cy.get('[data-cy="kitchen-refresh"]', { timeout: 15000 }).click();
    cy.wait(2000);
    cy.get('[data-cy="kitchen-refresh"]').click();

    cy.get('[data-cy="kitchen-tab-pending"]').click();
    cy.get(`[data-cy="kitchen-start-preparing-${kn}"]`, { timeout: 15000 }).click();
    cy.get('[data-cy="kitchen-tab-preparing"]').click();

    cy.get(`[data-cy="kitchen-mark-ready-${kn}"]`, { timeout: 10000 }).click();
    cy.get('[data-cy="kitchen-tab-ready"]').click();

    cy.get(`[data-cy="kitchen-mark-served-${kn}"]`, { timeout: 10000 }).click();

    cy.wait(1000).then(() => {
      mApi(`/api/orders/${oId}`).then((r) => {
        expect(r.body.data?.kotStatus || r.body.kotStatus).to.equal('served');
      });
    });
  });

  it('07 — complete order & checkouts', () => {
    mApi(`/api/orders/${oId}/status`, 'PUT', { status: 'completed' });

    mApi('/api/checkouts').then((cr) => {
      const checkouts = Array.isArray(cr.body.data) ? cr.body.data : [];
      const co = checkouts.find((c) => {
        const gid = typeof c.guest === 'object' ? c.guest._id || c.guest : c.guest;
        return String(gid) === String(gAId);
      });
      expect(co).to.exist;

      // Partial payment
      const pay = Math.max(0, co.totalBill - 300);
      return mApi('/api/checkouts/payment', 'POST', {
        id: co._id,
        paymentAmount: pay,
        paymentMethod: 'cash',
        roomDiscount: 0,
        orderDiscount: 0,
        checkOutDate: new Date(Date.now() + 60000).toISOString(),
      });
    }).then(() => {
      // Full checkout guest B
      cy.visit('/checkouts');
      cy.get('[data-cy="checkouts-table"]', { timeout: 10000 }).should('be.visible');

      cy.contains(GB, { timeout: 10000 })
        .closest('tr')
        .find('[data-cy^="checkouts-edit-btn-"]')
        .click();

      cy.get('[data-cy="checkouts-edit-modal"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-cy="checkouts-edit-status"]').select('completed');
      cy.get('#paymentAmount').clear().type('99999');
      cy.get('[data-cy="checkouts-edit-save-btn"]').click();
      cy.get('[data-cy="checkouts-edit-modal"]', { timeout: 15000 }).should('not.exist');
    });
  });

  it('08 — pay due & verify stats', () => {
    cy.visit('/dues');
    cy.get('[data-cy="dues-search"]', { timeout: 10000 }).clear().type(PA);
    cy.wait(1500);

    cy.contains(GA).closest('tr').find('[data-cy="dues-record-payment"]').click();
    cy.get('.fixed.inset-0.z-50 input[type="number"]').first().invoke('val', '200').trigger('input');
    cy.get('.fixed.inset-0.z-50 textarea').first().type('Mobile due payment');
    cy.get('[data-cy="dues-save-payment"]').click();
    cy.wait(2000);

    // Verify stats
    cy.visit('/stats');
    cy.get('[data-cy="stats-tab-summary"]', { timeout: 10000 }).click({ force: true });
    cy.wait(2000);
    cy.get('[data-cy="stats-card-sales-summary"]', { timeout: 15000 }).should('be.visible');
  });

  it('09 — verify record book on mobile', () => {
    cy.visit('/recordbook');
    cy.get('[data-cy="recordbook-date"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="recordbook-refresh"]').click();
    cy.wait(2000);
    cy.get('[data-cy="recordbook-total-revenue"]', { timeout: 10000 }).should('be.visible');
  });
});

// ============================================================================
//  STAFF — MOBILE  (375×667)
// ============================================================================
describe('Staff — Mobile', { viewportWidth: 375, viewportHeight: 667 }, () => {
  const tsS = Date.now();
  const SG = `MobStaff_${tsS}`;
  const SP = `93${tsS.toString().slice(-8)}`;

  it('01 — staff logs in on mobile', () => {
    cy.login(STAFF.email, STAFF.password);
    cy.url().should('include', '/dashboard');
  });

  it('02 — staff creates guest on mobile', () => {
    cy.visit('/guests');
    cy.get('[data-cy="guests-add-new"]').last().click();

    cy.get('[data-cy="guests-form-first-name"]', { timeout: 5000 }).type('MobStaff');
    cy.get('[data-cy="guests-form-last-name"]').type(SG);
    cy.get('[data-cy="guests-form-phone"]').invoke('val', SP).trigger('input');
    cy.get('[data-cy="guests-checkin"]').invoke('val', new Date(Date.now() + 6 * 60000).toISOString().slice(0, 16));

    cy.get('[data-cy="guests-rooms"]', { timeout: 15000 }).first().click();
    cy.get('[data-cy="guests-form-submit"]').click();
    cy.contains(SG, { timeout: 15000 }).should('exist');
  });

  it('03 — staff views kitchen on mobile', () => {
    cy.visit('/kitchen');
    cy.get('[data-cy="kitchen-refresh"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="kitchen-tab-pending"]').should('be.visible');
  });
});
