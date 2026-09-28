import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

// Kiểm tra DB URL
if (!process.env.DIRECT_URL) {
  console.log('Cannot find DB URL');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

const CLIENT_EMAIL = 'client@gmail.com';

async function main() {
  const clientUser = await prisma.user.findUnique({
    where: { email: CLIENT_EMAIL },
  });

  if (!clientUser) {
    console.log(
      'Client user not found, run main seed first to create accounts',
    );
    return;
  }

  const existingJob = await prisma.job.findFirst({
    where: { clientId: clientUser.id, title: 'Build landing page' },
  });

  if (existingJob) {
    console.log('Job already exists: ', existingJob.id);
    return;
  }

  const newJob = await prisma.job.create({
    data: {
      clientId: clientUser.id,
      title: 'Build landing page',
      description:
        'Create a responsive marketing landing page using React and TailwindCSS.',
      budgetMin: '100.00',
      budgetMax: '500.00',
      budgetType: 'FIXED_PRICE',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'OPEN',
      featured: false,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      skills: {
        create: [{ skillName: 'React' }, { skillName: 'TailwindCSS' }],
      },
    },
  });

  console.log('New job created: ', newJob.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
