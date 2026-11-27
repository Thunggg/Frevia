import { PrismaService } from '../services/prisma.service';
import { SharedSessionRepository } from './shared-session.repo';

describe('SharedSessionRepository', () => {
  let repository: SharedSessionRepository;
  let prisma: PrismaService;
  let findFirstMock: jest.Mock;

  beforeEach(() => {
    findFirstMock = jest.fn();
    prisma = {
      session: {
        findFirst: findFirstMock,
      },
    } as unknown as PrismaService;

    repository = new SharedSessionRepository(prisma);
  });

  it('queries session by id and userId with user isBanned/deletedAt fields', async () => {
    const expected = { id: 10, user: { isBanned: false, deletedAt: null } };
    findFirstMock.mockResolvedValue(expected);

    const result = await repository.findByIdAndUserIdWithUser(10, 1);

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: 10, userId: 1 },
      select: {
        id: true,
        user: {
          select: {
            isBanned: true,
            deletedAt: true,
          },
        },
      },
    });
    expect(result).toBe(expected);
  });
});
