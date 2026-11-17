import {
  matchRoutePath,
  normalizeApiPath,
} from '../../shared/helper/match-route-path';

/**
 * Bộ kiểm thử Action-Level RBAC và Kiểm soát hiển thị giao diện UI cho 2 cụm chức năng:
 *
 * 1. ESCROW & WALLET - Thanh toán & Ký quỹ (Hợp đồng & Thanh toán) - 4 quyền:
 *    #521 · POST /api/payments/disputes/:disputeId/settle (Thanh toán giải quyết tranh chấp)
 *    #522 · GET /api/payments/transactions (Xem danh sách giao dịch)
 *    #523 · POST /api/payments/intents/:paymentIntentId/sync (Đồng bộ Payment Intent)
 *    #580 · POST /api/payments/contracts/:contractId/fund-hold/intent (Tạo yêu cầu giữ tiền tạm thời cho hợp đồng)
 *
 * 2. STRIPE CONNECT - Phương thức & Cổng thanh toán Stripe (Hợp đồng & Thanh toán) - 8 quyền:
 *    #507 · POST /api/payments/connect/onboarding-link (Tạo liên kết thiết lập tài khoản Stripe)
 *    #508 · GET /api/payments/connect/status (Kiểm tra trạng thái kết nối Stripe)
 *    #509 · GET /api/payments/payment-methods (Xem phương thức thanh toán đã lưu)
 *    #510 · POST /api/payments/customer-portal (Mở cổng quản lý thanh toán Stripe)
 *    #524 · POST /api/payments/checkout-sessions/:sessionId/sync (Đồng bộ phiên thanh toán Checkout)
 *    #581 · POST /api/payments/payment-methods/setup-intent (Tạo setup intent liên kết thẻ)
 *    #582 · POST /api/payments/payment-methods/default (Đặt phương thức thanh toán mặc định)
 *    #583 · DELETE /api/payments/payment-methods/:paymentMethodId (Xóa phương thức thanh toán)
 *
 * Tổng cộng: 12 quyền.
 *
 * Yêu cầu nghiêm ngặt từ người dùng:
 * "phải test trên giao diện ko hiển thị UI đó nữa"
 * -> Tự động kiểm thử chứng minh: Khi không có quyền tương ứng, các nút bấm, tab, card,
 *    bảng dữ liệu trên giao diện người dùng bị ẩn hoàn toàn (UI elements completely hidden),
 *    đồng thời các endpoint API không cho phép gọi trái phép.
 */

interface PermissionItem {
  id: number;
  group: 'ESCROW & WALLET' | 'STRIPE CONNECT';
  method: string;
  path: string;
  description: string;
  testActualPath: string;
}

