import { ProfileRevisionType, RevisionStatus } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { ProfileRevisionRepository } from './profile-revision.repo';

describe('Expert profile approval', () => {
  function setup() {
    const transaction = {
      profileRevision: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ profileId: 7, userId: 9 }),
        findUnique: jest.fn().mockResolvedValue({ id: 11 }),
      },
      profile: {
        update: jest.fn(),
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ displayName: 'Expert', expertProfile: {} }),
      },
      expert: { upsert: jest.fn() },
      notification: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    return {
      transaction,
      repository: new ProfileRevisionRepository(
        prisma as unknown as PrismaService,
      ),
    };
  }

  it('activates both new and existing expert records when approval is committed', async () => {
    const { transaction, repository } = setup();
    await repository.review(
      11,
      1,
      RevisionStatus.APPROVED,
      null,
      { displayName: 'Expert', title: 'Arbitrator' },
      ProfileRevisionType.EXPERT,
    );
    expect(transaction.expert.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { profileId: 7 },
        create: expect.objectContaining({ isActive: true }),
        update: expect.objectContaining({ isActive: true }),
      }),
    );
  });

  it('does not activate a rejected expert', async () => {
    const { transaction, repository } = setup();
    await repository.review(
      11,
      1,
      RevisionStatus.REJECTED,
      'Missing experience',
      { displayName: 'Expert', title: 'Arbitrator' },
      ProfileRevisionType.EXPERT,
    );
    expect(transaction.expert.upsert).not.toHaveBeenCalled();
  });
});

describe('Separate client and company edits', () => {
  it.each([
    [
      { displayName: 'New name', companyName: 'Published company' },
      ['displayName'],
      { displayName: 'New name', companyName: 'Pending company' },
    ],
    [
      { displayName: 'Published name', companyName: 'New company' },
      ['companyName'],
      { displayName: 'Pending name', companyName: 'New company' },
    ],
  ])(
    'preserves pending fields outside the submitted form',
    async (incoming, fields, expected) => {
      const transaction = {
        profileRevision: {
          findFirst: jest
            .fn()
            .mockResolvedValue({
              id: 1,
              proposedData: {
                displayName: 'Pending name',
                companyName: 'Pending company',
              },
            }),
          update: jest.fn().mockResolvedValue({ id: 1 }),
        },
      };
      const prisma = {
        $transaction: jest.fn((callback: (tx: typeof transaction) => unknown) =>
          callback(transaction),
        ),
      };
      const repository = new ProfileRevisionRepository(
        prisma as unknown as PrismaService,
      );
      await repository.submit(
        9,
        7,
        ProfileRevisionType.CLIENT,
        {},
        incoming,
        0,
        fields,
      );
      expect(transaction.profileRevision.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ proposedData: expected }),
        }),
      );
    },
  );
});
