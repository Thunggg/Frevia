export const ManagePaymentMessage = {
  STRIPE_ACCOUNT_NOT_CONNECTED: 'Error.StripeAccountNotConnected',
  STRIPE_ONBOARDING_INCOMPLETE: 'Error.StripeOnboardingIncomplete',
  PAYMENT_INTENT_CREATION_FAILED: 'Error.PaymentIntentCreationFailed',
  TRANSFER_FAILED: 'Error.TransferFailed',
  REFUND_FAILED: 'Error.RefundFailed',

  PLATFORM_FEE_ALREADY_PAID: 'Error.PlatformFeeAlreadyPaid',
  CONTRACT_NOT_SIGNED: 'Error.ContractNotSigned',
  CONTRACT_NOT_ACTIVE: 'Error.ContractNotActiveForFunding',
  CONTRACT_NOT_AWAITING_PAYMENT: 'Error.ContractNotAwaitingPayment',
  CONTRACT_EXPIRED: 'Error.ContractExpired',
  HOLD_MILESTONE_REQUIRED: 'Error.HoldMilestoneRequired',
  HOLD_INTENT_CAPTURE_FAILED: 'Error.HoldIntentCaptureFailed',
  HOLD_INTENT_CANCEL_FAILED: 'Error.HoldIntentCancelFailed',

  MILESTONE_NOT_ELIGIBLE_FOR_FUNDING: 'Error.MilestoneNotEligibleForFunding',
  MILESTONE_NOT_FUNDED: 'Error.MilestoneNotFunded',
  MILESTONE_ALREADY_RELEASED: 'Error.MilestoneAlreadyReleased',

  DISPUTE_FEE_ALREADY_PAID: 'Error.DisputeFeeAlreadyPaid',
  DISPUTE_NOT_FOUND: 'Error.DisputeNotFound',
  DISPUTE_SETTLEMENT_INVALID_AMOUNT: 'Error.DisputeSettlementInvalidAmount',

  TRANSACTION_NOT_FOUND: 'Error.TransactionNotFound',
  WEBHOOK_SIGNATURE_INVALID: 'Error.WebhookSignatureInvalid',
  FORBIDDEN: 'Error.PaymentForbidden',

  INSUFFICIENT_WALLET_BALANCE: 'Error.InsufficientWalletBalance',
  INVALID_WITHDRAWAL_AMOUNT: 'Error.InvalidWithdrawalAmount',
  BANK_DETAILS_REQUIRED: 'Error.BankDetailsRequired',
  WITHDRAWAL_NOT_FOUND: 'Error.WithdrawalNotFound',
  WITHDRAWAL_ALREADY_PROCESSED: 'Error.WithdrawalAlreadyProcessed',
} as const;
