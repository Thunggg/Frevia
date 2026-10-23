import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

if (!process.env.DIRECT_URL) {
  console.log('Cannot find DB URL');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL,
  }),
});

// Danh mục công việc mẫu (UC-46). Sau khi tạo, mỗi job mẫu được gắn danh mục
// tương ứng để flow tìm kiếm/lọc job theo danh mục có dữ liệu thật.
const jobCategories = [
  {
    name: 'Web Development',
    slug: 'web-development',
    description:
      'Thiết kế và phát triển website, ứng dụng web (frontend, backend, full-stack).',
    jobSlugs: ['build-landing-page', 'develop-rest-api', 'e-commerce-website'],
  },
  {
    name: 'Mobile App Development',
    slug: 'mobile-app-development',
    description: 'Phát triển ứng dụng di động đa nền tảng và ứng dụng gốc.',
    jobSlugs: ['react-native-mobile-app'],
  },
  {
    name: 'AI & Machine Learning',
    slug: 'ai-machine-learning',
    description: 'Tích hợp AI, chatbot và các mô hình học máy vào sản phẩm.',
    jobSlugs: ['ai-chatbot-integration'],
  },
];

async function main() {
  console.log('Seeding job categories...');

  for (const category of jobCategories) {
    const existing = await prisma.jobCategory.findFirst({
      where: { slug: category.slug, deletedAt: null },
    });

    const jobCategory = existing
      ? await prisma.jobCategory.update({
          where: { id: existing.id },
          data: {
            name: category.name,
            description: category.description,
            status: 'ACTIVE',
          },
        })
      : await prisma.jobCategory.create({
          data: {
            name: category.name,
            slug: category.slug,
            description: category.description,
            status: 'ACTIVE',
          },
        });

    const jobs = await prisma.job.findMany({
      where: { slug: { in: category.jobSlugs }, deletedAt: null },
      select: { id: true },
    });

    if (jobs.length > 0) {
      await prisma.jobJobCategory.createMany({
        data: jobs.map((job) => ({
          jobId: job.id,
          categoryId: jobCategory.id,
        })),
        skipDuplicates: true,
      });
    }

    console.log(`Category "${category.name}": ${jobs.length} job(s) linked.`);
  }

  console.log('Seed job categories completed!');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