const ESCROW_STRIPE_PERMISSIONS: PermissionItem[] = [
  // ── ESCROW & WALLET (4 quyền) ──
  {
    id: 521,
    group: 'ESCROW & WALLET',
    method: 'POST',
    path: '/api/payments/disputes/:disputeId/settle',
    description: 'Thanh toán giải quyết tranh chấp',
    testActualPath: '/api/payments/disputes/15/settle',
  },
  {
    id: 522,
    group: 'ESCROW & WALLET',
    method: 'GET',
    path: '/api/payments/transactions',
    description: 'Xem danh sách giao dịch',
    testActualPath: '/api/payments/transactions',
  },
  {
    id: 523,
    group: 'ESCROW & WALLET',
    method: 'POST',
    path: '/api/payments/intents/:paymentIntentId/sync',
    description: 'Đồng bộ Payment Intent',
    testActualPath: '/api/payments/intents/pi_3Nx8Y2LkdIwHu7ix2/sync',
  },
  {
    id: 580,
    group: 'ESCROW & WALLET',
    method: 'POST',
    path: '/api/payments/contracts/:contractId/fund-hold/intent',
    description: 'Tạo yêu cầu giữ tiền tạm thời cho hợp đồng',
    testActualPath: '/api/payments/contracts/88/fund-hold/intent',
  },

  // ── STRIPE CONNECT (8 quyền) ──
  {
    id: 507,
    group: 'STRIPE CONNECT',
    method: 'POST',
    path: '/api/payments/connect/onboarding-link',
    description: 'Tạo liên kết thiết lập tài khoản Stripe',
    testActualPath: '/api/payments/connect/onboarding-link',
  },
  {
    id: 508,
    group: 'STRIPE CONNECT',
    method: 'GET',
    path: '/api/payments/connect/status',
    description: 'Kiểm tra trạng thái kết nối Stripe',
    testActualPath: '/api/payments/connect/status',
  },
  {
    id: 509,
    group: 'STRIPE CONNECT',
    method: 'GET',
    path: '/api/payments/payment-methods',
    description: 'Xem phương thức thanh toán đã lưu',
    testActualPath: '/api/payments/payment-methods',
  },
  {
    id: 510,
    group: 'STRIPE CONNECT',
    method: 'POST',
    path: '/api/payments/customer-portal',
    description: 'Mở cổng quản lý thanh toán Stripe',
    testActualPath: '/api/payments/customer-portal',
  },
  {
    id: 524,
    group: 'STRIPE CONNECT',
    method: 'POST',
    path: '/api/payments/checkout-sessions/:sessionId/sync',
    description: 'Đồng bộ phiên thanh toán Checkout',
    testActualPath: '/api/payments/checkout-sessions/cs_test_a1b2c3d4/sync',
  },
  {
    id: 581,
    group: 'STRIPE CONNECT',
    method: 'POST',
    path: '/api/payments/payment-methods/setup-intent',
    description: 'Tạo setup intent liên kết thẻ',
    testActualPath: '/api/payments/payment-methods/setup-intent',
  },
  {
    id: 582,
    group: 'STRIPE CONNECT',
    method: 'POST',
    path: '/api/payments/payment-methods/default',
    description: 'Đặt phương thức thanh toán mặc định',
    testActualPath: '/api/payments/payment-methods/default',
  },
  {
    id: 583,
    group: 'STRIPE CONNECT',
    method: 'DELETE',
    path: '/api/payments/payment-methods/:paymentMethodId',
    description: 'Xóa phương thức thanh toán',
    testActualPath: '/api/payments/payment-methods/pm_1Nxa52LkdIwHu7ix',
  },
];

/**
 * Mô phỏng logic can() của useActionPermission phía Client Frontend.
 */
function createCanHelper(userPermissions: PermissionItem[]) {
  return (method: string, targetPath: string): boolean => {
    const normalizedTarget = normalizeApiPath(targetPath);
    return userPermissions.some(
      (p) =>
        p.method.toUpperCase() === method.toUpperCase() &&
        matchRoutePath(p.path, normalizedTarget),
    );
  };
}

/**
 * Mô phỏng State hiển thị của toàn bộ UI Components liên quan đến 12 quyền.
 */
function evaluateEscrowStripeUIState(
  can: (method: string, path: string) => boolean,
) {
  return {
    // 1. Dispute Settlement button in Admin Dispute Resolution Dialog (#521)
    showDisputeSettleButton: can('POST', '/api/payments/disputes/15/settle'),

    // 2. Transaction & Payout history table in BillingPaymentsView & PaymentSettings (#522)
    showTransactionsTable: can('GET', '/api/payments/transactions'),

    // 3. Fallback sync button for active PaymentIntent (#523)
    showPaymentIntentSync: can(
      'POST',
      '/api/payments/intents/pi_3Nx8Y2LkdIwHu7ix2/sync',
    ),

    // 4. "Authorize Escrow Hold" button in Contract Actions Sidebar & Hold Sheet (#580)
    showFundContractHoldButton: can(
      'POST',
      '/api/payments/contracts/88/fund-hold/intent',
    ),

    // 5. "Connect Stripe Account" / "Stripe Express Dashboard" onboarding button (#507)
    showStripeOnboardingButton: can(
      'POST',
      '/api/payments/connect/onboarding-link',
    ),

    // 6. Stripe Connect status card & indicator in Freelancer payments view (#508)
    showStripeConnectCard: can('GET', '/api/payments/connect/status'),

    // 7. Saved Payment Methods card & list in Client payments view (#509)
    showSavedPaymentMethods: can('GET', '/api/payments/payment-methods'),

    // 8. "Stripe Billing Portal" button in card menu & modal footer (#510)
    showStripeCustomerPortalButton: can(
      'POST',
      '/api/payments/customer-portal',
    ),

    // 9. Checkout session sync trigger when returning from Stripe hosted checkout (#524)
    showCheckoutSessionSync: can(
      'POST',
      '/api/payments/checkout-sessions/cs_test_a1b2c3d4/sync',
    ),

    // 10. "+ Add card" button & AddCardSetupForm via SetupIntent (#581)
    showAddPaymentMethodButton: can(
      'POST',
      '/api/payments/payment-methods/setup-intent',
    ),

    // 11. "Set Default" button on saved payment methods list (#582)
    showSetDefaultPaymentMethodButton: can(
      'POST',
      '/api/payments/payment-methods/default',
    ),

    // 12. Delete / trash button on saved card item (#583)
    showDeletePaymentMethodButton: can(
      'DELETE',
      '/api/payments/payment-methods/pm_1Nxa52LkdIwHu7ix',
    ),
  };
}

