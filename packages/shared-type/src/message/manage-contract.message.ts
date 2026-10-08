export const ManageContractMessage = {
    PROPOSAL_ID_REQUIRED: 'Error.ContractProposalIdRequired',
    TOTAL_AMOUNT_REQUIRED: 'Error.ContractTotalAmountRequired',
    TOTAL_AMOUNT_POSITIVE: 'Error.ContractTotalAmountMustBePositive',
    EXPIRES_AT_FUTURE: 'Error.ContractExpiresAtMustBeFuture',

    PROPOSAL_NOT_FOUND: 'Error.ContractProposalNotFound',
    PROPOSAL_ALREADY_CONTRACTED: 'Error.ContractProposalAlreadyContracted',
    PROPOSAL_NOT_PENDING: 'Error.ContractProposalNotPending',
    CONTRACT_NOT_FOUND: 'Error.ContractNotFound',
    CONTRACT_ALREADY_EXISTS_FOR_JOB: 'Error.ContractAlreadyExistsForJob',
    JOB_NOT_FOUND: 'Error.ContractJobNotFound',
    FORBIDDEN: 'Error.ContractForbidden',

    CONTRACT_NOT_PENDING_SIGN: 'Error.ContractNotPendingSign',
    CONTRACT_NOT_ACTIVE: 'Error.ContractNotActive',
    CONTRACT_ALREADY_CANCELLED: 'Error.ContractAlreadyCancelled',
    CONTRACT_ALREADY_COMPLETED: 'Error.ContractAlreadyCompleted',
    CONTRACT_DISPUTED: 'Error.ContractDisputed',
    ALREADY_SIGNED: 'Error.ContractAlreadySigned',

    FAILED_TO_CREATE_CONTRACT: 'Error.FailedToCreateContract',
    FAILED_TO_LOAD_CONTRACT: 'Error.FailedToLoadContract',
    FAILED_TO_UPDATE_CONTRACT: 'Error.FailedToUpdateContract',
} as const;