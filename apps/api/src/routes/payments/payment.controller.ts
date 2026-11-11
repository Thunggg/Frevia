import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ZodSerializerDto } from 'nestjs-zod';
import { IsPublic } from '../../shared/decorators/auth.decorator';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  ChargeSavedCardBodyDTO,
  ChargeSavedCardResponseDTO,
  CreateCheckoutSessionResponseDTO,
  CreateContractHoldBodyDTO,
  CreateContractHoldResponseDTO,
  CreateCustomerPortalSessionResponseDTO,
  CreateOnboardingLinkBodyDTO,
  CreatePaymentIntentResponseDTO,
  CreateSetupIntentResponseDTO,
  DisputeSettlementBodyDTO,
  DisputeSettlementResponseDTO,
  GetSavedPaymentMethodsResponseDTO,
  GetTransactionListQueryDTO,
  GetTransactionListResponseDTO,
  PaymentMethodActionResponseDTO,
  RefundMilestoneResponseDTO,
  ReleaseMilestoneResponseDTO,
  SetDefaultPaymentMethodBodyDTO,
  StripeConnectStatusResponseDTO,
  StripeOnboardingLinkResponseDTO,
  SyncCheckoutSessionResponseDTO,
} from './payment.dto';
import { PaymentService } from './payment.service';
import type {
  DisputeSettlementBodyType,
  GetTransactionListQueryType,
} from '@shared/types';