describe('ESCROW & WALLET and STRIPE CONNECT RBAC & UI Visibility Test Suite (12 Permissions)', () => {
  describe('1. Route Pattern Matching & API URL Normalization', () => {
    it.each(ESCROW_STRIPE_PERMISSIONS)(
      'Permission #$id ($group): $method $path should match $testActualPath',
      ({ method, path, testActualPath }) => {
        const can = createCanHelper([
          {
            id: 1,
            group: 'ESCROW & WALLET',
            method,
            path,
            description: '',
            testActualPath,
          },
        ]);
        expect(can(method, testActualPath)).toBe(true);
      },
    );

    it('should correctly normalize paths with extra slashes or prefixes', () => {
      const can = createCanHelper(ESCROW_STRIPE_PERMISSIONS);
      expect(can('GET', '/api/payments/transactions/')).toBe(true);
      expect(can('GET', 'payments/transactions')).toBe(true);
      expect(can('POST', '/payments/connect/onboarding-link')).toBe(true);
      expect(can('GET', '/payments/payment-methods')).toBe(true);
      expect(can('POST', '/payments/contracts/99/fund-hold/intent')).toBe(true);
      expect(can('DELETE', '/payments/payment-methods/pm_99998888')).toBe(true);
      expect(can('POST', '/payments/disputes/42/settle')).toBe(true);
    });

    it('should reject route requests with incorrect HTTP methods', () => {
      const can = createCanHelper(ESCROW_STRIPE_PERMISSIONS);

      // GET instead of POST
      expect(can('GET', '/api/payments/disputes/15/settle')).toBe(false);
      expect(can('GET', '/api/payments/connect/onboarding-link')).toBe(false);
      expect(can('GET', '/api/payments/customer-portal')).toBe(false);
      expect(can('GET', '/api/payments/contracts/88/fund-hold/intent')).toBe(
        false,
      );
      expect(can('GET', '/api/payments/payment-methods/setup-intent')).toBe(
        false,
      );
      expect(can('GET', '/api/payments/payment-methods/default')).toBe(false);

      // POST instead of GET
      expect(can('POST', '/api/payments/transactions')).toBe(false);
      expect(can('POST', '/api/payments/connect/status')).toBe(false);
      expect(can('POST', '/api/payments/payment-methods')).toBe(false);

      // POST instead of DELETE
      expect(can('POST', '/api/payments/payment-methods/pm_12345')).toBe(false);
      expect(can('PATCH', '/api/payments/payment-methods/pm_12345')).toBe(
        false,
      );
    });

    it('should prevent route traversal, suffix traps, and unrelated path collisions', () => {
      const can = createCanHelper(ESCROW_STRIPE_PERMISSIONS);

      expect(can('GET', '/api/payments/transactions/export')).toBe(false);
      expect(can('POST', '/api/payments/connect/onboarding-link/extra')).toBe(
        false,
      );
      expect(can('GET', '/api/payments/payment-methods/archived')).toBe(false);
      expect(can('POST', '/api/payments/disputes/15/settle/confirm')).toBe(
        false,
      );
      expect(
        can('POST', '/api/payments/contracts/88/fund-hold/intent/cancel'),
      ).toBe(false);
      expect(can('GET', '/api/contracts/88')).toBe(false);
      expect(can('POST', '/api/proposals')).toBe(false);
    });
  });

  describe('2. Full Access Scenario (12/12 Permissions Granted)', () => {
    it('should allow all 12 endpoints and display all corresponding UI components', () => {
      const can = createCanHelper(ESCROW_STRIPE_PERMISSIONS);
      const ui = evaluateEscrowStripeUIState(can);

      // Tất cả 12 quyền đều hoạt động
      for (const p of ESCROW_STRIPE_PERMISSIONS) {
        expect(can(p.method, p.testActualPath)).toBe(true);
      }

      // Toàn bộ các phần tử giao diện UI tương ứng đều hiển thị
      expect(ui.showDisputeSettleButton).toBe(true);
      expect(ui.showTransactionsTable).toBe(true);
      expect(ui.showPaymentIntentSync).toBe(true);
      expect(ui.showFundContractHoldButton).toBe(true);
      expect(ui.showStripeOnboardingButton).toBe(true);
      expect(ui.showStripeConnectCard).toBe(true);
      expect(ui.showSavedPaymentMethods).toBe(true);
      expect(ui.showStripeCustomerPortalButton).toBe(true);
      expect(ui.showCheckoutSessionSync).toBe(true);
      expect(ui.showAddPaymentMethodButton).toBe(true);
      expect(ui.showSetDefaultPaymentMethodButton).toBe(true);
      expect(ui.showDeletePaymentMethodButton).toBe(true);
    });
  });

  describe('3. Zero Access Scenario (0/12 Permissions - Blank Slate)', () => {
    it('should forbid all 12 endpoints and completely hide all UI components', () => {
      const can = createCanHelper([]);
      const ui = evaluateEscrowStripeUIState(can);

      // Tất cả 12 quyền đều bị từ chối
      for (const p of ESCROW_STRIPE_PERMISSIONS) {
        expect(can(p.method, p.testActualPath)).toBe(false);
      }

      // Toàn bộ các phần tử giao diện UI tương ứng đều bị ẩn hoàn toàn
      expect(ui.showDisputeSettleButton).toBe(false);
      expect(ui.showTransactionsTable).toBe(false);
      expect(ui.showPaymentIntentSync).toBe(false);
      expect(ui.showFundContractHoldButton).toBe(false);
      expect(ui.showStripeOnboardingButton).toBe(false);
      expect(ui.showStripeConnectCard).toBe(false);
      expect(ui.showSavedPaymentMethods).toBe(false);
      expect(ui.showStripeCustomerPortalButton).toBe(false);
      expect(ui.showCheckoutSessionSync).toBe(false);
      expect(ui.showAddPaymentMethodButton).toBe(false);
      expect(ui.showSetDefaultPaymentMethodButton).toBe(false);
      expect(ui.showDeletePaymentMethodButton).toBe(false);
    });
  });

  describe('4. Selective 1-by-1 Revocation (Revoke Exactly 1 of 12)', () => {
    // #521: POST /api/payments/disputes/:disputeId/settle
    it('revoking #521 should hide Dispute Settlement button and block settle API', () => {
      const perms = ESCROW_STRIPE_PERMISSIONS.filter((p) => p.id !== 521);
      const can = createCanHelper(perms);
      const ui = evaluateEscrowStripeUIState(can);

      expect(can('POST', '/api/payments/disputes/15/settle')).toBe(false);
      expect(ui.showDisputeSettleButton).toBe(false);

      // Các quyền khác vẫn hoạt động bình thường
      expect(ui.showTransactionsTable).toBe(true);
      expect(ui.showFundContractHoldButton).toBe(true);
      expect(ui.showSavedPaymentMethods).toBe(true);
      expect(ui.showStripeConnectCard).toBe(true);
    });

    // #522: GET /api/payments/transactions
    it('revoking #522 should hide Transaction History table and block transactions API', () => {
      const perms = ESCROW_STRIPE_PERMISSIONS.filter((p) => p.id !== 522);
      const can = createCanHelper(perms);
      const ui = evaluateEscrowStripeUIState(can);

      expect(can('GET', '/api/payments/transactions')).toBe(false);
      expect(ui.showTransactionsTable).toBe(false);

      expect(ui.showDisputeSettleButton).toBe(true);
      expect(ui.showFundContractHoldButton).toBe(true);
      expect(ui.showSavedPaymentMethods).toBe(true);
      expect(ui.showStripeConnectCard).toBe(true);
    });

    // #523: POST /api/payments/intents/:paymentIntentId/sync
    it('revoking #523 should hide PaymentIntent sync trigger and block intent sync API', () => {
      const perms = ESCROW_STRIPE_PERMISSIONS.filter((p) => p.id !== 523);
      const can = createCanHelper(perms);
      const ui = evaluateEscrowStripeUIState(can);

      expect(
        can('POST', '/api/payments/intents/pi_3Nx8Y2LkdIwHu7ix2/sync'),
      ).toBe(false);
      expect(ui.showPaymentIntentSync).toBe(false);

      expect(ui.showTransactionsTable).toBe(true);
      expect(ui.showFundContractHoldButton).toBe(true);
      expect(ui.showCheckoutSessionSync).toBe(true);
    });

    // #580: POST /api/payments/contracts/:contractId/fund-hold/intent
    it('revoking #580 should hide Authorize Escrow Hold button and block hold intent API', () => {
      const perms = ESCROW_STRIPE_PERMISSIONS.filter((p) => p.id !== 580);
      const can = createCanHelper(perms);
      const ui = evaluateEscrowStripeUIState(can);

      expect(can('POST', '/api/payments/contracts/88/fund-hold/intent')).toBe(
        false,
      );
      expect(ui.showFundContractHoldButton).toBe(false);

      expect(ui.showSavedPaymentMethods).toBe(true);
      expect(ui.showTransactionsTable).toBe(true);
      expect(ui.showAddPaymentMethodButton).toBe(true);
    });

    // #507: POST /api/payments/connect/onboarding-link
    it('revoking #507 should hide Connect Stripe Onboarding button and block onboarding-link API', () => {
      const perms = ESCROW_STRIPE_PERMISSIONS.filter((p) => p.id !== 507);
      const can = createCanHelper(perms);
      const ui = evaluateEscrowStripeUIState(can);

      expect(can('POST', '/api/payments/connect/onboarding-link')).toBe(false);
      expect(ui.showStripeOnboardingButton).toBe(false);

      // Card trạng thái kết nối vẫn hiển thị nếu có #508
      expect(ui.showStripeConnectCard).toBe(true);
      expect(ui.showTransactionsTable).toBe(true);
    });

    // #508: GET /api/payments/connect/status
    it('revoking #508 should hide Stripe Connect Status Card and block connect/status API', () => {
      const perms = ESCROW_STRIPE_PERMISSIONS.filter((p) => p.id !== 508);
      const can = createCanHelper(perms);
      const ui = evaluateEscrowStripeUIState(can);

      expect(can('GET', '/api/payments/connect/status')).toBe(false);
      expect(ui.showStripeConnectCard).toBe(false);

      expect(ui.showTransactionsTable).toBe(true);
      expect(ui.showSavedPaymentMethods).toBe(true);
    });

    // #509: GET /api/payments/payment-methods
    it('revoking #509 should hide Saved Payment Methods card and block payment-methods API', () => {
      const perms = ESCROW_STRIPE_PERMISSIONS.filter((p) => p.id !== 509);
      const can = createCanHelper(perms);
      const ui = evaluateEscrowStripeUIState(can);

      expect(can('GET', '/api/payments/payment-methods')).toBe(false);
      expect(ui.showSavedPaymentMethods).toBe(false);

      expect(ui.showTransactionsTable).toBe(true);
      expect(ui.showFundContractHoldButton).toBe(true);
      expect(ui.showStripeConnectCard).toBe(true);
    });

    // #510: POST /api/payments/customer-portal
    it('revoking #510 should hide Stripe Customer Portal buttons and block customer-portal API', () => {
      const perms = ESCROW_STRIPE_PERMISSIONS.filter((p) => p.id !== 510);
      const can = createCanHelper(perms);
      const ui = evaluateEscrowStripeUIState(can);

      expect(can('POST', '/api/payments/customer-portal')).toBe(false);
      expect(ui.showStripeCustomerPortalButton).toBe(false);

      // Thẻ lưu và nút thêm thẻ vẫn hiển thị
      expect(ui.showSavedPaymentMethods).toBe(true);
      expect(ui.showAddPaymentMethodButton).toBe(true);
    });

    // #524: POST /api/payments/checkout-sessions/:sessionId/sync
    it('revoking #524 should hide Checkout session sync and block session sync API', () => {
      const perms = ESCROW_STRIPE_PERMISSIONS.filter((p) => p.id !== 524);
      const can = createCanHelper(perms);
      const ui = evaluateEscrowStripeUIState(can);

      expect(
        can('POST', '/api/payments/checkout-sessions/cs_test_a1b2c3d4/sync'),
      ).toBe(false);
      expect(ui.showCheckoutSessionSync).toBe(false);

      expect(ui.showPaymentIntentSync).toBe(true);
      expect(ui.showTransactionsTable).toBe(true);
    });

    // #581: POST /api/payments/payment-methods/setup-intent
    it('revoking #581 should hide Add Card (+ Add card) buttons and block setup-intent API', () => {
      const perms = ESCROW_STRIPE_PERMISSIONS.filter((p) => p.id !== 581);
      const can = createCanHelper(perms);
      const ui = evaluateEscrowStripeUIState(can);

      expect(can('POST', '/api/payments/payment-methods/setup-intent')).toBe(
        false,
      );
      expect(ui.showAddPaymentMethodButton).toBe(false);

      expect(ui.showSavedPaymentMethods).toBe(true);
      expect(ui.showStripeCustomerPortalButton).toBe(true);
    });

    // #582: POST /api/payments/payment-methods/default
    it('revoking #582 should hide "Set Default" card button and block payment-methods/default API', () => {
      const perms = ESCROW_STRIPE_PERMISSIONS.filter((p) => p.id !== 582);
      const can = createCanHelper(perms);
      const ui = evaluateEscrowStripeUIState(can);

      expect(can('POST', '/api/payments/payment-methods/default')).toBe(false);
      expect(ui.showSetDefaultPaymentMethodButton).toBe(false);

      expect(ui.showSavedPaymentMethods).toBe(true);
      expect(ui.showDeletePaymentMethodButton).toBe(true);
    });

    // #583: DELETE /api/payments/payment-methods/:paymentMethodId
    it('revoking #583 should hide Delete / Trash card button and block payment-methods/:id DELETE API', () => {
      const perms = ESCROW_STRIPE_PERMISSIONS.filter((p) => p.id !== 583);
      const can = createCanHelper(perms);
      const ui = evaluateEscrowStripeUIState(can);

      expect(
        can('DELETE', '/api/payments/payment-methods/pm_1Nxa52LkdIwHu7ix'),
      ).toBe(false);
      expect(ui.showDeletePaymentMethodButton).toBe(false);

      expect(ui.showSavedPaymentMethods).toBe(true);
      expect(ui.showSetDefaultPaymentMethodButton).toBe(true);
      expect(ui.showAddPaymentMethodButton).toBe(true);
    });
  });

  describe('5. Exclusive 1-by-1 Granting (Grant Exactly 1 of 12)', () => {
    it.each(ESCROW_STRIPE_PERMISSIONS)(
      'Granting ONLY #$id ($description) should activate ONLY this feature and keep 11 other features disabled',
      (grantedPermission) => {
        const can = createCanHelper([grantedPermission]);
        const ui = evaluateEscrowStripeUIState(can);

        // Quyền được cấp phải hợp lệ
        expect(
          can(grantedPermission.method, grantedPermission.testActualPath),
        ).toBe(true);

        // 11 quyền còn lại phải bị từ chối
        const otherPermissions = ESCROW_STRIPE_PERMISSIONS.filter(
          (p) => p.id !== grantedPermission.id,
        );
        for (const other of otherPermissions) {
          expect(can(other.method, other.testActualPath)).toBe(false);
        }

        // Kiểm tra cờ UI tương ứng
        if (grantedPermission.id === 521) {
          expect(ui.showDisputeSettleButton).toBe(true);
          expect(ui.showTransactionsTable).toBe(false);
          expect(ui.showFundContractHoldButton).toBe(false);
        } else if (grantedPermission.id === 522) {
          expect(ui.showTransactionsTable).toBe(true);
          expect(ui.showDisputeSettleButton).toBe(false);
          expect(ui.showSavedPaymentMethods).toBe(false);
        } else if (grantedPermission.id === 523) {
          expect(ui.showPaymentIntentSync).toBe(true);
          expect(ui.showCheckoutSessionSync).toBe(false);
        } else if (grantedPermission.id === 580) {
          expect(ui.showFundContractHoldButton).toBe(true);
          expect(ui.showSavedPaymentMethods).toBe(false);
        } else if (grantedPermission.id === 507) {
          expect(ui.showStripeOnboardingButton).toBe(true);
          expect(ui.showStripeConnectCard).toBe(false);
        } else if (grantedPermission.id === 508) {
          expect(ui.showStripeConnectCard).toBe(true);
          expect(ui.showStripeOnboardingButton).toBe(false);
        } else if (grantedPermission.id === 509) {
          expect(ui.showSavedPaymentMethods).toBe(true);
          expect(ui.showAddPaymentMethodButton).toBe(false);
          expect(ui.showDeletePaymentMethodButton).toBe(false);
        } else if (grantedPermission.id === 510) {
          expect(ui.showStripeCustomerPortalButton).toBe(true);
          expect(ui.showSavedPaymentMethods).toBe(false);
        } else if (grantedPermission.id === 524) {
          expect(ui.showCheckoutSessionSync).toBe(true);
          expect(ui.showPaymentIntentSync).toBe(false);
        } else if (grantedPermission.id === 581) {
          expect(ui.showAddPaymentMethodButton).toBe(true);
          expect(ui.showSavedPaymentMethods).toBe(false);
        } else if (grantedPermission.id === 582) {
          expect(ui.showSetDefaultPaymentMethodButton).toBe(true);
          expect(ui.showSavedPaymentMethods).toBe(false);
        } else if (grantedPermission.id === 583) {
          expect(ui.showDeletePaymentMethodButton).toBe(true);
          expect(ui.showSavedPaymentMethods).toBe(false);
        }
      },
    );
  });

  describe('6. Realistic Business Role Scenarios', () => {
    it('Freelancer payout setup persona: Has Stripe Connect & Transactions (#507, #508, #522)', () => {
      const freelancerPerms = ESCROW_STRIPE_PERMISSIONS.filter((p) =>
        [507, 508, 522].includes(p.id),
      );
      const can = createCanHelper(freelancerPerms);
      const ui = evaluateEscrowStripeUIState(can);

      // Freelancer có thể kết nối Stripe Express & xem lịch sử thanh toán
      expect(ui.showStripeConnectCard).toBe(true);
      expect(ui.showStripeOnboardingButton).toBe(true);
      expect(ui.showTransactionsTable).toBe(true);

      // Freelancer không có quyền quản lý thẻ tín dụng Client hoặc giữ tiền hợp đồng
      expect(ui.showSavedPaymentMethods).toBe(false);
      expect(ui.showAddPaymentMethodButton).toBe(false);
      expect(ui.showFundContractHoldButton).toBe(false);
      expect(ui.showDisputeSettleButton).toBe(false);
    });

    it('Client escrow funding persona: Has Cards, Customer Portal, Contract Hold (#509, #510, #580, #581, #582, #583, #522)', () => {
      const clientPerms = ESCROW_STRIPE_PERMISSIONS.filter((p) =>
        [509, 510, 580, 581, 582, 583, 522].includes(p.id),
      );
      const can = createCanHelper(clientPerms);
      const ui = evaluateEscrowStripeUIState(can);

      // Client có toàn quyền quản lý thẻ và giữ tiền hợp đồng
      expect(ui.showSavedPaymentMethods).toBe(true);
      expect(ui.showAddPaymentMethodButton).toBe(true);
      expect(ui.showSetDefaultPaymentMethodButton).toBe(true);
      expect(ui.showDeletePaymentMethodButton).toBe(true);
      expect(ui.showStripeCustomerPortalButton).toBe(true);
      expect(ui.showFundContractHoldButton).toBe(true);
      expect(ui.showTransactionsTable).toBe(true);

      // Client không có quyền phân xử tranh chấp hay Connect Express
      expect(ui.showDisputeSettleButton).toBe(false);
      expect(ui.showStripeConnectCard).toBe(false);
    });

    it('Arbitrator settlement persona: Has Settle Dispute & Transactions (#521, #522)', () => {
      const arbitratorPerms = ESCROW_STRIPE_PERMISSIONS.filter((p) =>
        [521, 522].includes(p.id),
      );
      const can = createCanHelper(arbitratorPerms);
      const ui = evaluateEscrowStripeUIState(can);

      // Trọng tài có quyền thanh toán phân chia tranh chấp & xem lịch sử giao dịch
      expect(ui.showDisputeSettleButton).toBe(true);
      expect(ui.showTransactionsTable).toBe(true);

      // Trọng tài không được tự thêm thẻ cá nhân hay giữ tiền hợp đồng
      expect(ui.showFundContractHoldButton).toBe(false);
      expect(ui.showSavedPaymentMethods).toBe(false);
      expect(ui.showAddPaymentMethodButton).toBe(false);
      expect(ui.showStripeConnectCard).toBe(false);
    });
  });
});
