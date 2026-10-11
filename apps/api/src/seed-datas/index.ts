import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { HashingService } from '../shared/services/hashing.service';
import { RoleName, type RoleNameType } from '@shared/types';

if (!process.env.DIRECT_URL) {
  console.log('Cannot find DB URL');
  process.exit(1);
}

function requireSeedCredential(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required seed credential: ${name}`);
  }
  return value;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

const hashingService = new HashingService();

const DEFAULT_EMAIL_AND_PASSWORD: Record<
  RoleNameType,
  {
    email: string;
    password: string;
  }
> = {
  [RoleName.ADMIN]: {
    email: requireSeedCredential('SEED_ADMIN_EMAIL'),
    password: requireSeedCredential('SEED_ADMIN_PASSWORD'),
  },
  [RoleName.FREELANCER]: {
    email: requireSeedCredential('SEED_FREELANCER_EMAIL'),
    password: requireSeedCredential('SEED_FREELANCER_PASSWORD'),
  },
  [RoleName.CLIENT]: {
    email: requireSeedCredential('SEED_CLIENT_EMAIL'),
    password: requireSeedCredential('SEED_CLIENT_PASSWORD'),
  },
};

async function createAccountRole({
  email,
  role,
}: {
  email: string;
  role: RoleNameType;
}) {
  const accountIsExist = await prisma.user.findFirst({
    where: {
      email,
    },
    include: {
      profile: {
        include: {
          freelancerProfile: true,
        },
      },
    },
  });

  const accountRole = await prisma.role.findFirst({
    where: {
      name: role,
      deletedAt: null,
    },
  });

  if (!accountRole) {
    console.log(`Role not found: ${role}`);
    return;
  }

  if (!accountIsExist) {
    const newAccount = await prisma.user.create({
      data: {
        email,
        password: (await hashingService.hash(
          DEFAULT_EMAIL_AND_PASSWORD[role].password,
        )) as string,
        isBanned: false,
        userRoles: {
          create: {
            roleId: accountRole.id,
            isPrimary: true,
          },
        },
        profile: {
          create: {
            displayName: email.split('@')[0],
            freelancerProfile:
              role === RoleName.FREELANCER
                ? {
                    create: {
                      title: 'Senior UI/UX Designer',
                    },
                  }
                : undefined,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('New account created: ', newAccount);
  } else {
    console.log('Account already exists: ', accountIsExist.email);
    if (!accountIsExist.profile) {
      const newProfile = await prisma.profile.create({
        data: {
          userId: accountIsExist.id,
          displayName: email.split('@')[0],
          freelancerProfile:
            role === RoleName.FREELANCER
              ? {
                  create: {
                    title: 'Senior UI/UX Designer',
                  },
                }
              : undefined,
        },
      });
      console.log('Created missing profile for user: ', newProfile);
    } else if (
      role === RoleName.FREELANCER &&
      !accountIsExist.profile.freelancerProfile
    ) {
      const newFreelancerProfile = await prisma.freelancerProfile.create({
        data: {
          profileId: accountIsExist.profile.id,
          title: 'Senior UI/UX Designer',
        },
      });
      console.log('Created missing freelancer profile: ', newFreelancerProfile);
    }
  }
}

async function main() {
  const newRoles = await prisma.role.createMany({
    data: [
      { name: RoleName.ADMIN, description: 'Administrator role' },
      { name: RoleName.FREELANCER, description: 'Seller role' },
      { name: RoleName.CLIENT, description: 'Client role' },
    ],
    skipDuplicates: true,
  });
  console.log('New roles created: ', newRoles);

  await createAccountRole({
    email: DEFAULT_EMAIL_AND_PASSWORD[RoleName.ADMIN].email,
    role: RoleName.ADMIN,
  });

  await createAccountRole({
    email: DEFAULT_EMAIL_AND_PASSWORD[RoleName.FREELANCER].email,
    role: RoleName.FREELANCER,
  });

  await createAccountRole({
    email: DEFAULT_EMAIL_AND_PASSWORD[RoleName.CLIENT].email,
    role: RoleName.CLIENT,
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
