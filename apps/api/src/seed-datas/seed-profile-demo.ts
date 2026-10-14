import { PrismaPg } from '@prisma/adapter-pg';
import { AvailabilityStatus, PrismaClient } from '@prisma/client';
import { RoleName } from '@shared/types';
import 'dotenv/config';

const DEMO_EMAIL = 'freelancer@gmail.com';

const demoSkills = [
  { skillName: 'TypeScript', proficiencyLevel: 9 },
  { skillName: 'React', proficiencyLevel: 9 },
  { skillName: 'Next.js', proficiencyLevel: 8 },
  { skillName: 'Node.js', proficiencyLevel: 8 },
  { skillName: 'PostgreSQL', proficiencyLevel: 7 },
  { skillName: 'UI/UX Design', proficiencyLevel: 8 },
];

const demoPortfolios = [
  {
    title: 'Frevia Marketplace Platform',
    description:
      'A full-stack freelance marketplace featuring job discovery, proposals, contracts, real-time conversations, and role-based dashboards.',
    technologies: ['Next.js', 'NestJS', 'TypeScript', 'PostgreSQL', 'Prisma'],
    projectUrl: 'https://github.com/',
  },
  {
    title: 'Analytics Dashboard Redesign',
    description:
      'A responsive analytics experience with accessible data visualizations, reusable design tokens, and a mobile-first interaction system.',
    technologies: ['Figma', 'React', 'Tailwind CSS', 'Storybook'],
    projectUrl: 'https://www.figma.com/',
  },
  {
    title: 'Realtime Team Collaboration App',
    description:
      'A collaboration workspace with live messaging, file sharing, presence indicators, and notification workflows for distributed teams.',
    technologies: ['NestJS', 'Socket.IO', 'React', 'Docker'],
    projectUrl: 'https://socket.io/',
  },
];

if (!process.env.DIRECT_URL) {
  throw new Error('DIRECT_URL is required to seed the demo profile.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

async function seedDemoProfile() {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    include: {
      profile: { include: { freelancerProfile: true } },
      userRoles: { include: { role: true } },
    },
  });

  if (!user?.profile) {
    throw new Error(
      `Demo account ${DEMO_EMAIL} or its profile was not found. Run pnpm --filter api seed first.`,
    );
  }

  const hasFreelancerRole = user.userRoles.some(
    (userRole) => userRole.role.name === RoleName.FREELANCER,
  );
  if (!hasFreelancerRole) {
    throw new Error(`Demo account ${DEMO_EMAIL} is not a freelancer.`);
  }

  const profile = await prisma.profile.update({
    where: { id: user.profile.id },
    data: {
      displayName: 'Alex Nguyen',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      coverUrl:
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80',
      bio: 'Senior full-stack developer and product designer with 7+ years of experience building reliable web products for startups and growing teams.',
      onlineStatus: true,
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      profileCompletionPercent: 95,
      freelancerProfile: {
        upsert: {
          create: {
            title: 'Senior Full-Stack Developer & Product Designer',
            education: [
              'B.Sc. Computer Science — University of Technology, 2018',
            ],
            certifications: [
              'AWS Certified Developer — Associate',
              'Professional Scrum Master I',
            ],
            languages: ['Vietnamese — Native', 'English — Professional'],
            idVerified: true,
          },
          update: {
            title: 'Senior Full-Stack Developer & Product Designer',
            education: [
              'B.Sc. Computer Science — University of Technology, 2018',
            ],
            certifications: [
              'AWS Certified Developer — Associate',
              'Professional Scrum Master I',
            ],
            languages: ['Vietnamese — Native', 'English — Professional'],
            idVerified: true,
          },
        },
      },
    },
    include: { freelancerProfile: true },
  });

  const freelancerProfile = profile.freelancerProfile;
  if (!freelancerProfile) {
    throw new Error('Unable to create the demo freelancer profile.');
  }

  for (const skill of demoSkills) {
    const existingSkill = await prisma.freelancerSkill.findFirst({
      where: {
        freelancerProfileId: freelancerProfile.id,
        skillName: { equals: skill.skillName, mode: 'insensitive' },
      },
    });

    if (existingSkill) {
      await prisma.freelancerSkill.update({
        where: { id: existingSkill.id },
        data: { proficiencyLevel: skill.proficiencyLevel },
      });
    } else {
      await prisma.freelancerSkill.create({
        data: { freelancerProfileId: freelancerProfile.id, ...skill },
      });
    }
  }

  for (const portfolio of demoPortfolios) {
    const existingPortfolio = await prisma.portfolioItem.findFirst({
      where: {
        freelancerProfileId: freelancerProfile.id,
        title: portfolio.title,
      },
    });

    if (existingPortfolio) {
      await prisma.portfolioItem.update({
        where: { id: existingPortfolio.id },
        data: { ...portfolio, deletedAt: null },
      });
    } else {
      await prisma.portfolioItem.create({
        data: { freelancerProfileId: freelancerProfile.id, ...portfolio },
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        email: DEMO_EMAIL,
        profileId: profile.id,
        skillsSeeded: demoSkills.length,
        portfoliosSeeded: demoPortfolios.length,
      },
      null,
      2,
    ),
  );
}

seedDemoProfile()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
