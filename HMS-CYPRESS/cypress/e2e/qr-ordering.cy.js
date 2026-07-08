/// <reference types="cypress" />

/**
 * QR Code Ordering — E2E Tests
 *
 * Covers:
 *   ✓ QR code generation (manager role)
 *   ✓ Full order flow via QR (add items → phone verify → place order)
 *   ✓ Phone verification (positive match)
 *   ✓ Phone verification (wrong phone rejected)
 *   ✓ Geo-location positive (within hotel range)
 *   ✓ Geo-location negative (outside hotel range)
 *   ✓ Invalid/expired QR token
 *   ✓ Unoccupied room
 *   ✓ Mobile viewport
 */

const API = Cypress.env('apiUrl') || 'http://localhost:30005';
const MGR = { email: 'manager@momentum.com', password: 'Manager@123' };

const ts = Date.now();
const GUEST = `QRGuest_${ts}`;
const PHONE = `99${ts.toString().slice(-8)}`;

const HOTEL_GEO = { lat: 27.7172, lng: 85.3240 };
const FAR_GEO = { lat: 28.6139, lng: 77.2090 };

let token = '';
let hotelId = '';
let roomId = '';
let roomNumber = '';
let qrToken = '';
let itemId = '';

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

function enterPhoneAndOrder(phone) {
  cy.get('[data-cy="qr-phone-dialog"]', { timeout: 5000 }).should('be.visible');
  cy.get('[data-cy="qr-phone-input"]').clear().type(phone);
  cy.get('[data-cy="qr-phone-confirm"]').click();
}

