import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { RoleName } from '@shared/types';
import 'dotenv/config';
import { HashingService } from '../shared/services/hashing.service';

// Kiểm tra xem có database url ko
if (!process.env.DIRECT_URL) {
  console.log('Cannot file DB URL');
  process.exit(1);
}

// Khỏi tạo service và hash
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

const hashingService = new HashingService();

const DEFAULT_EMAIL_AND_PASSWORD: Record<
  keyof typeof RoleName,
  {
    email: string;
    password: string;
  }
> = {
  ADMIN: { email: 'admin@gmail.com', password: '123456' },
  FREELANCER: { email: 'freelancer@gmail.com', password: '123456' },
  CLIENT: { email: 'client@gmail.com', password: '123456' },
};

async function createAccountRole({
  email,
  role,
}: {
  email: string;
  role: keyof typeof RoleName;
}) {
  const accountIsExist = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (!accountIsExist) {
    const accountRole = await prisma.role.findFirst({
      where: {
        name: role as any,
      },
    });

    const newAccount = await prisma.user.create({
      data: {
        email,
        password: (await hashingService.hash(
          DEFAULT_EMAIL_AND_PASSWORD[role].password,
        )) as string,
        isBanned: false,
        userRoles: {
          create: {
            roleId: accountRole!.id,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('New account created: ', newAccount);
  } else {
    console.log('Account already exists: ', accountIsExist);
  }
}

async function main() {
  // Khởi tạo bảng roles
  const newRoles = await prisma.role.createMany({
    data: [
      { name: RoleName.ADMIN, description: 'Administrator role' },
      { name: RoleName.FREELANCER, description: 'Seller role' },
      { name: RoleName.CLIENT, description: 'Client role' },
    ],
    skipDuplicates: true,
  });
  console.log('New roles created: ', newRoles);

  // Kiểm tra xem đã có tài khoản admin chưa
  await createAccountRole({
    email: DEFAULT_EMAIL_AND_PASSWORD.ADMIN.email,
    role: RoleName.ADMIN,
  });

  await createAccountRole({
    email: DEFAULT_EMAIL_AND_PASSWORD.FREELANCER.email,
    role: RoleName.FREELANCER,
  });

  await createAccountRole({
    email: DEFAULT_EMAIL_AND_PASSWORD.CLIENT.email,
    role: RoleName.CLIENT,
  });
}

main();
