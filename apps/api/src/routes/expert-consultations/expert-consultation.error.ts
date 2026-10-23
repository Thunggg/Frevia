import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ExpertConsultationMessage } from '@shared/types';

const detail = (message: string, path: string) => [{ message, path }];

export const ExpertConsultationNotFoundException = () =>
  new NotFoundException(
    detail(ExpertConsultationMessage.NOT_FOUND, 'consultationId'),
  );

export const ExpertNotAvailableException = () =>
  new NotFoundException(
    detail(ExpertConsultationMessage.EXPERT_NOT_AVAILABLE, 'expertId'),
  );

export const InvalidConsultationRequesterRoleException = () =>
  new ForbiddenException(
    detail(ExpertConsultationMessage.INVALID_REQUESTER_ROLE, 'role'),
  );

export const ExpertConsultationSelfRequestException = () =>
  new UnprocessableEntityException(
    detail(ExpertConsultationMessage.SELF_REQUEST_NOT_ALLOWED, 'expertId'),
  );

export const ActiveExpertConsultationExistsException = () =>
  new ConflictException(
    detail(ExpertConsultationMessage.ACTIVE_REQUEST_EXISTS, 'expertId'),
  );

export const ExpertConsultationForbiddenException = () =>
  new ForbiddenException(
    detail(ExpertConsultationMessage.FORBIDDEN, 'consultationId'),
  );

export const ExpertConsultationInvalidTransitionException = () =>
  new UnprocessableEntityException(
    detail(ExpertConsultationMessage.INVALID_TRANSITION, 'status'),
  );
