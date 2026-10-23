import {
  ExpertConsultationStatus,
  type ExpertConsultation,
} from '@prisma/client';
import {
  ExpertConsultationType,
  RoleName,
  type CreateExpertConsultationType,
} from '@shared/types';
import { ExpertConsultationRepository } from './expert-consultation.repo';
import { ExpertConsultationService } from './expert-consultation.service';

describe('ExpertConsultationService', () => {
  const repository = {
    findAvailableExpert: jest.fn(),
    findActiveBetween: jest.fn(),
    create: jest.fn(),
    findForRequester: jest.fn(),
    findForExpert: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
    cancel: jest.fn(),
  };

  const service = new ExpertConsultationService(
    repository as unknown as ExpertConsultationRepository,
  );
  const input: CreateExpertConsultationType = {
    expertId: 4,
    type: ExpertConsultationType.CAREER_GUIDANCE,
    title: 'Career direction review',
    description: 'Please review my current career direction and next steps.',
  };
  const assignedConsultation = (
    status: ExpertConsultation['status'],
    requesterId = 22,
  ) => ({
    id: 9,
    status,
    requesterId,
    expert: { profile: { userId: 40 } },
  });

  beforeEach(() => jest.clearAllMocks());

  it('creates a request for an active expert from a client', async () => {
    repository.findAvailableExpert.mockResolvedValue({
      id: 4,
      profile: { userId: 40, displayName: 'Expert One' },
    });
    repository.findActiveBetween.mockResolvedValue(null);
    repository.create.mockResolvedValue({ id: 9 });

    await expect(service.create(22, RoleName.CLIENT, input)).resolves.toEqual({
      id: 9,
    });
    expect(repository.create).toHaveBeenCalledWith(
      22,
      RoleName.CLIENT,
      input,
      40,
    );
  });

  it('does not allow an expert to create a consultation request', async () => {
    await expect(service.create(40, RoleName.EXPERT, input)).rejects.toThrow();
    expect(repository.findAvailableExpert).not.toHaveBeenCalled();
  });

  it('prevents duplicate active requests to the same expert', async () => {
    repository.findAvailableExpert.mockResolvedValue({
      id: 4,
      profile: { userId: 40, displayName: 'Expert One' },
    });
    repository.findActiveBetween.mockResolvedValue({ id: 7 });

    await expect(
      service.create(22, RoleName.FREELANCER, input),
    ).rejects.toThrow();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('maps a concurrent active-request conflict to a business exception', async () => {
    repository.findAvailableExpert.mockResolvedValue({
      id: 4,
      profile: { userId: 40, displayName: 'Expert One' },
    });
    repository.findActiveBetween.mockResolvedValue(null);
    repository.create.mockRejectedValue({ code: 'P2002' });

    await expect(service.create(22, RoleName.CLIENT, input)).rejects.toThrow();
  });

  it('enforces the accepted to in-progress transition order', async () => {
    repository.findById.mockResolvedValue(
      assignedConsultation(ExpertConsultationStatus.PENDING),
    );

    await expect(service.start(40, RoleName.EXPERT, 9)).rejects.toThrow();
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it('completes an in-progress consultation with the expert conclusion', async () => {
    repository.findById.mockResolvedValue(
      assignedConsultation(ExpertConsultationStatus.IN_PROGRESS),
    );
    repository.updateStatus.mockResolvedValue({
      id: 9,
      status: ExpertConsultationStatus.COMPLETED,
    });

    await service.complete(40, RoleName.EXPERT, 9, {
      response: 'A detailed expert conclusion for the requester.',
    });

    expect(repository.updateStatus).toHaveBeenCalledWith(
      9,
      ExpertConsultationStatus.COMPLETED,
      22,
      expect.objectContaining({
        expertResponse: 'A detailed expert conclusion for the requester.',
        completedAt: expect.any(Date),
      }),
    );
  });

  it('allows only the requester to cancel and notifies the assigned expert', async () => {
    repository.findById.mockResolvedValue(
      assignedConsultation(ExpertConsultationStatus.ACCEPTED),
    );
    repository.cancel.mockResolvedValue({
      id: 9,
      status: ExpertConsultationStatus.CANCELLED,
    });

    await service.cancel(22, RoleName.CLIENT, 9);

    expect(repository.cancel).toHaveBeenCalledWith(9, 40);
  });
});
