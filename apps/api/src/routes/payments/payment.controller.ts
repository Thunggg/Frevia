import {
  Body,
  Controller,
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
  CreateOnboardingLinkBodyDTO,
  CreatePaymentIntentResponseDTO,
  DisputeSettlementBodyDTO,
  DisputeSettlementResponseDTO,
  GetTransactionListQueryDTO,
  GetTransactionListResponseDTO,
  RefundMilestoneResponseDTO,
  ReleaseMilestoneResponseDTO,
  StripeConnectStatusResponseDTO,
  StripeOnboardingLinkResponseDTO,
} from './payment.dto';
import { PaymentService } from './payment.service';
import type {
  DisputeSettlementBodyType,
  GetTransactionListQueryType,
} from '@shared/types';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('connect/onboarding-link')
  @ZodSerializerDto(StripeOnboardingLinkResponseDTO)
  createOnboardingLink(
    @UserActive('userId') userId: number,
    @Body() body?: CreateOnboardingLinkBodyDTO,
  ) {
    return this.paymentService.getOnboardingLink(userId, body?.returnUrl);
  }

  @Get('connect/status')
  @ZodSerializerDto(StripeConnectStatusResponseDTO)
  getConnectStatus(@UserActive('userId') userId: number) {
    return this.paymentService.getConnectStatus(userId);
  }

  @Post('contracts/:contractId/platform-fee/intent')
  @ZodSerializerDto(CreatePaymentIntentResponseDTO)
  createPlatformFeeIntent(
    @UserActive('userId') userId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
  ) {
    return this.paymentService.createPlatformFeeIntent(userId, contractId);
  }

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

  @Post('contracts/:contractId/milestones/:milestoneId/refund')
  @ZodSerializerDto(RefundMilestoneResponseDTO)
  refundMilestone(
    @UserActive('userId') userId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
  ) {
    return this.paymentService.refundMilestone(userId, contractId, milestoneId);
  }

  @Post('disputes/:disputeId/fee/intent')
  @ZodSerializerDto(CreatePaymentIntentResponseDTO)
  createDisputeFeeIntent(
    @UserActive('userId') userId: number,
    @Param('disputeId', ParseIntPipe) disputeId: number,
  ) {
    return this.paymentService.createDisputeFeeIntent(userId, disputeId);
  }

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

  @Post('intents/:paymentIntentId/sync')
  syncPaymentIntent(
    @UserActive('userId') userId: number,
    @Param('paymentIntentId') paymentIntentId: string,
  ) {
    return this.paymentService.syncPaymentIntent(userId, paymentIntentId);
  }

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
