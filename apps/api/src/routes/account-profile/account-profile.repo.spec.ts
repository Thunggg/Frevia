import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { AccountProfileRepository } from './account-profile.repo';
import { ClientDirectoryQuerySchema, RoleName } from '@shared/types';

describe('AccountProfileRepository', () => {
  it('reads client profiles without selecting unrelated User columns such as walletBalance', async () => {
    const prisma = {
      profile: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const repository = new AccountProfileRepository(
      prisma as unknown as PrismaService,
    );
    await repository.findClientProfile(370);
    const args = prisma.profile.findFirst.mock.calls[0][0];
    expect(args.where).toEqual({
      userId: 370,
      user: { deletedAt: null, isBanned: false },
    });
    expect(args.select.user).toEqual({
      select: {
        role: { select: { name: true } },
        userRoles: {
          where: { role: { deletedAt: null } },
          select: { role: { select: { name: true } } },
        },
      },
    });
    expect(args.select.clientProfile.select).toMatchObject({
      companyName: true,
      website: true,
    });
    expect(args.include).toBeUndefined();
  });

  it('limits client discovery to active client accounts and selects public profile fields', async () => {
    const prisma = {
      profile: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const repository = new AccountProfileRepository(
      prisma as unknown as PrismaService,
    );
    await repository.findClients({ search: 'Studio', page: 2, limit: 12 });
    const args = prisma.profile.findMany.mock.calls[0][0];
    expect(args.where.user).toEqual({
      deletedAt: null,
      isBanned: false,
      OR: [
        { role: { name: RoleName.CLIENT, deletedAt: null } },
        {
          userRoles: {
            some: {
              role: { name: RoleName.CLIENT, deletedAt: null },
            },
          },
        },
      ],
    });
    expect(args.where.OR).toEqual([
      { displayName: { contains: 'Studio', mode: 'insensitive' } },
      {
        clientProfile: {
          companyName: { contains: 'Studio', mode: 'insensitive' },
        },
      },
    ]);
    expect(args).toMatchObject({ skip: 12, take: 12 });
    expect(Object.keys(args.select).sort()).toEqual([
      'avatarUrl',
      'bio',
      'clientProfile',
      'displayName',
      'updatedAt',
      'userId',
    ]);
    expect(prisma.profile.count).toHaveBeenCalledWith({ where: args.where });
  });

  it('validates client search and pagination bounds', () => {
    expect(
      ClientDirectoryQuerySchema.parse({ search: '  Acme  ', page: '2' }),
    ).toEqual({ search: 'Acme', page: 2, limit: 12 });
    for (const input of [
      { page: 0 },
      { limit: 1000 },
      { search: 'x'.repeat(101) },
    ]) {
      expect(ClientDirectoryQuerySchema.safeParse(input).success).toBe(false);
    }
  });

  it('creates the follow and freelancer notification in one transaction', async () => {
    const follow = { clientId: 11, freelancerId: 22 };
    const transaction = {
      followFreelancer: {
        create: jest.fn().mockResolvedValue(follow),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 7 }),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (operation: (client: typeof transaction) => unknown) =>
          Promise.resolve(operation(transaction)),
      ),
    };
    const repository = new AccountProfileRepository(
      prisma as unknown as PrismaService,
    );

    await expect(
      repository.createFollowWithNotification(11, 22, 'Northstar Studio'),
    ).resolves.toEqual(follow);

    expect(transaction.followFreelancer.create).toHaveBeenCalledWith({
      data: { clientId: 11, freelancerId: 22 },
    });
    expect(transaction.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 22,
        type: NotificationType.NEW_FOLLOWER,
        title: 'You have a new follower',
        message: 'Northstar Studio started following you.',
        data: {
          href: '/clients/11',
          followerUserId: 11,
          followerName: 'Northstar Studio',
        },
      },
    });
  });
});
