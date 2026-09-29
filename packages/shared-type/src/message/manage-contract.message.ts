export const ManageContractMessage = {
  JOB_ID_REQUIRED: 'Error.ContractJobIdRequired',
  CLIENT_ID_REQUIRED: 'Error.ContractClientIdRequired',
  FREELANCER_ID_REQUIRED: 'Error.ContractFreelancerIdRequired',
  TOTAL_AMOUNT_REQUIRED: 'Error.ContractTotalAmountRequired',
  TOTAL_AMOUNT_POSITIVE: 'Error.ContractTotalAmountMustBePositive',
  DEPOSIT_PERCENT_RANGE: 'Error.ContractDepositPercentRange',
  EXPIRES_AT_FUTURE: 'Error.ContractExpiresAtMustBeFuture',

  CONTRACT_NOT_FOUND: 'Error.ContractNotFound',
  CONTRACT_ALREADY_EXISTS_FOR_JOB: 'Error.ContractAlreadyExistsForJob',
  JOB_NOT_FOUND: 'Error.ContractJobNotFound',
  CLIENT_NOT_FOUND: 'Error.ContractClientNotFound',
  FREELANCER_NOT_FOUND: 'Error.ContractFreelancerNotFound',
  FORBIDDEN: 'Error.ContractForbidden',

  CONTRACT_NOT_IN_PENDING_SIGN: 'Error.ContractNotInPendingSign',
  TERMS_LOCKED_AFTER_BOTH_SIGNED: 'Error.ContractTermsLockedAfterBothSigned',
  CONTRACT_NOT_ACTIVE: 'Error.ContractNotActive',
  ALREADY_SIGNED: 'Error.ContractAlreadySigned',

  FAILED_TO_CREATE_CONTRACT: 'Error.FailedToCreateContract',
  FAILED_TO_UPDATE_CONTRACT: 'Error.FailedToUpdateContract',
} as const;
