import { RoleName } from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';
import { AuthRepository } from './auth.repo';

describe('AuthRepository joinRole', () => {
  const role = {
    id: 3,
    name: RoleName.FREELANCER,
    description: null,
    createdAt: new Date('2026-09-07T00:00:00.000Z'),
    deletedAt: null,
  };
  const transaction = {
    role: { findFirst: jest.fn() },
    userRole: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    profile: { upsert: jest.fn() },
    freelancerProfile: { upsert: jest.fn() },
    clientProfile: { upsert: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn(
      (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    ),
  };
  const repository = new AuthRepository(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    transaction.role.findFirst.mockResolvedValue(role);
    transaction.userRole.findUnique.mockResolvedValue(null);
    transaction.profile.upsert.mockResolvedValue({ id: 17 });
    transaction.freelancerProfile.upsert.mockResolvedValue({ id: 8 });
    transaction.clientProfile.upsert.mockResolvedValue({ id: 9 });
    transaction.userRole.updateMany.mockResolvedValue({ count: 1 });
    transaction.userRole.create.mockResolvedValue({
      userId: 10,
      roleId: role.id,
      isPrimary: true,
    });
  });

  it('creates the freelancer profile and makes the new role primary atomically', async () => {
    await expect(repository.joinRole(10, RoleName.FREELANCER)).resolves.toEqual(
      { status: 'joined', role },
    );

    expect(transaction.freelancerProfile.upsert).toHaveBeenCalledWith({
      where: { profileId: 17 },
      create: { profileId: 17 },
      update: {},
    });
    expect(transaction.clientProfile.upsert).not.toHaveBeenCalled();
    expect(transaction.userRole.updateMany).toHaveBeenCalledWith({
      where: { userId: 10, isPrimary: true },
      data: { isPrimary: false },
    });
    expect(transaction.userRole.create).toHaveBeenCalledWith({
      data: { userId: 10, roleId: role.id, isPrimary: true },
    });
  });

  it('creates the client profile when joining as a client', async () => {
    const clientRole = { ...role, name: RoleName.CLIENT };
    transaction.role.findFirst.mockResolvedValue(clientRole);

    await expect(repository.joinRole(10, RoleName.CLIENT)).resolves.toEqual({
      status: 'joined',
      role: clientRole,
    });

    expect(transaction.clientProfile.upsert).toHaveBeenCalledWith({
      where: { profileId: 17 },
      create: { profileId: 17 },
      update: {},
    });
    expect(transaction.freelancerProfile.upsert).not.toHaveBeenCalled();
  });

  it('does not change the primary role when the assignment already exists', async () => {
    transaction.userRole.findUnique.mockResolvedValue({
      userId: 10,
      roleId: role.id,
      isPrimary: false,
    });

    await expect(repository.joinRole(10, RoleName.FREELANCER)).resolves.toEqual(
      { status: 'already-assigned', role },
    );

    expect(transaction.profile.upsert).not.toHaveBeenCalled();
    expect(transaction.userRole.updateMany).not.toHaveBeenCalled();
    expect(transaction.userRole.create).not.toHaveBeenCalled();
  });
});