/**
 * Controller quản lý toàn bộ luồng thanh toán qua Stripe (`/api/payments`).
 *
 * Cơ chế chung:
 * - Global prefix `/api` kết hợp `@Controller('payments')` -> route gốc là `/api/payments`.
 * - Mặc định mọi endpoint đều đi qua `AuthGuard` và `PermissionGuard` toàn cục (trừ endpoint có `@IsPublic()`).
 * - `@UserActive('userId' | 'roleName')` lấy thông tin người dùng đã xác thực từ access token trong request.
 * - `MyZodValidationPipe` tự động validate `@Body()` / `@Query()` bằng Zod DTO.
 * - `@ZodSerializerDto(...)` chuẩn hóa và lọc dữ liệu trả về theo schema trước khi `ApiResponseInterceptor` đóng gói response.
 * - Controller chỉ tiếp nhận request/validate tham số (như `ParseIntPipe`) và ủy quyền toàn bộ nghiệp vụ cho `PaymentService`.
 */
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // =========================================================================
  // 1. STRIPE CONNECT & QUẢN LÝ PHƯƠNG THỨC THANH TOÁN (THẺ ĐÃ LƯU)
  // =========================================================================

  /**
   * Tạo link onboarding Stripe Connect Express để Freelancer / Arbitrator liên kết tài khoản nhận tiền.
   * Nếu user chưa có `stripeAccountId` (hoặc tài khoản cũ không tồn tại / sai quốc gia chưa nộp hồ sơ),
   * service sẽ tạo tài khoản Express mới và trả về `onboardingUrl` chuyển hướng về `returnUrl` (mặc định tab payments).
   */
  @Post('connect/onboarding-link')
  @ZodSerializerDto(StripeOnboardingLinkResponseDTO)
  createOnboardingLink(
    @UserActive('userId') userId: number,
    @Body() body?: CreateOnboardingLinkBodyDTO,
  ) {
    return this.paymentService.getOnboardingLink(userId, body?.returnUrl);
  }

  /**
   * Kiểm tra trạng thái liên kết Stripe Connect của user hiện tại.
   * Gọi Stripe lấy thông tin tài khoản Express (`payouts_enabled`, `charges_enabled`)
   * và đồng bộ lại cờ `stripeOnboardingCompleted` trong DB nếu có thay đổi.
   */
  @Get('connect/status')
  @ZodSerializerDto(StripeConnectStatusResponseDTO)
  getConnectStatus(@UserActive('userId') userId: number) {
    return this.paymentService.getConnectStatus(userId);
  }

  /**
   * Lấy danh sách thẻ thanh toán đã lưu trên Stripe Customer của user.
   * Dùng cho UI chọn thẻ thanh toán nhanh (saved-card) và đánh dấu thẻ mặc định theo `invoice_settings`.
   */
  @Get('payment-methods')
  @ZodSerializerDto(GetSavedPaymentMethodsResponseDTO)
  getSavedPaymentMethods(@UserActive('userId') userId: number) {
    return this.paymentService.getSavedPaymentMethods(userId);
  }

  /**
   * Tạo SetupIntent để người dùng thêm thẻ mới trực tiếp bằng Stripe Elements ngay trong trang Billing & Payments.
   */
  @Post('payment-methods/setup-intent')
  @ZodSerializerDto(CreateSetupIntentResponseDTO)
  createSetupIntent(@UserActive('userId') userId: number) {
    return this.paymentService.createSetupIntent(userId);
  }

  /**
   * Đặt thẻ đã lưu làm phương thức thanh toán mặc định cho khách hàng trên Stripe.
   */
  @Post('payment-methods/default')
  @ZodSerializerDto(PaymentMethodActionResponseDTO)
  setDefaultPaymentMethod(
    @UserActive('userId') userId: number,
    @Body() body: SetDefaultPaymentMethodBodyDTO,
  ) {
    return this.paymentService.setDefaultPaymentMethod(
      userId,
      body.paymentMethodId,
    );
  }

  /**
   * Xóa (detach) một thẻ thanh toán đã lưu khỏi Stripe Customer của người dùng.
   */
  @Delete('payment-methods/:paymentMethodId')
  @ZodSerializerDto(PaymentMethodActionResponseDTO)
  removePaymentMethod(
    @UserActive('userId') userId: number,
    @Param('paymentMethodId') paymentMethodId: string,
  ) {
    return this.paymentService.removePaymentMethod(userId, paymentMethodId);
  }

  /**
   * Tạo phiên Stripe Billing Customer Portal để user tự thêm, đặt mặc định hoặc xóa thẻ đã lưu.
   * Tự động tạo `stripeCustomerId` nếu user chưa từng phát sinh Customer trên Stripe.
   */
  @Post('customer-portal')
  @ZodSerializerDto(CreateCustomerPortalSessionResponseDTO)
  createCustomerPortalSession(
    @UserActive('userId') userId: number,
    @Body('returnUrl') returnUrl?: string,
  ) {
    return this.paymentService.getCustomerPortalLink(userId, returnUrl);
  }

  // =========================================================================
  // 2. THANH TOÁN PHÍ NỀN TẢNG HỢP ĐỒNG (PLATFORM FEE - 1%)
  // Chỉ áp dụng cho Client hoặc Freelancer của hợp đồng sau khi cả 2 bên đã ký.
  // =========================================================================

  /**
   * Bước 1 (Authorize / Hold): Tạo Stripe PaymentIntent với `capture_method: 'manual'`
   * khi Client bấm Fund hợp đồng. Cho phép Client chọn ít nhất 1 milestone (hoặc toàn bộ milestone)
   * cộng với 3% phí trên tổng giá trị hợp đồng (`totalAmount * 0.03`).
   *
   * - Stripe chỉ tạm giữ (freeze) hạn mức trên thẻ chứ chưa trừ tiền thật (`status = requires_capture`).
   * - Trả về `clientSecret` để Frontend mở khung nhập thẻ Stripe Elements.
   * - Lưu `holdPaymentIntentId` và `holdMilestoneIds` vào `Contract` cùng `Transaction` (`PENDING`) để
   *   Bước 2 (`captureContractHold` khi Freelancer ký) hoặc Bước 3 (`cancelContractHold` khi từ chối/quá hạn)
   *   xử lý khớp lệnh hoặc giải phóng giữ tiền.
   */
  @Post('contracts/:contractId/fund-hold/intent')
  @ZodSerializerDto(CreateContractHoldResponseDTO)
  createContractHoldIntent(
    @UserActive('userId') userId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Body() body: CreateContractHoldBodyDTO,
  ) {
    return this.paymentService.createContractHoldIntent(
      userId,
      contractId,
      body.milestoneIds,
      body.paymentMethodId,
    );
  }

  // =========================================================================
  // 3. KÝ QUỸ (ESCROW), GIẢI NGÂN & HOÀN TIỀN MILESTONE
  // =========================================================================

  /**
   * [Client] Tạo PaymentIntent để nạp tiền ký quỹ (Escrow) cho milestone ở trạng thái `PENDING`.
   * Tổng tiền thu = giá trị milestone + phí nền tảng phía Client (3% tổng hợp đồng nếu Client chưa thanh toán trước đó).
   */
  @Post('contracts/:contractId/milestones/:milestoneId/fund/intent')
  @ZodSerializerDto(CreatePaymentIntentResponseDTO)
  createMilestoneFundIntent(
    @UserActive('userId') userId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
  ) {
    return this.paymentService.createMilestoneFundIntent(
      userId,
      contractId,
      milestoneId,
    );
  }

  /**
   * [Client] Tạo Checkout Session trên Stripe để nạp tiền ký quỹ milestone (+ 3% phí Client nếu chưa đóng).
   * Khi thành công, webhook hoặc API sync sẽ chuyển milestone sang `FUNDED` và kích hoạt luồng escrow của hợp đồng.
   */
  @Post('contracts/:contractId/milestones/:milestoneId/fund/checkout-session')
  @ZodSerializerDto(CreateCheckoutSessionResponseDTO)
  createMilestoneFundCheckoutSession(
    @UserActive('userId') userId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
  ) {
    return this.paymentService.createMilestoneFundCheckoutSession(
      userId,
      contractId,
      milestoneId,
    );
  }

  /**
   * [Client] Nạp tiền ký quỹ milestone ngay bằng thẻ đã lưu (`chargeOffSession`).
   * Nếu trừ tiền thành công, cập nhật milestone thành `FUNDED`, ghi nhận giao dịch `ESCROW_DEPOSIT`
   * (và giao dịch `PLATFORM_FEE` riêng nếu lần nạp này gộp cả phí nền tảng của Client).
   */
  @Post('contracts/:contractId/milestones/:milestoneId/fund/saved-card')
  @ZodSerializerDto(ChargeSavedCardResponseDTO)
  chargeSavedCardForMilestoneFund(
    @UserActive('userId') userId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
    @Body() body?: ChargeSavedCardBodyDTO,
  ) {
    return this.paymentService.chargeSavedCardForMilestoneFund(
      userId,
      contractId,
      milestoneId,
      body?.paymentMethodId,
    );
  }

  /**
   * [Client] Giải ngân tiền ký quỹ của milestone (`FUNDED`) cho Freelancer sau khi nghiệm thu.
   * - Yêu cầu Freelancer đã kết nối và hoàn tất onboarding Stripe Express (`payouts_enabled`).
   * - Khấu trừ 5% phí nền tảng từ Freelancer, chuyển 95% còn lại qua Stripe Transfer tới `stripeAccountId`.
   * - Đánh dấu milestone `RELEASED` & `COMPLETED`, đồng thời ghi nhận giao dịch `MILESTONE_PAYOUT` và `PLATFORM_FEE`.
   */
  @Post('contracts/:contractId/milestones/:milestoneId/release')
  @ZodSerializerDto(ReleaseMilestoneResponseDTO)
  releaseMilestone(
    @UserActive('userId') userId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
  ) {
    return this.paymentService.releaseMilestone(
      userId,
      contractId,
      milestoneId,
    );
  }

  /**
   * [Client] Hoàn tiền ký quỹ của milestone đang ở trạng thái `FUNDED` về lại cho Client.
   * Tìm giao dịch `ESCROW_DEPOSIT` gốc để lấy `stripePaymentIntentId`, gọi Stripe Refund,
   * chuyển milestone sang `REFUNDED` và lưu giao dịch `REFUND`.
   */
  @Post('contracts/:contractId/milestones/:milestoneId/refund')
  @ZodSerializerDto(RefundMilestoneResponseDTO)
  refundMilestone(
    @UserActive('userId') userId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
  ) {
    return this.paymentService.refundMilestone(userId, contractId, milestoneId);
  }

  // =========================================================================
  // 4. PHÍ TRANH CHẤP & PHÂN CHIA THANH TOÁN KHI GIẢI QUYẾT DISPUTE
  // =========================================================================

  /**
   * [Admin / Arbitrator được phân công] Chốt phân bổ tiền sau phán quyết tranh chấp (`settleDispute`).
   * Cách hoạt động:
   * 1. Xác thực tổng `clientAmount + freelancerAmount` khớp giá trị milestone đang ký quỹ.
   * 2. Hoàn tiền phần `clientAmount` cho Client (Stripe Refund từ escrow gốc).
   * 3. Chuyển phần `freelancerAmount` cho Freelancer (Stripe Transfer).
   * 4. Chuyển dispute sang `FINALIZED` và milestone sang `RELEASED` / `COMPLETED`.
   */
  @Post('disputes/:disputeId/settle')
  @ZodSerializerDto(DisputeSettlementResponseDTO)
  settleDispute(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('disputeId', ParseIntPipe) disputeId: number,
    @Body() body: DisputeSettlementBodyDTO,
  ) {
    return this.paymentService.settleDispute(
      userId,
      roleName,
      disputeId,
      body as DisputeSettlementBodyType,
    );
  }

  // =========================================================================
  // 5. LỊCH SỬ GIAO DỊCH, ĐỒNG BỘ TRẠNG THÁI & STRIPE WEBHOOK
  // =========================================================================

  /**
   * Lấy danh sách lịch sử giao dịch có phân trang/lọc theo `GetTransactionListQueryDTO`.
   * Nếu caller là `ADMIN` sẽ xem được toàn bộ giao dịch; các role khác chỉ xem giao dịch của chính mình (`userId`).
   */
  @Get('transactions')
  @ZodSerializerDto(GetTransactionListResponseDTO)
  getTransactions(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Query() query: GetTransactionListQueryDTO,
  ) {
    return this.paymentService.getTransactions(
      userId,
      roleName,
      query as GetTransactionListQueryType,
    );
  }

  /**
   * Chủ động đồng bộ trạng thái 1 `PaymentIntent` trực tiếp từ Stripe về DB.
   * Dùng làm fallback ngay sau khi frontend xác nhận thẻ/3DS xong mà webhook chưa kịp gọi về.
   */
  @Post('intents/:paymentIntentId/sync')
  syncPaymentIntent(
    @UserActive('userId') userId: number,
    @Param('paymentIntentId') paymentIntentId: string,
  ) {
    return this.paymentService.syncPaymentIntent(userId, paymentIntentId);
  }

  /**
   * Chủ động đồng bộ trạng thái 1 `Checkout Session` từ Stripe về DB khi user quay lại `successUrl`.
   * Nếu `payment_status === 'paid'`, chạy cùng luồng xử lý hoàn tất như webhook (`PLATFORM_FEE` / `ESCROW_DEPOSIT` / `DISPUTE_FEE`).
   */
  @Post('checkout-sessions/:sessionId/sync')
  @ZodSerializerDto(SyncCheckoutSessionResponseDTO)
  syncCheckoutSession(
    @UserActive('userId') userId: number,
    @Param('sessionId') sessionId: string,
  ) {
    return this.paymentService.syncCheckoutSession(userId, sessionId);
  }

  /**
   * Endpoint nhận sự kiện bất đồng bộ từ Stripe Webhook (`/api/payments/webhook`).
   * - `@IsPublic()`: bỏ qua JWT `AuthGuard` vì request do máy chủ Stripe gửi trực tiếp, không kèm token user.
   * - Xác thực nguồn gốc bằng chữ ký HMAC trong header `stripe-signature` kết hợp `req.rawBody`
   *   (bắt buộc bật `rawBody: true` trong `main.ts` để giữ nguyên payload thô chưa parse JSON).
   * - Xử lý các sự kiện chính: `checkout.session.completed`, `payment_intent.succeeded`,
   *   `payment_intent.payment_failed`, và `account.updated` (cập nhật trạng thái Stripe Connect).
   */
  @IsPublic()
  @Post('webhook')
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    const payload = req.rawBody ?? JSON.stringify(req.body);
    return this.paymentService.handleWebhook(payload, signature);
  }
}
