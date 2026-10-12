export const ManageMilestoneSubmissionMessage = {
    MESSAGE_REQUIRED: 'Error.SubmissionChangeRequestMessageRequired',

    SUBMISSION_NOT_FOUND: 'Error.SubmissionNotFound',
    MILESTONE_NOT_FOUND: 'Error.SubmissionMilestoneNotFound',
    CONTRACT_NOT_FOUND: 'Error.SubmissionContractNotFound',

    FORBIDDEN: 'Error.SubmissionForbidden',

    MILESTONE_NOT_IN_PROGRESS: 'Error.SubmissionMilestoneNotInProgress',
    MILESTONE_NOT_FUNDED: 'Error.SubmissionMilestoneNotFunded',
    SUBMISSION_NOT_PENDING_REVIEW: 'Error.SubmissionNotPendingReview',

    FAILED_TO_SUBMIT: 'Error.FailedToSubmitMilestone',
    FAILED_TO_LOAD: 'Error.FailedToLoadSubmission',
    FAILED_TO_DELETE: 'Error.FailedToDeleteSubmission',
    FAILED_TO_REQUEST_CHANGES: 'Error.FailedToRequestChanges',
    FAILED_TO_APPROVE: 'Error.FailedToApproveMilestone',
} as const;
