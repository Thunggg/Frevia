import {
  ChargeSavedCardBodySchema,
  ChargeSavedCardResponseSchema,
  ContractHoldActionResponseSchema,
  CreateCheckoutSessionResponseSchema,
  CreateContractHoldBodySchema,
  CreateContractHoldResponseSchema,
  CreateCustomerPortalSessionResponseSchema,
  CreateOnboardingLinkBodySchema,
  CreatePaymentIntentResponseSchema,
  CreateSetupIntentResponseSchema,
  CreateWithdrawalBodySchema,
  CreateWithdrawalResponseSchema,
  DisputeSettlementBodySchema,
  DisputeSettlementResponseSchema,
  GetSavedPaymentMethodsResponseSchema,
  GetTransactionListQuerySchema,
  GetTransactionListResponseSchema,
  GetWithdrawalListQuerySchema,
  GetWithdrawalListResponseSchema,
  PaymentMethodActionResponseSchema,
  ProcessWithdrawalBodySchema,
  RefundMilestoneBodySchema,
  RefundMilestoneResponseSchema,
  ReleaseMilestoneResponseSchema,
  SetDefaultPaymentMethodBodySchema,
  StripeConnectStatusResponseSchema,
  StripeOnboardingLinkResponseSchema,
  SyncCheckoutSessionResponseSchema,
  TransactionSchema,
  WalletSummaryResponseSchema,
  WithdrawalRequestSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class GetSavedPaymentMethodsResponseDTO extends createZodDto(
  GetSavedPaymentMethodsResponseSchema,
) {}

export class CreateCustomerPortalSessionResponseDTO extends createZodDto(
  CreateCustomerPortalSessionResponseSchema,
) {}

export class CreateSetupIntentResponseDTO extends createZodDto(
  CreateSetupIntentResponseSchema,
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

export class CreatePaymentIntentResponseDTO extends createZodDto(
  CreatePaymentIntentResponseSchema,
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

export class RefundMilestoneBodyDTO extends createZodDto(
  RefundMilestoneBodySchema,
) {}

export class ReleaseMilestoneResponseDTO extends createZodDto(
  ReleaseMilestoneResponseSchema,
) {}

export class RefundMilestoneResponseDTO extends createZodDto(
  RefundMilestoneResponseSchema,
) {}

export class WalletSummaryResponseDTO extends createZodDto(
  WalletSummaryResponseSchema,
) {}

export class WithdrawalRequestDTO extends createZodDto(
  WithdrawalRequestSchema,
) {}

export class CreateWithdrawalBodyDTO extends createZodDto(
  CreateWithdrawalBodySchema,
) {}

export class CreateWithdrawalResponseDTO extends createZodDto(
  CreateWithdrawalResponseSchema,
) {}

export class GetWithdrawalListQueryDTO extends createZodDto(
  GetWithdrawalListQuerySchema,
) {}

export class GetWithdrawalListResponseDTO extends createZodDto(
  GetWithdrawalListResponseSchema,
) {}

export class ProcessWithdrawalBodyDTO extends createZodDto(
  ProcessWithdrawalBodySchema,
) {}
