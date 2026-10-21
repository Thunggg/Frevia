import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  RoleName,
  type AdminUpdateExpertProfileType,
  type UpdateExpertProfileType,
} from '@shared/types';
import { calculateExpertProfileStrength } from '../../shared/utils/profile-strength';
import { ProfileRevisionService } from '../profile-revisions/profile-revision.service';
import { ExpertProfileRepository } from './expert-profile.repo';

@Injectable()
export class ExpertProfileService {
  constructor(
    private readonly repository: ExpertProfileRepository,
    private readonly revisions: ProfileRevisionService,
  ) {}

  private cleanList(values: string[]) {
    const unique = new Map<string, string>();
    for (const item of values) {
      const value = item.trim();
      const key = value.toLocaleLowerCase();
      if (value && !unique.has(key)) unique.set(key, value);
    }
    return Array.from(unique.values());
  }

  private sanitize<T extends UpdateExpertProfileType>(input: T): T {
    return {
      ...input,
      expertise: this.cleanList(input.expertise),
      education: this.cleanList(input.education),
      certifications: this.cleanList(input.certifications),
      website: input.website?.trim() || null,
    };
  }

  private async context(userId: number) {
    const user = await this.repository.findByUserId(userId);
    if (!user?.profile)
      throw new NotFoundException('Expert profile not found.');
    if (!user.userRoles.some((item) => item.role.name === RoleName.EXPERT)) {
      throw new ForbiddenException('This account is not an Expert account.');
    }
    return user;
  }

  async getMine(userId: number) {
    const user = await this.context(userId);
    const expert = user.profile!.expertProfile;
    return {
      id: expert?.id ?? 0,
      userId: user.id,
      displayName: user.profile!.displayName,
      avatarUrl: user.profile!.avatarUrl,
      bio: user.profile!.bio,
      profileCompletionPercent: user.profile!.profileCompletionPercent,
      title: expert?.title ?? null,
      expertise: expert?.expertise ?? [],
      yearsOfExperience: expert?.yearsOfExperience ?? null,
      education: expert?.education ?? [],
      certifications: expert?.certifications ?? [],
      website: expert?.website ?? null,
      isActive: expert?.isActive ?? false,
    };
  }

  async submitUpdate(userId: number, input: UpdateExpertProfileType) {
    const user = await this.context(userId);
    if (await this.repository.hasPendingRevision(userId)) {
      throw new ConflictException(
        'Your expert profile already has an update awaiting administrator review.',
      );
    }
    const sanitized = this.sanitize(input);
    const profileStrength = calculateExpertProfileStrength(sanitized);
    return this.revisions.submitExpert(
      userId,
      user.profile!.id,
      sanitized,
      profileStrength,
    );
  }

  async updateByAdmin(
    userId: number,
    adminId: number,
    input: AdminUpdateExpertProfileType,
  ) {
    await this.context(userId);
    const sanitized = this.sanitize(input);
    await this.repository.updateDirect(
      userId,
      adminId,
      sanitized,
      calculateExpertProfileStrength(sanitized),
    );
    return { message: 'Expert profile updated successfully.' };
  }
}
