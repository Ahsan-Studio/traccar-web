/**
 * E2E Tests for Sub-account Functionality (V1 Parity)
 *
 * These tests verify:
 * 1. Sub-account can login with username
 * 2. Sub-account can login with email
 * 3. Sub-account cannot edit devices
 * 4. Sub-account cannot add devices
 * 5. Sub-account can view devices
 */

describe('Sub-account E2E Tests', () => {
  const TEST_USERNAME = 'testsubuser';
  const TEST_EMAIL = 'testsub@example.com';
  const TEST_PASSWORD = 'TestPassword123!';

  beforeEach(() => {
    // Login as admin first to    cy.login('admin', 'admin');
  });

  describe('Sub-account Login', () => {
    it('should login with username successfully', () => {
      // Create sub-account via API
      cy.request('POST', '/api/subaccounts').send({
        name: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        parentUserId: 1, // Admin user ID
        deviceReadonly: true,
        deviceAccess: '',
        markerAccess: '',
        routeAccess: '',
        zoneAccess: ''
      }).then((response) => {
        expect(response.status).to.eq(200);

        // Logout admin
        cy.request('DELETE', '/api/session');

        // Login with username
        cy.request('POST', '/api/session')
          .send(`login=${TEST_USERNAME}&password=${TEST_PASSWORD}`)
          .then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.name).to.eq(TEST_USERNAME);
          });
      });
    });

    it('should login with email successfully', () => {
      // Logout first
      cy.request('DELETE', '/api/session');

      // Login with email
      cy.request('POST', '/api/session')
        .send(`login=${TEST_EMAIL}&password=${TEST_PASSWORD}`)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.email).to.eq(TEST_EMAIL);
        });
    });
  });

  describe('Sub-account Edit Restrictions', () => {
    let subAccountId;

    beforeEach(() => {
      // Create sub-account
      cy.request('POST', '/api/subaccounts').send({
        name: 'restricted_user',
        email: 'restricted@test.com',
        password: TEST_PASSWORD,
        parentUserId: 1,
        deviceReadonly: true
      }).then((response) => {
        expect(response.status).to.eq(200);
        subAccountId = response.body.id;

        // Logout admin and cy.request('DELETE', '/api/session');

        // Login as sub-account
        cy.request('POST', '/api/session')
          .send(`login=restricted_user&password=${TEST_PASSWORD}`);
      });
    });

    afterEach(() => {
      // Cleanup - login as admin and delete sub-account
      cy.request('DELETE', '/api/session');
      cy.login('admin', 'admin');
      cy.request('DELETE', `/api/subaccounts/${subAccountId}`);
    });

    it('should not show Edit menu item for device', () => {
      // Click on device menu (three dots)
      cy.get('.device-row-menu').first().click();

      // Edit menu should not exist
      cy.get('.menu-item-edit').should('not.exist');
    });

    it('should not show Add device button', () => {
      // Add button should not be visible
      cy.get('.add-device-button').should('not.exist');
    });

    it('should not show Add marker button', () => {
      // Navigate to Places tab
      cy.get('[data-testid="places-tab"]').click();

      // Click on Markers sub-tab
      cy.contains('Markers').click();

      // Add marker button should not exist
      cy.get('.add-marker-button').should('not.exist');
    });

    it('should show device list (view access)', () => {
      // Device list should be visible
      cy.get('.device-list').should('be.visible');
    });
  });
});
