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

  FAILED_TO_CREATE_CONTRACT: 'Error.FailedToCreateContract',
  FAILED_TO_LOAD_CONTRACT: 'Error.FailedToLoadContract',
} as const;
