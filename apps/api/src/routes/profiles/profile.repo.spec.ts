import { RoleName } from '@shared/types';
import { ProfileRepository } from './profile.repo';
import { PrismaService } from '../../shared/services/prisma.service';
import { PortfolioRepository } from '../portfolios/portfolio.repo';

describe('Freelancer profile database identifiers', () => {
  const database = {
    profile: { findFirst: jest.fn().mockResolvedValue(null) },
    freelancerProfile: { findUnique: jest.fn().mockResolvedValue(null) },
  };
  const profiles = new ProfileRepository(database as unknown as PrismaService);
  const portfolios = new PortfolioRepository(
    database as unknown as PrismaService,
  );
  beforeEach(() => jest.clearAllMocks());

  it('resolves freelancer profiles via explicit active role or UserRole ownership', async () => {
    await expect(profiles.findFreelancerProfileById(12)).resolves.toBeNull();
    expect(database.profile.findFirst).toHaveBeenCalledTimes(1);
    expect(database.profile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ id: 12 }, { userId: 12 }],
          user: {
            deletedAt: null,
            OR: [
              { role: { name: RoleName.FREELANCER } },
              {
                userRoles: {
                  some: {
                    role: { name: RoleName.FREELANCER, deletedAt: null },
                  },
                },
              },
            ],
          },
        },
      }),
    );
  });

  it('uses the same general profile identifier for portfolio ownership', async () => {
    await portfolios.findFreelancerProfileById(12);
    expect(database.profile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 12,
          user: {
            deletedAt: null,
            OR: [
              { role: { name: RoleName.FREELANCER } },
              {
                userRoles: {
                  some: {
                    role: { name: RoleName.FREELANCER, deletedAt: null },
                  },
                },
              },
            ],
          },
        },
      }),
    );
  });

  it('does not load another account skills when the freelancer profile is absent', async () => {
    await expect(profiles.findSkillsByProfileId(12)).resolves.toEqual([]);
    expect(database.freelancerProfile.findUnique).toHaveBeenCalledWith({
      where: { profileId: 12 },
    });
  });
});
