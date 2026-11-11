import { Prisma, ProfileRevisionType, RevisionStatus } from '@prisma/client';
import { ReviewMessage } from '@shared/types';
import { ExpertProfileService } from '../../src/routes/expert-profile/expert-profile.service';
import { ReviewService } from '../../src/routes/reviews/review.service';
import { ProfileRevisionRepository } from '../../src/routes/profile-revisions/profile-revision.repo';

describe('Nhuy current profile and review regressions', () => {
  describe('UF-180 getMine', () => {
    const expert = { id: 10, profile: { id: 5, displayName: 'Expert', avatarUrl: null, bio: 'Arbitrator', profileCompletionPercent: 88, expertProfile: { id: 3, title: 'Expert', isActive: true, expertise: ['AI'], yearsOfExperience: 2, education: [], certifications: [], website: null } }, userRoles: [{ role: { name: 'Expert' } }] };
    const repository = { findByUserId: jest.fn() };
    const service = new ExpertProfileService(repository as never, {} as never);
    beforeEach(() => { jest.resetAllMocks(); repository.findByUserId.mockResolvedValue(expert); });
    it('returns the active own expert profile', async () => {
      await expect(service.getMine(10)).resolves.toMatchObject({ id: 3, userId: 10, isActive: true, title: 'Expert', expertise: ['AI'] });
    });
    it('returns inactive defaults when the Expert subtype does not exist', async () => {
      repository.findByUserId.mockResolvedValue({ ...expert, profile: { ...expert.profile, expertProfile: null } });
      await expect(service.getMine(10)).resolves.toMatchObject({ id: 0, isActive: false, title: null, expertise: [], yearsOfExperience: null });
    });
    it('rejects an absent user with the exact not-found message', async () => {
      repository.findByUserId.mockResolvedValue(null);
      await expect(service.getMine(10)).rejects.toMatchObject({ status: 404, response: { message: 'Error.ExpertProfileNotFound' } });
    });
    it('rejects an absent profile with the exact not-found message', async () => {
      repository.findByUserId.mockResolvedValue({ ...expert, profile: null });
      await expect(service.getMine(10)).rejects.toMatchObject({ status: 404, response: { message: 'Error.ExpertProfileNotFound' } });
    });
    it('rejects a non-expert account with the exact forbidden message', async () => {
      repository.findByUserId.mockResolvedValue({ ...expert, userRoles: [{ role: { name: 'Client' } }] });
      await expect(service.getMine(10)).rejects.toMatchObject({ status: 403, response: { message: 'Error.NotAnExpertAccount' } });
    });
  });

  describe('UF-153 create', () => {
    const repository = { findContract: jest.fn(), findByContractAndReviewer: jest.fn(), create: jest.fn() };
    const service = new ReviewService(repository as never);
    beforeEach(() => {
      jest.resetAllMocks();
      repository.findContract.mockResolvedValue({ id: 20, clientId: 10, freelancerId: 30, status: 'COMPLETED', client: { profile: { displayName: 'Client' } }, freelancer: { profile: { displayName: 'Freelancer' } } });
      repository.findByContractAndReviewer.mockResolvedValue({ id: 11, deletedAt: new Date('2026-11-09T00:00:00Z') });
      repository.create.mockResolvedValue({ id: 11, overallRating: new Prisma.Decimal(5), deletedAt: null, response: { deletedAt: new Date('2026-11-09T00:00:00Z') } });
    });
    it('allows a new review after soft deletion and hides the old response', async () => {
      await expect(service.create(10, 20, { overallRating: 5 })).resolves.toMatchObject({ id: 11, overallRating: 5, deletedAt: null, response: null });
      expect(repository.create).toHaveBeenCalledWith(20, 10, 30, 'Client', { overallRating: 5 }, 11);
    });
    it('maps a concurrent restore conflict P2025 to ReviewAlreadyExists', async () => {
      repository.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Concurrent restore', { code: 'P2025', clientVersion: '7' }));
      await expect(service.create(10, 20, { overallRating: 5 })).rejects.toMatchObject({ status: 409, response: { message: [{ message: 'Error.ReviewAlreadyExists', path: 'contractId' }] } });
    });
    it('uses the contract-participant fallback when the reviewer name is empty', async () => {
      repository.findContract.mockResolvedValue({ id: 20, clientId: 10, freelancerId: 30, status: 'COMPLETED', client: { profile: { displayName: '  ' } }, freelancer: { profile: null } });
      await service.create(10, 20, { overallRating: 5 });
      expect(repository.create).toHaveBeenCalledWith(20, 10, 30, ReviewMessage.CONTRACT_PARTICIPANT, { overallRating: 5 }, 11);
    });
  });

  describe('UF-181 review', () => {
    const transaction = {
      profileRevision: { updateMany: jest.fn(), findUniqueOrThrow: jest.fn(), findUnique: jest.fn() },
      profile: { update: jest.fn(), findUniqueOrThrow: jest.fn() },
      expert: { upsert: jest.fn() },
      notification: { create: jest.fn() },
    };
    const prisma = { $transaction: jest.fn((callback: (tx: typeof transaction) => unknown) => callback(transaction)) };
    const repository = new ProfileRevisionRepository(prisma as never);
    const proposed = { displayName: 'Expert', title: 'Arbitrator' };
    beforeEach(() => {
      jest.clearAllMocks();
      prisma.$transaction.mockImplementation((callback: (tx: typeof transaction) => unknown) => callback(transaction));
      transaction.profileRevision.updateMany.mockResolvedValue({ count: 1 });
      transaction.profileRevision.findUniqueOrThrow.mockResolvedValue({ profileId: 5, userId: 10 });
      transaction.profileRevision.findUnique.mockResolvedValue({ id: 11, status: RevisionStatus.APPROVED });
      transaction.profile.findUniqueOrThrow.mockResolvedValue({ displayName: 'Expert', expertProfile: {} });
    });
    it('activates both new and existing Expert records in an approved revision transaction', async () => {
      await repository.review(11, 99, RevisionStatus.APPROVED, null, proposed, ProfileRevisionType.EXPERT);
      expect(transaction.expert.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ isActive: true }), update: expect.objectContaining({ isActive: true }) }));
      expect(transaction.notification.create).toHaveBeenCalledTimes(1);
    });
    it('keeps the live Expert unchanged when a revision is rejected', async () => {
      await repository.review(11, 99, RevisionStatus.REJECTED, 'Insufficient detail', proposed, ProfileRevisionType.EXPERT);
      expect(transaction.expert.upsert).not.toHaveBeenCalled();
      expect(transaction.notification.create).toHaveBeenCalledTimes(1);
    });
    it('returns null without writes when another reviewer already claimed the request', async () => {
      transaction.profileRevision.updateMany.mockResolvedValue({ count: 0 });
      await expect(repository.review(11, 99, RevisionStatus.APPROVED, null, proposed, ProfileRevisionType.EXPERT)).resolves.toBeNull();
      expect(transaction.expert.upsert).not.toHaveBeenCalled();
      expect(transaction.notification.create).not.toHaveBeenCalled();
    });
  });
});
