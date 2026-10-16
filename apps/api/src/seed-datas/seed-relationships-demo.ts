import { PrismaPg } from '@prisma/adapter-pg';
import { NotificationType, PrismaClient } from '@prisma/client';
import 'dotenv/config';

function requireEnvironmentValue(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const clientEmail = requireEnvironmentValue('SEED_CLIENT_EMAIL');
const freelancerEmail = requireEnvironmentValue('SEED_FREELANCER_EMAIL');
const connectionString = requireEnvironmentValue('DIRECT_URL');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const demoNotificationTitles = [
  'A freelancer you follow updated their profile',
  'New proposal received',
  'Contract is ready to review',
  'Welcome back to Frevia',
];

async function seedRelationshipsDemo() {
  const [client, freelancer] = await Promise.all([
    prisma.user.findUnique({
      where: { email: clientEmail },
      include: {
        profile: true,
        userRoles: { include: { role: true } },
      },
    }),
    prisma.user.findUnique({
      where: { email: freelancerEmail },
      include: { profile: true },
    }),
  ]);

  if (!client?.profile || !freelancer?.profile) {
    throw new Error(
      'Demo users are missing. Run the main seed before seed:relationships-demo.',
    );
  }

  await prisma.followFreelancer.upsert({
    where: {
      clientId_freelancerId: {
        clientId: client.id,
        freelancerId: freelancer.id,
      },
    },
    create: {
      clientId: client.id,
      freelancerId: freelancer.id,
    },
    update: {},
  });

  await prisma.notification.deleteMany({
    where: {
      userId: client.id,
      title: { in: demoNotificationTitles },
    },
  });

  const now = Date.now();
  await prisma.notification.createMany({
    data: [
      {
        userId: client.id,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: demoNotificationTitles[0],
        message: `${freelancer.profile.displayName ?? 'A freelancer'} added new skills and portfolio details.`,
        data: {
          href: `/profiles/${freelancer.profile.id}`,
          source: 'relationships-demo',
        },
        createdAt: new Date(now - 2 * 60 * 1000),
      },
      {
        userId: client.id,
        type: NotificationType.PROPOSAL_NEW,
        title: demoNotificationTitles[1],
        message: 'A freelancer submitted a proposal for your active job.',
        data: { href: '/client/jobs', source: 'relationships-demo' },
        createdAt: new Date(now - 18 * 60 * 1000),
      },
      {
        userId: client.id,
        type: NotificationType.CONTRACT_CREATED,
        title: demoNotificationTitles[2],
        message: 'Review the latest contract details before work begins.',
        data: { href: '/account-profile', source: 'relationships-demo' },
        createdAt: new Date(now - 75 * 60 * 1000),
      },
      {
        userId: client.id,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: demoNotificationTitles[3],
        message: 'Your account is ready for the relationships and roles demo.',
        data: { href: '/notifications', source: 'relationships-demo' },
        isRead: true,
        createdAt: new Date(now - 24 * 60 * 60 * 1000),
      },
    ],
  });

  const hasFreelancerRole = client.userRoles.some(
    ({ role }) => role.name === 'FREELANCER',
  );

  console.log(
    JSON.stringify(
      {
        loginEmail: client.email,
        followingProfileUrl: `/profiles/${freelancer.profile.id}`,
        followingListUrl: '/account-profile?tab=following',
        notificationsUrl: '/notifications',
        notificationsSeeded: demoNotificationTitles.length,
        joinFreelancerRoleReady: !hasFreelancerRole,
        roleDemoNote: hasFreelancerRole
          ? 'This user already has the Freelancer role, so the menu will demonstrate Switch Role. Use a fresh seeded Client user to demonstrate Join New Role.'
          : 'Open the account menu and choose Add Freelancer role, then use the same menu to switch roles.',
      },
      null,
      2,
    ),
  );
}

seedRelationshipsDemo()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
