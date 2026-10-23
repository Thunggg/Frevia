export const ManagePaymentMessage = {
  STRIPE_ACCOUNT_NOT_CONNECTED: 'Error.StripeAccountNotConnected',
  STRIPE_ONBOARDING_INCOMPLETE: 'Error.StripeOnboardingIncomplete',
  PAYMENT_INTENT_CREATION_FAILED: 'Error.PaymentIntentCreationFailed',
  TRANSFER_FAILED: 'Error.TransferFailed',
  REFUND_FAILED: 'Error.RefundFailed',

  PLATFORM_FEE_ALREADY_PAID: 'Error.PlatformFeeAlreadyPaid',
  CONTRACT_NOT_SIGNED: 'Error.ContractNotSigned',

  MILESTONE_NOT_ELIGIBLE_FOR_FUNDING: 'Error.MilestoneNotEligibleForFunding',
  MILESTONE_NOT_FUNDED: 'Error.MilestoneNotFunded',
  MILESTONE_ALREADY_RELEASED: 'Error.MilestoneAlreadyReleased',

  DISPUTE_FEE_ALREADY_PAID: 'Error.DisputeFeeAlreadyPaid',
  DISPUTE_NOT_FOUND: 'Error.DisputeNotFound',
  DISPUTE_SETTLEMENT_INVALID_AMOUNT: 'Error.DisputeSettlementInvalidAmount',

  TRANSACTION_NOT_FOUND: 'Error.TransactionNotFound',
  WEBHOOK_SIGNATURE_INVALID: 'Error.WebhookSignatureInvalid',
  FORBIDDEN: 'Error.PaymentForbidden',
} as const;
