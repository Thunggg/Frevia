import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

if (!process.env.DIRECT_URL) {
  console.log('Cannot find DB URL');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

const FREELANCER_EMAIL = 'freelancer@gmail.com';

const proposalData = [
  {
    coverLetter: `Hi! I'm an experienced React developer with 3+ years of building responsive UIs. I've worked on multiple landing pages using React and Tailwind CSS, delivering pixel-perfect designs. I can complete this within 7 days and ensure mobile responsiveness across all devices.`,
    bidAmount: '350',
    deliveryTime: 7,
    status: 'PENDING' as const,
    isDraft: false,
  },
  {
    coverLetter: `I specialize in NestJS and PostgreSQL backend development. I have built production-grade REST APIs with proper authentication, rate limiting, and Swagger documentation. I'd love to take on this project and deliver clean, well-tested code.`,
    bidAmount: '900',
    deliveryTime: 14,
    status: 'ACCEPTED' as const,
    isDraft: false,
  },
  {
    coverLetter: `React Native is my primary tech stack. I've published 5+ apps on both App Store and Google Play. I can handle state management, push notifications, and Firebase integration. Happy to share my portfolio upon request.`,
    bidAmount: '2200',
    deliveryTime: 30,
    status: 'PENDING' as const,
    isDraft: false,
  },
  {
    coverLetter: `I have extensive e-commerce experience with Next.js and Stripe. I'll set up product catalog, cart, checkout flow, and admin dashboard. SEO optimization is included by default in my workflow.`,
    bidAmount: '1800',
    deliveryTime: 21,
    status: 'REJECTED' as const,
    isDraft: false,
  },
  {
    coverLetter: `I've integrated OpenAI API in multiple Python/FastAPI projects. I can design the chatbot architecture, handle context windows, streaming responses, and fallback mechanisms. Looking forward to discussing your requirements.`,
    bidAmount: '1100',
    deliveryTime: 10,
    status: 'WITHDRAWN' as const,
    isDraft: false,
  },
];

async function main() {
  // Find freelancer user
  const freelancer = await prisma.user.findUnique({
    where: { email: FREELANCER_EMAIL },
  });

  if (!freelancer) {
    throw new Error(
      `Freelancer user not found (email: ${FREELANCER_EMAIL}). Please run the main seed first.`,
    );
  }

  // Get existing jobs
  const jobs = await prisma.job.findMany({
    take: proposalData.length,
    orderBy: { id: 'asc' },
  });

  if (jobs.length === 0) {
    throw new Error(
      'No jobs found in database. Please run seed:jobs first.',
    );
  }

  console.log(`Found ${jobs.length} jobs. Creating proposals...`);

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < Math.min(jobs.length, proposalData.length); i++) {
    const job = jobs[i];
    const data = proposalData[i];

    // Check if proposal already exists (active one)
    const existed = await prisma.proposal.findFirst({
      where: {
        jobId: job.id,
        freelancerId: freelancer.id,
        deletedAt: null,
      },
    });

    if (existed) {
      console.log(
        `  [SKIP] Proposal already exists for job "${job.title}" (id: ${existed.id})`,
      );
      skipped++;
      continue;
    }

    const proposal = await prisma.proposal.create({
      data: {
        jobId: job.id,
        freelancerId: freelancer.id,
        coverLetter: data.coverLetter,
        bidAmount: data.bidAmount,
        deliveryTime: data.deliveryTime,
        status: data.status,
        isDraft: data.isDraft,
      },
    });

    console.log(
      `  [OK] Created proposal #${proposal.id} for job "${job.title}" — status: ${data.status}, bid: $${data.bidAmount}`,
    );
    created++;
  }

  console.log(
    `\nDone! Created: ${created}, Skipped (already existed): ${skipped}`,
  );
  console.log('\nProposal summary:');
  console.log('  - PENDING   : proposals waiting for client review');
  console.log('  - ACCEPTED  : proposal accepted (ready to create contract)');
  console.log('  - REJECTED  : proposal rejected by client');
  console.log('  - WITHDRAWN : proposal withdrawn by freelancer');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
