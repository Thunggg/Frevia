import {
    ForbiddenException,
    InternalServerErrorException,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { ManageMilestoneSubmissionMessage } from '@shared/types';

export const SubmissionNotFoundException = () =>
    new NotFoundException([
        { message: ManageMilestoneSubmissionMessage.SUBMISSION_NOT_FOUND, path: 'id' },
    ]);

export const SubmissionMilestoneNotFoundException = () =>
    new NotFoundException([
        { message: ManageMilestoneSubmissionMessage.MILESTONE_NOT_FOUND, path: 'milestoneId' },
    ]);

export const SubmissionContractNotFoundException = () =>
    new NotFoundException([
        { message: ManageMilestoneSubmissionMessage.CONTRACT_NOT_FOUND, path: 'contractId' },
    ]);

export const SubmissionForbiddenException = () =>
    new ForbiddenException([
        { message: ManageMilestoneSubmissionMessage.FORBIDDEN, path: 'id' },
    ]);

export const MilestoneNotInProgressException = () =>
    new UnprocessableEntityException([
        { message: ManageMilestoneSubmissionMessage.MILESTONE_NOT_IN_PROGRESS, path: 'milestoneId' },
    ]);

export const MilestoneNotFundedException = () =>
    new UnprocessableEntityException([
        { message: ManageMilestoneSubmissionMessage.MILESTONE_NOT_FUNDED, path: 'milestoneId' },
    ]);

export const SubmissionNotPendingReviewException = () =>
    new UnprocessableEntityException([
        { message: ManageMilestoneSubmissionMessage.SUBMISSION_NOT_PENDING_REVIEW, path: 'id' },
    ]);

export const FailedToSubmitException = () =>
    new InternalServerErrorException([
        { message: ManageMilestoneSubmissionMessage.FAILED_TO_SUBMIT, path: '' },
    ]);

export const FailedToLoadSubmissionException = () =>
    new InternalServerErrorException([
        { message: ManageMilestoneSubmissionMessage.FAILED_TO_LOAD, path: '' },
    ]);

export const FailedToRequestChangesException = () =>
    new InternalServerErrorException([
        { message: ManageMilestoneSubmissionMessage.FAILED_TO_REQUEST_CHANGES, path: '' },
    ]);

export const FailedToApproveException = () =>
    new InternalServerErrorException([
        { message: ManageMilestoneSubmissionMessage.FAILED_TO_APPROVE, path: '' },
    ]);
