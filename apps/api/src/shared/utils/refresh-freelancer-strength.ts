import { Prisma } from '@prisma/client';
import { calculateFreelancerProfileStrength } from './profile-strength';

export async function refreshFreelancerStrength(
  transaction: Prisma.TransactionClient,
  profileId: number,
) {
  const profile = await transaction.profile.findUniqueOrThrow({
    where: { id: profileId },
    include: {
      freelancerProfile: {
        include: {
          _count: {
            select: {
              skills: { where: { skill: { deletedAt: null } } },
              portfolioItems: { where: { deletedAt: null } },
            },
          },
        },
      },
    },
  });
  const freelancer = profile.freelancerProfile;
  return transaction.profile.update({
    where: { id: profileId },
    data: {
      profileCompletionPercent: calculateFreelancerProfileStrength({
        displayName: profile.displayName,
        bio: profile.bio,
        title: freelancer?.title,
        education: freelancer?.education,
        certifications: freelancer?.certifications,
        skillCount: freelancer?._count.skills ?? 0,
        portfolioCount: freelancer?._count.portfolioItems ?? 0,
      }),
    },
  });
}
