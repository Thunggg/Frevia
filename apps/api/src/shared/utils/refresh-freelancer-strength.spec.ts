import { Prisma } from '@prisma/client';
import { refreshFreelancerStrength } from './refresh-freelancer-strength';
import { AddPortfolioSchema } from '@shared/types';

describe('Freelancer profile strength and portfolio validation', () => {
  it.each([
    [0, 0, 43],
    [1, 1, 71],
  ])(
    'recalculates profile strength for %i skills and %i portfolios',
    async (skills, portfolioItems, expected) => {
      const transaction = {
        profile: {
          findUniqueOrThrow: jest.fn().mockResolvedValue({
            displayName: 'Name',
            bio: 'Biography',
            freelancerProfile: {
              title: 'Engineer',
              education: [],
              certifications: [],
              _count: { skills, portfolioItems },
            },
          }),
          update: jest.fn(),
        },
      };
      await refreshFreelancerStrength(
        transaction as unknown as Prisma.TransactionClient,
        12,
      );
      expect(transaction.profile.update).toHaveBeenCalledWith({
        where: { id: 12 },
        data: { profileCompletionPercent: expected },
      });
    },
  );

  it.each([
    'javascript:alert(1)',
    'data:text/html,test',
    'https://example.com/' + 'x'.repeat(500),
  ])('rejects unsafe or oversized portfolio links: %s', (projectUrl) =>
    expect(
      AddPortfolioSchema.safeParse({ title: 'Project', projectUrl }).success,
    ).toBe(false),
  );

  it('accepts an HTTPS project link', () => {
    expect(
      AddPortfolioSchema.safeParse({
        title: 'Project',
        projectUrl: 'https://example.com',
      }).success,
    ).toBe(true);
  });
});
