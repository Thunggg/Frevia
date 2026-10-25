import {
  ChargeSavedCardBodySchema,
  ChargeSavedCardResponseSchema,
  CreateCheckoutSessionResponseSchema,
  CreateCustomerPortalSessionResponseSchema,
  CreateOnboardingLinkBodySchema,
  GetSavedPaymentMethodsResponseSchema,
  GetTransactionListQuerySchema,
  GetTransactionListResponseSchema,
  RefundMilestoneResponseSchema,
  ReleaseMilestoneResponseSchema,
  StripeConnectStatusResponseSchema,
  StripeOnboardingLinkResponseSchema,
  SyncCheckoutSessionResponseSchema,
  TransactionSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class GetSavedPaymentMethodsResponseDTO extends createZodDto(
  GetSavedPaymentMethodsResponseSchema,
) {}

export class CreateCustomerPortalSessionResponseDTO extends createZodDto(
  CreateCustomerPortalSessionResponseSchema,
) {}

export class ChargeSavedCardBodyDTO extends createZodDto(
  ChargeSavedCardBodySchema,
) {}

export class ChargeSavedCardResponseDTO extends createZodDto(
  ChargeSavedCardResponseSchema,
) {}

export class TransactionDTO extends createZodDto(TransactionSchema) {}

export class GetTransactionListQueryDTO extends createZodDto(
  GetTransactionListQuerySchema,
) {}

export class GetTransactionListResponseDTO extends createZodDto(
  GetTransactionListResponseSchema,
) {}

export class CreateCheckoutSessionResponseDTO extends createZodDto(
  CreateCheckoutSessionResponseSchema,
) {}

export class SyncCheckoutSessionResponseDTO extends createZodDto(
  SyncCheckoutSessionResponseSchema,
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

export class ReleaseMilestoneResponseDTO extends createZodDto(
  ReleaseMilestoneResponseSchema,
) {}

export class RefundMilestoneResponseDTO extends createZodDto(
  RefundMilestoneResponseSchema,
) {}
