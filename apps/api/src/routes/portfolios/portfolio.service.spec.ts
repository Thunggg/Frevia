import { ForbiddenException } from '@nestjs/common';
import { RoleName } from '@shared/types';
import { PortfolioRepository } from './portfolio.repo';
import { PortfolioService } from './portfolio.service';

const freelancerProfile = (
  userId = 10,
  nestedProfileId: number | null = 20,
) => ({
  id: 5,
  userId,
  user: {
    userRoles: [{ role: { name: RoleName.FREELANCER } }],
  },
  freelancerProfile: nestedProfileId === null ? null : { id: nestedProfileId },
});

describe('PortfolioService', () => {
  const repository = {
    findFreelancerProfileById: jest.fn(),
    findPortfoliosByFreelancerProfileId: jest.fn(),
    addPortfolioToProfile: jest.fn(),
    findPortfolioById: jest.fn(),
    findPortfolioWithProfile: jest.fn(),
    updatePortfolio: jest.fn(),
    deletePortfolio: jest.fn(),
  };
  const service = new PortfolioService(
    repository as unknown as PortfolioRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns an empty list when the freelancer has no portfolio profile yet', async () => {
    repository.findFreelancerProfileById.mockResolvedValue(
      freelancerProfile(10, null),
    );

    await expect(service.getPortfolios(5)).resolves.toEqual([]);
    expect(
      repository.findPortfoliosByFreelancerProfileId,
    ).not.toHaveBeenCalled();
  });

  it('rejects updating another freelancer portfolio', async () => {
    repository.findPortfolioWithProfile.mockResolvedValue({
      freelancerProfile: { profile: { userId: 10 } },
    });

    await expect(
      service.updatePortfolio(7, 99, { title: 'Updated project' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.updatePortfolio).not.toHaveBeenCalled();
  });

  it('soft-deletes an owned portfolio through the repository', async () => {
    repository.findPortfolioWithProfile.mockResolvedValue({
      freelancerProfile: { profile: { userId: 10 } },
    });
    repository.deletePortfolio.mockResolvedValue({ id: 7 });

    await expect(service.deletePortfolio(7, 10)).resolves.toEqual({
      message: 'Portfolio deleted successfully.',
    });
    expect(repository.deletePortfolio).toHaveBeenCalledWith(7);
  });
});