before(() => {
  api('/api/auth/login', 'POST', { email: MGR.email, password: MGR.password }).then((r) => {
    token = r.body.token;
    hotelId = r.body.user.hotel;

    api('/api/admin/reset-test-data', 'POST', { confirm: 'RESET_MOMENTUM_DATA' }).then((resetRes) => {
      expect(resetRes.status).to.be.oneOf([200, 201]);

      api(`/api/hotels/${hotelId}`, 'PUT', {
        qrEnabled: true,
        geoEnabled: true,
        geoLocation: HOTEL_GEO,
        geoRadius: 100,
      }).then((hRes) => {
        expect(hRes.status).to.be.oneOf([200, 201]);
      });
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// ORG ADMIN — DESKTOP
// ────────────────────────────────────────────────────────────────────────────
describe('QR Ordering — Desktop', { viewportWidth: 1200, viewportHeight: 800 }, () => {

  it('01 — generate QR code for a room', () => {
    cy.login(MGR.email, MGR.password);

    api('/api/rooms?limit=20').then((r) => {
      const rooms = Array.isArray(r.body.data) ? r.body.data : [];
      const room = rooms.find((rm) => !rm.isOccupied && rm.rate > 100) || rooms[0];
      roomNumber = room.roomNumber;
      roomId = room._id;

      cy.visit('/rooms');
      cy.get(`[data-cy="rooms-qr-btn-${room._id}"]`, { timeout: 10000 }).click();
      cy.get('[data-cy="qr-modal-empty"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="qr-modal-generate"]').click();

      cy.get('[data-cy="qr-modal-existing"]', { timeout: 15000 }).should('be.visible');
      cy.get('[data-cy="qr-modal-image"]').should('be.visible');
    });
  });

  it('02 — create guest in the room', () => {
    api('/api/guests', 'POST', {
      firstName: GUEST,
      lastName: 'Test',
      phone: PHONE,
      email: `${GUEST}@test.com`,
      advancePaid: 0,
      rooms: [roomNumber],
      checkInDate: new Date(Date.now() + 60000).toISOString(),
      hotel: hotelId,
    }).then((r2) => {
      expect(r2.status).to.be.oneOf([200, 201]);

      api('/api/items?limit=5').then((iRes) => {
        const items = Array.isArray(iRes.body.data) ? iRes.body.data : [];
        expect(items.length).to.be.gte(1);
        itemId = items[0]._id;
      });
    });
  });

  it('03 — full order flow via QR (phone + geo within range)', () => {
    api(`/api/rooms/${roomNumber}/qr`).then((qrRes) => {
      qrToken = qrRes.body.qrToken;
      expect(qrToken).to.exist;

      cy.visit(`/order/qr/${roomId}/${qrToken}`, {
        onBeforeLoad(win) {
          cy.stub(win.navigator.geolocation, 'getCurrentPosition')
            .callsFake((success) => {
              success({ coords: { latitude: HOTEL_GEO.lat, longitude: HOTEL_GEO.lng, accuracy: 10 } });
            });
        },
      });

      cy.get('[data-cy="qr-order-page"]', { timeout: 15000 }).should('be.visible');
      cy.get('[data-cy="qr-order-loading"]').should('not.exist');
      cy.get('[data-cy="qr-order-error"]').should('not.exist');

      // Add an item to cart
      cy.get(`[data-cy="qr-item-add-${itemId}"]`, { timeout: 10000 }).click();
      cy.get(`[data-cy="qr-item-qty-${itemId}"]`).should('have.text', '1');

      // Place order — triggers phone dialog
      cy.get('[data-cy="qr-place-order-btn"]').click();

      // Enter phone and confirm
      enterPhoneAndOrder(PHONE);

      // Verify success
      cy.get('[data-cy="qr-order-success"]', { timeout: 15000 }).should('be.visible');
    });
  });

  it('04 — wrong phone number rejected', () => {
    api(`/api/rooms/${roomNumber}/qr`).then((qrRes) => {
      cy.visit(`/order/qr/${roomId}/${qrRes.body.qrToken}`, {
        onBeforeLoad(win) {
          cy.stub(win.navigator.geolocation, 'getCurrentPosition')
            .callsFake((success) => {
              success({ coords: { latitude: HOTEL_GEO.lat, longitude: HOTEL_GEO.lng, accuracy: 10 } });
            });
        },
      });

      cy.get('[data-cy="qr-order-page"]', { timeout: 15000 }).should('be.visible');

      // Add item
      cy.get(`[data-cy="qr-item-add-${itemId}"]`, { timeout: 10000 }).click();
      cy.get('[data-cy="qr-place-order-btn"]').click();

      // Enter WRONG phone
      cy.get('[data-cy="qr-phone-dialog"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy="qr-phone-input"]').clear().type('0000000000');
      cy.get('[data-cy="qr-phone-confirm"]').click();

      // Verify error
      cy.get('[data-cy="qr-order-error-banner"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-cy="qr-order-error-banner"]').should('contain.text', 'Phone number does not match');
    });
  });

  it('05 — geo-location negative (outside range)', () => {
    api('/api/rooms?limit=20').then((r) => {
      const rooms = Array.isArray(r.body.data) ? r.body.data : [];
      const freshRoom = rooms.find((rm) => !rm.isOccupied && rm.rate > 100 && rm.roomNumber !== roomNumber) || rooms[0];
      const g2Phone = `98${(ts + 1).toString().slice(-8)}`;

      api('/api/guests', 'POST', {
        firstName: `QRGuest2_${ts}`,
        lastName: 'Test',
        phone: g2Phone,
        email: `qrguest2_${ts}@test.com`,
        advancePaid: 0,
        rooms: [freshRoom.roomNumber],
        checkInDate: new Date(Date.now() + 120000).toISOString(),
        hotel: hotelId,
      }).then(() => {
        api(`/api/rooms/${freshRoom.roomNumber}/generate-qr`, 'POST', {}).then((qrRes) => {
          cy.visit(`/order/qr/${freshRoom._id}/${qrRes.body.token}`, {
            onBeforeLoad(win) {
              cy.stub(win.navigator.geolocation, 'getCurrentPosition')
                .callsFake((success) => {
                  success({ coords: { latitude: FAR_GEO.lat, longitude: FAR_GEO.lng, accuracy: 10 } });
                });
            },
          });

          cy.get('[data-cy="qr-order-page"]', { timeout: 15000 }).should('be.visible');
          cy.get(`[data-cy="qr-item-add-${itemId}"]`, { timeout: 10000 }).click();
          cy.get('[data-cy="qr-place-order-btn"]').click();

          // Enter valid phone
          enterPhoneAndOrder(g2Phone);

          // Verify geo error
          cy.get('[data-cy="qr-order-error-banner"]', { timeout: 10000 }).should('be.visible');
          cy.get('[data-cy="qr-order-error-banner"]').should('contain.text', 'm from the hotel');
        });
      });
    });
  });

  it('06 — invalid QR token shows error', () => {
    cy.visit(`/order/qr/${roomId}/invalidtoken123`, { failOnStatusCode: false });
    cy.get('[data-cy="qr-order-error"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="qr-order-error"]').should('contain.text', 'Invalid');
  });

  it('07 — unoccupied room shows notice', () => {
    api('/api/rooms?limit=20').then((r) => {
      const rooms = Array.isArray(r.body.data) ? r.body.data : [];
      const emptyRoom = rooms.find((rm) => !rm.isOccupied && rm.roomNumber !== roomNumber) || rooms[0];

      api(`/api/rooms/${emptyRoom.roomNumber}/generate-qr`, 'POST', {}).then((qrRes) => {
        cy.visit(`/order/qr/${emptyRoom._id}/${qrRes.body.token}`, {
          onBeforeLoad(win) {
            cy.stub(win.navigator.geolocation, 'getCurrentPosition')
              .callsFake((success) => {
                success({ coords: { latitude: HOTEL_GEO.lat, longitude: HOTEL_GEO.lng, accuracy: 10 } });
              });
          },
        });

        cy.get('[data-cy="qr-room-not-occupied"]', { timeout: 10000 }).should('be.visible');
      });
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// MOBILE VIEWPORT
// ────────────────────────────────────────────────────────────────────────────
describe('QR Ordering — Mobile', { viewportWidth: 375, viewportHeight: 667 }, () => {

  it('01 — full QR ordering flow on mobile', () => {
    cy.login(MGR.email, MGR.password);

    api('/api/rooms?limit=20').then((r) => {
      const rooms = Array.isArray(r.body.data) ? r.body.data : [];
      const mobRoom = rooms.find((rm) => !rm.isOccupied && rm.rate > 100) || rooms[0];
      const mobPhone = `97${(ts + 2).toString().slice(-8)}`;

      api('/api/guests', 'POST', {
        firstName: `QRMob_${ts}`,
        lastName: 'Test',
        phone: mobPhone,
        email: `qrmob_${ts}@test.com`,
        advancePaid: 0,
        rooms: [mobRoom.roomNumber],
        checkInDate: new Date(Date.now() + 180000).toISOString(),
        hotel: hotelId,
      }).then(() => {
        api(`/api/rooms/${mobRoom.roomNumber}/generate-qr`, 'POST', {}).then((qrRes) => {
          cy.visit(`/order/qr/${mobRoom._id}/${qrRes.body.token}`, {
            onBeforeLoad(win) {
              cy.stub(win.navigator.geolocation, 'getCurrentPosition')
                .callsFake((success) => {
                  success({ coords: { latitude: HOTEL_GEO.lat, longitude: HOTEL_GEO.lng, accuracy: 10 } });
                });
            },
          });

          cy.get('[data-cy="qr-order-page"]', { timeout: 15000 }).should('be.visible');
          cy.get('[data-cy="qr-category-nav"]', { timeout: 10000 }).should('be.visible');

          // Add items
          cy.get(`[data-cy="qr-item-add-${itemId}"]`, { timeout: 10000 }).click();
          cy.get('[data-cy="qr-cart-bar"]', { timeout: 5000 }).should('be.visible');

          // Expand cart
          cy.get('[data-cy="qr-cart-toggle"]').click();
          cy.get('[data-cy="qr-cart-items"]', { timeout: 5000 }).should('be.visible');

          // Place order
          cy.get('[data-cy="qr-place-order-btn"]').click();

          // Enter phone on mobile
          cy.get('[data-cy="qr-phone-dialog"]', { timeout: 5000 }).should('be.visible');
          cy.get('[data-cy="qr-phone-input"]').clear().type(mobPhone);
          cy.get('[data-cy="qr-phone-confirm"]').click();

          cy.get('[data-cy="qr-order-success"]', { timeout: 15000 }).should('be.visible');
        });
      });
    });
  });
});
