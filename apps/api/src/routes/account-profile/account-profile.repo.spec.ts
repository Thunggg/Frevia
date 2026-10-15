import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { AccountProfileRepository } from './account-profile.repo';

describe('AccountProfileRepository', () => {
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
        },
      },
    });
  });
});
