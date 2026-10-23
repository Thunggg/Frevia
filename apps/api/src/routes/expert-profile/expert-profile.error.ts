import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ExpertProfileMessage } from '@shared/types';

export const ExpertProfileNotFoundException = () =>
  new NotFoundException(ExpertProfileMessage.NOT_FOUND);

export const NotAnExpertAccountException = () =>
  new ForbiddenException(ExpertProfileMessage.NOT_AN_EXPERT_ACCOUNT);

export const ExpertProfilePendingRevisionException = () =>
  new ConflictException(ExpertProfileMessage.PENDING_REVISION);

export const PublicExpertNotFoundException = () =>
  new NotFoundException(ExpertProfileMessage.PUBLIC_NOT_FOUND);
