import { NotFoundException } from '@nestjs/common';
import { PublicExpertsService } from './public-experts.service';

describe('PublicExpertsService', () => {
  const repository = {
    findPublicMany: jest.fn(),
    findPublicById: jest.fn(),
  };
  const service = new PublicExpertsService(repository as never);
  const expert = {
    id: 3,
    title: 'Security advisor',
    expertise: ['Application security'],
    yearsOfExperience: 12,
    education: ['Computer Science'],
    certifications: ['CISSP'],
    website: 'https://example.com',
    isActive: true,
    profile: {
      userId: 9,
      displayName: 'Alex Expert',
      avatarUrl: null,
      bio: 'Security specialist',
      profileCompletionPercent: 88,
    },
  };

  beforeEach(() => jest.clearAllMocks());

  it('maps active expert records and pagination', async () => {
    repository.findPublicMany.mockResolvedValue({
      experts: [expert],
      total: 13,
    });

    await expect(service.list({ page: 2, limit: 12 })).resolves.toMatchObject({
      experts: [
        {
          id: 3,
          userId: 9,
          displayName: 'Alex Expert',
          isActive: true,
        },
      ],
      pagination: { page: 2, limit: 12, total: 13, totalPages: 2 },
    });
  });

  it('returns a public expert detail', async () => {
    repository.findPublicById.mockResolvedValue(expert);

    await expect(service.detail(3)).resolves.toMatchObject({
      id: 3,
      userId: 9,
      expertise: ['Application security'],
    });
  });

  it('does not expose missing or inactive experts', async () => {
    repository.findPublicById.mockResolvedValue(null);

    await expect(service.detail(3)).rejects.toBeInstanceOf(NotFoundException);
  });
});
