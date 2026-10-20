import { Injectable, NotFoundException } from '@nestjs/common';
import type { PublicExpertQueryType } from '@shared/types';
import { ExpertProfileRepository } from './expert-profile.repo';

@Injectable()
export class PublicExpertsService {
  constructor(private readonly repository: ExpertProfileRepository) {}

  private toPublicExpert(
    expert: Awaited<
      ReturnType<ExpertProfileRepository['findPublicById']>
    > extends infer T
      ? NonNullable<T>
      : never,
  ) {
    return {
      id: expert.id,
      userId: expert.profile.userId,
      displayName: expert.profile.displayName,
      avatarUrl: expert.profile.avatarUrl,
      bio: expert.profile.bio,
      profileCompletionPercent: expert.profile.profileCompletionPercent,
      title: expert.title,
      expertise: expert.expertise,
      yearsOfExperience: expert.yearsOfExperience,
      education: expert.education,
      certifications: expert.certifications,
      website: expert.website,
      isActive: expert.isActive,
    };
  }

  async list(query: PublicExpertQueryType) {
    const result = await this.repository.findPublicMany(query);
    return {
      experts: result.experts.map((expert) => this.toPublicExpert(expert)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
      },
    };
  }

  async detail(id: number) {
    const expert = await this.repository.findPublicById(id);
    if (!expert) throw new NotFoundException('Expert not found.');
    return this.toPublicExpert(expert);
  }
}
