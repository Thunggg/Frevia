import { PrismaPg } from '@prisma/adapter-pg';
import {
  DocumentType,
  PrismaClient,
  SocialPlatform,
  VerificationStatus,
  BudgetType,
  ContractStatus,
  JobStatus,
  ProposalStatus,
} from '@prisma/client';
import 'dotenv/config';

const CLIENT_EMAIL = 'client@gmail.com';
const FREELANCER_EMAIL = 'freelancer@gmail.com';
const DEMO_DOCUMENT_URL =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

if (!process.env.DIRECT_URL) {
  throw new Error('DIRECT_URL is required to seed account profile demos.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

async function upsertSocialLink(
  profileId: number,
  platform: SocialPlatform,
  url: string,
) {
  const existing = await prisma.socialLink.findFirst({
    where: { profileId, platform },
  });
  if (existing) {
    return prisma.socialLink.update({
      where: { id: existing.id },
      data: { url },
    });
  }
  return prisma.socialLink.create({ data: { profileId, platform, url } });
}

async function seedAccountProfileDemo() {
  const [client, freelancer] = await Promise.all([
    prisma.user.findUnique({
      where: { email: CLIENT_EMAIL },
      include: { profile: true },
    }),
    prisma.user.findUnique({
      where: { email: FREELANCER_EMAIL },
      include: { profile: true },
    }),
  ]);

  if (!client?.profile || !freelancer?.profile) {
    throw new Error(
      'Run the main seed and profile demo seed before this seed.',
    );
  }

  await prisma.profile.update({
    where: { id: client.profile.id },
    data: {
      displayName: 'Jordan Tran',
      avatarUrl:
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
      coverUrl:
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=80',
      bio: 'Product-focused technology company partnering with specialists to build useful digital experiences.',
      profileCompletionPercent: 90,
      clientProfile: {
        upsert: {
          create: {
            companyName: 'Northstar Digital Labs',
            companyDescription:
              'Northstar Digital Labs builds SaaS products for commerce and collaboration. We value clear communication, thoughtful execution, and long-term freelance partnerships.',
            website: 'https://example.com/',
          },
          update: {
            companyName: 'Northstar Digital Labs',
            companyDescription:
              'Northstar Digital Labs builds SaaS products for commerce and collaboration. We value clear communication, thoughtful execution, and long-term freelance partnerships.',
            website: 'https://example.com/',
          },
        },
      },
    },
  });

  await Promise.all([
    upsertSocialLink(
      client.profile.id,
      SocialPlatform.LINKEDIN,
      'https://www.linkedin.com/',
    ),
    upsertSocialLink(
      client.profile.id,
      SocialPlatform.WEBSITE,
      'https://example.com/',
    ),
    upsertSocialLink(
      freelancer.profile.id,
      SocialPlatform.GITHUB,
      'https://github.com/',
    ),
    upsertSocialLink(
      freelancer.profile.id,
      SocialPlatform.LINKEDIN,
      'https://www.linkedin.com/',
    ),
  ]);

  await prisma.favoriteFreelancer.upsert({
    where: {
      clientId_freelancerId: {
        clientId: client.id,
        freelancerId: freelancer.id,
      },
    },
    create: { clientId: client.id, freelancerId: freelancer.id },
    update: {},
  });

  const existingDocument = await prisma.idVerificationDocument.findFirst({
    where: { userId: freelancer.id, fileUrl: DEMO_DOCUMENT_URL },
  });
  if (existingDocument) {
    await prisma.idVerificationDocument.update({
      where: { id: existingDocument.id },
      data: {
        documentType: DocumentType.PASSPORT,
        status: VerificationStatus.APPROVED,
        reviewNotes: 'Demo document approved for presentation.',
        reviewedAt: new Date(),
        deletedAt: null,
      },
    });
  } else {
    await prisma.idVerificationDocument.create({
      data: {
        userId: freelancer.id,
        documentType: DocumentType.PASSPORT,
        fileUrl: DEMO_DOCUMENT_URL,
        status: VerificationStatus.APPROVED,
        reviewNotes: 'Demo document approved for presentation.',
        reviewedAt: new Date(),
      },
    });
  }

  const demoJob = await prisma.job.upsert({
    where: { slug: 'frevia-review-demo-contract' },
    create: {
      clientId: client.id,
      title: 'Frevia review demo project',
      slug: 'frevia-review-demo-contract',
      description: 'Stable demo project for the review management use cases.',
      budgetType: BudgetType.FIXED_PRICE,
      budgetMin: 800,
      budgetMax: 1200,
      status: JobStatus.COMPLETED,
    },
    update: {
      clientId: client.id,
      status: JobStatus.COMPLETED,
      deletedAt: null,
    },
  });

  let demoProposal = await prisma.proposal.findFirst({
    where: {
      jobId: demoJob.id,
      freelancerId: freelancer.id,
      deletedAt: null,
    },
  });
  if (!demoProposal) {
    demoProposal = await prisma.proposal.create({
      data: {
        jobId: demoJob.id,
        freelancerId: freelancer.id,
        coverLetter: 'Demo proposal for review management.',
        bidAmount: 1000,
        deliveryDays: 14,
        status: ProposalStatus.ACCEPTED,
        submittedAt: new Date(),
        acceptedAt: new Date(),
      },
    });
  }

  const demoContract = await prisma.contract.upsert({
    where: { proposalId: demoProposal.id },
    create: {
      jobId: demoJob.id,
      proposalId: demoProposal.id,
      clientId: client.id,
      freelancerId: freelancer.id,
      terms: 'Demo contract used to present the complete review lifecycle.',
      totalAmount: 1000,
      status: ContractStatus.COMPLETED,
      signedByClient: true,
      signedByFreelancer: true,
      signedAt: new Date(),
      completedAt: new Date(),
    },
    update: {
      clientId: client.id,
      freelancerId: freelancer.id,
      status: ContractStatus.COMPLETED,
      deletedAt: null,
    },
  });

  await prisma.review.upsert({
    where: {
      contractId_reviewerId: {
        contractId: demoContract.id,
        reviewerId: client.id,
      },
    },
    create: {
      contractId: demoContract.id,
      reviewerId: client.id,
      revieweeId: freelancer.id,
      overallRating: 4.8,
      breakdown: { quality: 5, communication: 4.5, deadlines: 5 },
      comment:
        'Excellent delivery, thoughtful communication, and reliable progress updates.',
    },
    update: {
      revieweeId: freelancer.id,
      overallRating: 4.8,
      breakdown: { quality: 5, communication: 4.5, deadlines: 5 },
      comment:
        'Excellent delivery, thoughtful communication, and reliable progress updates.',
      deletedAt: null,
    },
  });

  console.log(
    JSON.stringify(
      {
        clientUserId: client.id,
        clientProfileId: client.profile.id,
        freelancerUserId: freelancer.id,
        freelancerProfileId: freelancer.profile.id,
        reviewDemoContractId: demoContract.id,
      },
      null,
      2,
    ),
  );
}

seedAccountProfileDemo()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
