import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ManagePaymentMessage } from '@shared/types';

export const StripeAccountNotConnectedException = () =>
  new UnprocessableEntityException([
    {
      message: ManagePaymentMessage.STRIPE_ACCOUNT_NOT_CONNECTED,
      path: 'stripeAccountId',
    },
  ]);

export const StripeOnboardingIncompleteException = () =>
  new UnprocessableEntityException([
    {
      message: ManagePaymentMessage.STRIPE_ONBOARDING_INCOMPLETE,
      path: 'stripeAccountId',
    },
  ]);

export const PlatformFeeAlreadyPaidException = () =>
  new UnprocessableEntityException([
    {
      message: ManagePaymentMessage.PLATFORM_FEE_ALREADY_PAID,
      path: 'platformFeeStatus',
    },
  ]);

export const ContractNotActiveException = () =>
  new UnprocessableEntityException([
    {
      message: ManagePaymentMessage.CONTRACT_NOT_ACTIVE,
      path: 'contractId',
    },
  ]);

export const ContractNotAwaitingPaymentException = () =>
  new UnprocessableEntityException([
    {
      message: ManagePaymentMessage.CONTRACT_NOT_AWAITING_PAYMENT,
      path: 'contractId',
    },
  ]);

export const ContractExpiredException = () =>
  new UnprocessableEntityException([
    {
      message: ManagePaymentMessage.CONTRACT_EXPIRED,
      path: 'contractId',
    },
  ]);

export const HoldMilestoneRequiredException = () =>
  new BadRequestException([
    {
      message: ManagePaymentMessage.HOLD_MILESTONE_REQUIRED,
      path: 'milestoneIds',
    },
  ]);

export const HoldIntentCaptureFailedException = () =>
  new InternalServerErrorException([
    {
      message: ManagePaymentMessage.HOLD_INTENT_CAPTURE_FAILED,
      path: 'paymentIntentId',
    },
  ]);

export const HoldIntentCancelFailedException = () =>
  new InternalServerErrorException([
    {
      message: ManagePaymentMessage.HOLD_INTENT_CANCEL_FAILED,
      path: 'paymentIntentId',
    },
  ]);

export const ContractNotSignedException = () =>
  new UnprocessableEntityException([
    {
      message: ManagePaymentMessage.CONTRACT_NOT_SIGNED,
      path: 'status',
    },
  ]);

export const MilestoneNotEligibleForFundingException = () =>
  new UnprocessableEntityException([
    {
      message: ManagePaymentMessage.MILESTONE_NOT_ELIGIBLE_FOR_FUNDING,
      path: 'paymentStatus',
    },
  ]);

export const MilestoneNotFundedException = () =>
  new UnprocessableEntityException([
    {
      message: ManagePaymentMessage.MILESTONE_NOT_FUNDED,
      path: 'paymentStatus',
    },
  ]);

export const MilestoneAlreadyReleasedException = () =>
  new UnprocessableEntityException([
    {
      message: ManagePaymentMessage.MILESTONE_ALREADY_RELEASED,
      path: 'paymentStatus',
    },
  ]);

export const DisputeFeeAlreadyPaidException = () =>
  new UnprocessableEntityException([
    {
      message: ManagePaymentMessage.DISPUTE_FEE_ALREADY_PAID,
      path: 'status',
    },
  ]);

export const DisputeSettlementInvalidAmountException = () =>
  new BadRequestException([
    {
      message: ManagePaymentMessage.DISPUTE_SETTLEMENT_INVALID_AMOUNT,
      path: 'amounts',
    },
  ]);

export const TransactionNotFoundException = () =>
  new NotFoundException([
    {
      message: ManagePaymentMessage.TRANSACTION_NOT_FOUND,
      path: 'id',
    },
  ]);

export const WebhookSignatureInvalidException = () =>
  new BadRequestException([
    {
      message: ManagePaymentMessage.WEBHOOK_SIGNATURE_INVALID,
      path: 'signature',
    },
  ]);

export const PaymentForbiddenException = (message?: string) =>
  new ForbiddenException([
    {
      message: message ?? ManagePaymentMessage.FORBIDDEN,
      path: 'permission',
    },
  ]);

export const InsufficientWalletBalanceException = () =>
  new UnprocessableEntityException([
    {
      message: ManagePaymentMessage.INSUFFICIENT_WALLET_BALANCE,
      path: 'amount',
    },
  ]);

export const InvalidWithdrawalAmountException = () =>
  new BadRequestException([
    {
      message: ManagePaymentMessage.INVALID_WITHDRAWAL_AMOUNT,
      path: 'amount',
    },
  ]);

export const WithdrawalNotFoundException = () =>
  new NotFoundException([
    {
      message: ManagePaymentMessage.WITHDRAWAL_NOT_FOUND,
      path: 'withdrawalId',
    },
  ]);

export const WithdrawalAlreadyProcessedException = () =>
  new UnprocessableEntityException([
    {
      message: ManagePaymentMessage.WITHDRAWAL_ALREADY_PROCESSED,
      path: 'status',
    },
  ]);
