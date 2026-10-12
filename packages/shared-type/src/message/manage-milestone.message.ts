export const ManageMilestoneMessage = {
    TITLE_REQUIRED: 'Error.MilestoneTitleRequired',
    AMOUNT_REQUIRED: 'Error.MilestoneAmountRequired',
    AMOUNT_POSITIVE: 'Error.MilestoneAmountMustBePositive',
    DUE_DATE_FUTURE: 'Error.MilestoneDueDateMustBeFuture',

    MILESTONE_NOT_FOUND: 'Error.MilestoneNotFound',
    MILESTONE_NOT_FUNDED: 'Error.MilestoneNotFunded',
    CONTRACT_NOT_FOUND: 'Error.MilestoneContractNotFound',

    FORBIDDEN: 'Error.MilestoneForbidden',

    CONTRACT_NOT_ACTIVE: 'Error.MilestoneContractNotActive',
    MILESTONE_AMOUNT_EXCEEDS_CONTRACT: 'Error.MilestoneAmountExceedsContractTotalAmount',
    MILESTONE_CANNOT_BE_EDITED: 'Error.MilestoneCannotBeEdited',
    MILESTONE_CANNOT_BE_DELETED: 'Error.MilestoneCannotBeDeleted',

    FAILED_TO_CREATE_MILESTONE: 'Error.FailedToCreateMilestone',
    FAILED_TO_UPDATE_MILESTONE: 'Error.FailedToUpdateMilestone',
    FAILED_TO_LOAD_MILESTONE: 'Error.FailedToLoadMilestone',
    FAILED_TO_PROGRESS_MILESTONE: 'Error.FailedToProgressMilestone',
    FAILED_TO_DELETE_MILESTONE: 'Error.FailedToDeleteMilestone',
    MILESTONE_ALREADY_IN_PROGRESS: 'Error.MilestoneAlreadyInProgress',
} as const;
