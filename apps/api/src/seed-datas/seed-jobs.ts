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

const CLIENT_EMAIL = 'taitpce181632@fpt.edu.vn';

const skills = [
  'HTML',
  'CSS',
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Vue.js',
  'Angular',
  'Tailwind CSS',
  'Bootstrap',
  'React Native',
  'Flutter',
  'Node.js',
  'Express.js',
  'NestJS',
  'PHP',
  'Laravel',
  'Python',
  'Django',
  'FastAPI',
  'Java',
  'Spring Boot',
  'C#',
  '.NET',
  'Go',
  'Rust',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Redis',
  'SQLite',
  'Firebase',
  'Docker',
  'Kubernetes',
  'AWS',
  'Azure',
  'Google Cloud',
  'REST API',
  'GraphQL',
  'Figma',
  'UI Design',
  'UX Design',
  'Adobe Photoshop',
  'Adobe Illustrator',
  'WordPress',
  'Shopify',
  'WooCommerce',
  'Jest',
  'Cypress',
  'Playwright',
  'Machine Learning',
  'Deep Learning',
  'TensorFlow',
  'PyTorch',
  'OpenAI API',
  'SEO',
  'Google Ads',
  'Facebook Ads',
  'Content Writing',
  'Copywriting',
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

async function main() {
  const client = await prisma.user.findUnique({
    where: {
      email: CLIENT_EMAIL,
    },
  });

  if (!client) {
    throw new Error('Client user not found');
  }

  console.log('Seeding skills...');

  await prisma.skill.createMany({
    data: skills.map((skill) => ({
      name: skill,
      slug: slugify(skill),
    })),
    skipDuplicates: true,
  });

  const allSkills = await prisma.skill.findMany();

  const skillMap = new Map(allSkills.map((s) => [s.slug, s.id]));

  const jobs = [
    {
      title: 'Build Landing Page',
      description:
        'Create a responsive landing page using React and Tailwind CSS.',
      budgetMin: '100',
      budgetMax: '500',
      budgetType: 'FIXED_PRICE',
      skills: ['react', 'tailwind-css', 'typescript'],
    },
    {
      title: 'Develop REST API',
      description: 'Build RESTful APIs using NestJS and PostgreSQL.',
      budgetMin: '500',
      budgetMax: '1200',
      budgetType: 'FIXED_PRICE',
      skills: ['nestjs', 'postgresql', 'docker'],
    },
    {
      title: 'React Native Mobile App',
      description: 'Develop a cross-platform mobile application.',
      budgetMin: '1000',
      budgetMax: '3000',
      budgetType: 'FIXED_PRICE',
      skills: ['react-native', 'firebase', 'typescript'],
    },
    {
      title: 'E-commerce Website',
      description: 'Build an online store with Next.js and Stripe.',
      budgetMin: '800',
      budgetMax: '2500',
      budgetType: 'FIXED_PRICE',
      skills: ['nextjs', 'react', 'postgresql'],
    },
    {
      title: 'AI Chatbot Integration',
      description: 'Integrate OpenAI API into an existing web application.',
      budgetMin: '600',
      budgetMax: '1500',
      budgetType: 'FIXED_PRICE',
      skills: ['python', 'openai-api', 'fastapi'],
    },
  ];

  for (const job of jobs) {
    const existed = await prisma.job.findUnique({
      where: {
        slug: slugify(job.title),
      },
    });

    if (existed) continue;

    await prisma.job.create({
      data: {
        clientId: client.id,
        title: job.title,
        slug: slugify(job.title),
        description: job.description,
        budgetMin: job.budgetMin,
        budgetMax: job.budgetMax,
        budgetType: job.budgetType as any,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'OPEN',
        featured: false,
        skills: {
          create: job.skills.map((slug) => ({
            skillId: skillMap.get(slug)!,
          })),
        },
      },
    });
  }

  console.log('Seed completed!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
