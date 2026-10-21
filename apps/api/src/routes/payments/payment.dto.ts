import {
  CreateOnboardingLinkBodySchema,
  CreatePaymentIntentResponseSchema,
  DisputeSettlementBodySchema,
  DisputeSettlementResponseSchema,
  GetTransactionListQuerySchema,
  GetTransactionListResponseSchema,
  RefundMilestoneBodySchema,
  RefundMilestoneResponseSchema,
  ReleaseMilestoneResponseSchema,
  StripeConnectStatusResponseSchema,
  StripeOnboardingLinkResponseSchema,
  TransactionSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class TransactionDTO extends createZodDto(TransactionSchema) {}

export class GetTransactionListQueryDTO extends createZodDto(
  GetTransactionListQuerySchema,
) {}

export class GetTransactionListResponseDTO extends createZodDto(
  GetTransactionListResponseSchema,
) {}

export class CreatePaymentIntentResponseDTO extends createZodDto(
  CreatePaymentIntentResponseSchema,
) {}

export class CreateOnboardingLinkBodyDTO extends createZodDto(
  CreateOnboardingLinkBodySchema,
) {}

export class StripeOnboardingLinkResponseDTO extends createZodDto(
  StripeOnboardingLinkResponseSchema,
) {}

export class StripeConnectStatusResponseDTO extends createZodDto(
  StripeConnectStatusResponseSchema,
) {}

export class DisputeSettlementBodyDTO extends createZodDto(
  DisputeSettlementBodySchema,
) {}

export class DisputeSettlementResponseDTO extends createZodDto(
  DisputeSettlementResponseSchema,
) {}

export class RefundMilestoneBodyDTO extends createZodDto(
  RefundMilestoneBodySchema,
) {}

export class ReleaseMilestoneResponseDTO extends createZodDto(
  ReleaseMilestoneResponseSchema,
) {}

export class RefundMilestoneResponseDTO extends createZodDto(
  RefundMilestoneResponseSchema,
) {}
