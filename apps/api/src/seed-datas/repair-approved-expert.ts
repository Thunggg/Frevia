import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  ProfileRevisionType,
  RevisionStatus,
} from '@prisma/client';
import { RoleName } from '@shared/types';

// One-time repair for approvals made before approval activated Expert.isActive.
// Read-only by default. Applying requires an explicit user ID; never bulk activates.
async function main() {
  if (!process.env.DIRECT_URL) throw new Error('DIRECT_URL is required');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
  });
  const userIdArg = process.argv.find((arg) => arg.startsWith('--user-id='));
  const userId = userIdArg ? Number(userIdArg.split('=')[1]) : undefined;
  const apply = process.argv.includes('--apply');
  if (
    (userId !== undefined && (!Number.isSafeInteger(userId) || userId <= 0)) ||
    (apply && !userId)
  ) {
    throw new Error('Applying requires --user-id=<positive integer>');
  }
  try {
    const candidates = await prisma.expert.findMany({
      where: {
        isActive: false,
        profile: {
          user: {
            ...(userId ? { id: userId } : {}),
            deletedAt: null,
            isBanned: false,
            userRoles: {
              some: { role: { name: RoleName.EXPERT, deletedAt: null } },
            },
          },
        },
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        profile: { select: { userId: true, displayName: true } },
      },
    });
    for (const expert of candidates) {
      const latest = await prisma.profileRevision.findFirst({
        where: {
          userId: expert.profile.userId,
          profileType: ProfileRevisionType.EXPERT,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: { id: true, status: true },
      });
      if (latest?.status !== RevisionStatus.APPROVED) continue;
      if (!apply) {
        console.log(
          JSON.stringify({
            userId: expert.profile.userId,
            displayName: expert.profile.displayName,
            title: expert.title,
            revisionId: latest.id,
            isActive: false,
          }),
        );
        continue;
      }
      const result = await prisma.expert.updateMany({
        where: { id: expert.id, isActive: false, updatedAt: expert.updatedAt },
        data: { isActive: true },
      });
      console.log(
        JSON.stringify({
          userId: expert.profile.userId,
          activated: result.count === 1,
        }),
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error('Expert repair failed. Check database access and arguments.');
  process.exitCode = 1;
});
