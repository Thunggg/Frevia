import {
  ChargeSavedCardBodySchema,
  ChargeSavedCardResponseSchema,
  ContractHoldActionResponseSchema,
  CreateCheckoutSessionResponseSchema,
  CreateContractHoldBodySchema,
  CreateContractHoldResponseSchema,
  CreateMilestoneFundCheckoutSessionBodySchema,
  CreateOnboardingLinkBodySchema,
  DisputeSettlementBodySchema,
  DisputeSettlementResponseSchema,
  GetSavedPaymentMethodsResponseSchema,
  GetTransactionListQuerySchema,
  GetTransactionListResponseSchema,
  PaymentMethodActionResponseSchema,
  ReleaseMilestoneResponseSchema,
  SetDefaultPaymentMethodBodySchema,
  StripeConnectStatusResponseSchema,
  StripeOnboardingLinkResponseSchema,
  SyncCheckoutSessionResponseSchema,
  TransactionSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class GetSavedPaymentMethodsResponseDTO extends createZodDto(
  GetSavedPaymentMethodsResponseSchema,
) {}

export class SetDefaultPaymentMethodBodyDTO extends createZodDto(
  SetDefaultPaymentMethodBodySchema,
) {}

export class PaymentMethodActionResponseDTO extends createZodDto(
  PaymentMethodActionResponseSchema,
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

export class CreateContractHoldBodyDTO extends createZodDto(
  CreateContractHoldBodySchema,
) {}

export class CreateContractHoldResponseDTO extends createZodDto(
  CreateContractHoldResponseSchema,
) {}

export class ContractHoldActionResponseDTO extends createZodDto(
  ContractHoldActionResponseSchema,
) {}

export class CreateCheckoutSessionResponseDTO extends createZodDto(
  CreateCheckoutSessionResponseSchema,
) {}

export class CreateMilestoneFundCheckoutSessionBodyDTO extends createZodDto(
  CreateMilestoneFundCheckoutSessionBodySchema,
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

export class DisputeSettlementBodyDTO extends createZodDto(
  DisputeSettlementBodySchema,
) {}

export class DisputeSettlementResponseDTO extends createZodDto(
  DisputeSettlementResponseSchema,
) {}

export class ReleaseMilestoneResponseDTO extends createZodDto(
  ReleaseMilestoneResponseSchema,
) {}
