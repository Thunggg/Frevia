import { Injectable } from '@nestjs/common';
import { ExpertConsultationStatus } from '@prisma/client';
import {
  RoleName,
  type CompleteExpertConsultationType,
  type CreateExpertConsultationType,
  type ExpertConsultationListQueryType,
  type RejectExpertConsultationType,
} from '@shared/types';
import {
  ActiveExpertConsultationExistsException,
  ExpertConsultationForbiddenException,
  ExpertConsultationInvalidTransitionException,
  ExpertConsultationNotFoundException,
  ExpertConsultationSelfRequestException,
  ExpertNotAvailableException,
  InvalidConsultationRequesterRoleException,
} from './expert-consultation.error';
import { ExpertConsultationRepository } from './expert-consultation.repo';

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

@Injectable()
export class ExpertConsultationService {
  constructor(private readonly repository: ExpertConsultationRepository) {}

  private assertRequesterRole(roleName: string) {
    if (roleName !== RoleName.CLIENT && roleName !== RoleName.FREELANCER) {
      throw InvalidConsultationRequesterRoleException();
    }
    return roleName;
  }

  private assertExpertRole(roleName: string) {
    if (roleName !== RoleName.EXPERT) {
      throw ExpertConsultationForbiddenException();
    }
  }

  private pagination(query: ExpertConsultationListQueryType, total: number) {
    return {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async create(
    userId: number,
    roleName: string,
    input: CreateExpertConsultationType,
  ) {
    const requesterRole = this.assertRequesterRole(roleName);
    const expert = await this.repository.findAvailableExpert(input.expertId);
    if (!expert) throw ExpertNotAvailableException();
    if (expert.profile.userId === userId) {
      throw ExpertConsultationSelfRequestException();
    }
    if (await this.repository.findActiveBetween(userId, input.expertId)) {
      throw ActiveExpertConsultationExistsException();
    }
    try {
      return await this.repository.create(
        userId,
        requesterRole,
        input,
        expert.profile.userId,
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw ActiveExpertConsultationExistsException();
      }
      throw error;
    }
  }

  async listMine(
    userId: number,
    roleName: string,
    query: ExpertConsultationListQueryType,
  ) {
    this.assertRequesterRole(roleName);
    const result = await this.repository.findForRequester(userId, query);
    return {
      consultations: result.consultations,
      pagination: this.pagination(query, result.total),
    };
  }

  async listAssigned(
    userId: number,
    roleName: string,
    query: ExpertConsultationListQueryType,
  ) {
    this.assertExpertRole(roleName);
    const result = await this.repository.findForExpert(userId, query);
    return {
      consultations: result.consultations,
      pagination: this.pagination(query, result.total),
    };
  }

  async detail(userId: number, roleName: string, id: number) {
    const consultation = await this.repository.findById(id);
    if (!consultation) throw ExpertConsultationNotFoundException();
    const canViewAsRequester =
      (roleName === RoleName.CLIENT || roleName === RoleName.FREELANCER) &&
      consultation.requesterId === userId;
    const canViewAsExpert =
      roleName === RoleName.EXPERT &&
      consultation.expert.profile.userId === userId;
    if (!canViewAsRequester && !canViewAsExpert) {
      throw ExpertConsultationForbiddenException();
    }
    return consultation;
  }

  private async assignedToExpert(userId: number, roleName: string, id: number) {
    this.assertExpertRole(roleName);
    const consultation = await this.repository.findById(id);
    if (!consultation) throw ExpertConsultationNotFoundException();
    if (consultation.expert.profile.userId !== userId) {
      throw ExpertConsultationForbiddenException();
    }
    return consultation;
  }

  async accept(userId: number, roleName: string, id: number) {
    const consultation = await this.assignedToExpert(userId, roleName, id);
    if (consultation.status !== ExpertConsultationStatus.PENDING) {
      throw ExpertConsultationInvalidTransitionException();
    }
    return this.repository.updateStatus(
      id,
      ExpertConsultationStatus.ACCEPTED,
      consultation.requesterId,
      { acceptedAt: new Date() },
    );
  }

  async reject(
    userId: number,
    roleName: string,
    id: number,
    input: RejectExpertConsultationType,
  ) {
    const consultation = await this.assignedToExpert(userId, roleName, id);
    if (consultation.status !== ExpertConsultationStatus.PENDING) {
      throw ExpertConsultationInvalidTransitionException();
    }
    return this.repository.updateStatus(
      id,
      ExpertConsultationStatus.REJECTED,
      consultation.requesterId,
      { rejectionReason: input.reason },
    );
  }

  async start(userId: number, roleName: string, id: number) {
    const consultation = await this.assignedToExpert(userId, roleName, id);
    if (consultation.status !== ExpertConsultationStatus.ACCEPTED) {
      throw ExpertConsultationInvalidTransitionException();
    }
    return this.repository.updateStatus(
      id,
      ExpertConsultationStatus.IN_PROGRESS,
      consultation.requesterId,
      { startedAt: new Date() },
    );
  }

  async complete(
    userId: number,
    roleName: string,
    id: number,
    input: CompleteExpertConsultationType,
  ) {
    const consultation = await this.assignedToExpert(userId, roleName, id);
    if (consultation.status !== ExpertConsultationStatus.IN_PROGRESS) {
      throw ExpertConsultationInvalidTransitionException();
    }
    return this.repository.updateStatus(
      id,
      ExpertConsultationStatus.COMPLETED,
      consultation.requesterId,
      { expertResponse: input.response, completedAt: new Date() },
    );
  }

  async cancel(userId: number, roleName: string, id: number) {
    this.assertRequesterRole(roleName);
    const consultation = await this.repository.findById(id);
    if (!consultation) throw ExpertConsultationNotFoundException();
    if (consultation.requesterId !== userId) {
      throw ExpertConsultationForbiddenException();
    }
    if (
      consultation.status !== ExpertConsultationStatus.PENDING &&
      consultation.status !== ExpertConsultationStatus.ACCEPTED
    ) {
      throw ExpertConsultationInvalidTransitionException();
    }
    return this.repository.cancel(id, consultation.expert.profile.userId);
  }
}
