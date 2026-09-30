import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { HashingService } from '../shared/services/hashing.service';
import { RoleName, type RoleNameType } from '@shared/types';

if (!process.env.DIRECT_URL) {
  console.log('Cannot find DB URL');
  process.exit(1);
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
  [RoleName.ADMIN]: { email: 'admin@gmail.com', password: 'Admin123!' },
  [RoleName.FREELANCER]: {
    email: 'freelancer@gmail.com',
    password: 'Freelancer123!',
  },
  [RoleName.CLIENT]: { email: 'client@gmail.com', password: 'Client123!' },
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
  });

  if (accountIsExist) {
    console.log('Account already exists: ', accountIsExist);
    return;
  }

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
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('New account created: ', newAccount);
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
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
