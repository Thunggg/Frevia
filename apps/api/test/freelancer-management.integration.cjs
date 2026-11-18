// Runs against the configured dev database; all writes are rolled back.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { RoleName } = require('@shared/types');
const {
  ProfileRepository,
} = require('../dist/src/routes/profiles/profile.repo');
const {
  ProfileService,
} = require('../dist/src/routes/profiles/profile.service');
const {
  PortfolioRepository,
} = require('../dist/src/routes/portfolios/portfolio.repo');
const {
  PortfolioService,
} = require('../dist/src/routes/portfolios/portfolio.service');

async function main() {
  if (!process.env.DIRECT_URL) throw new Error('DIRECT_URL is required');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DIRECT_URL,
      max: 1,
      connectionTimeoutMillis: 10000,
    }),
  });
  const rollback = new Error('ROLLBACK_INTEGRATION_CHECK');
  let verified = false;
  try {
    await prisma.$transaction(
      async (tx) => {
        const role = await tx.role.findFirst({
          where: { name: RoleName.FREELANCER, deletedAt: null },
        });
        assert.ok(role, 'The Freelancer role must exist in the dev database');
        const fixture = await tx.user.create({
          data: {
            email: `integration-${randomUUID()}@example.invalid`,
            userRoles: { create: { roleId: role.id, isPrimary: true } },
            profile: {
              create: {
                displayName: 'Integration fixture',
                bio: 'Existing biography',
                freelancerProfile: {
                  create: {
                    title: 'Developer',
                    experience: ['Existing experience'],
                  },
                },
              },
            },
          },
          select: { profile: { include: { freelancerProfile: true } } },
        });
        const profile = fixture.profile;
        assert.ok(profile);
        // Nested repository transactions share the outer rollback-only transaction.
        const database = new Proxy(tx, {
          get(target, property) {
            return property === '$transaction'
              ? (callback) => callback(tx)
              : target[property];
          },
        });
        const profiles = new ProfileRepository(database);
        const service = new ProfileService(
          profiles,
          {},
          {},
          {},
          {
            requiresManualReview: () => false,
            directUpdateResult: (profileStrength) => ({
              profileStrength,
              reviewRequired: false,
            }),
          },
          { enqueueAndProcess: async () => {} },
        );
        const portfolios = new PortfolioService(
          new PortfolioRepository(database),
        );
        const name = `Integration ${randomUUID()}`;

        await service.updateProfile(profile.id, profile.userId, {
          displayName: name,
          title: 'Integration engineer',
        });
        const updated = await service.viewProfile(profile.id);
        assert.equal(updated.displayName, name);
        assert.deepEqual(
          updated.freelancerProfile.experience,
          profile.freelancerProfile?.experience ?? [],
        );
        await assert.rejects(
          service.updateProfile(profile.id, -1, {
            displayName: name,
            title: 'Forbidden',
          }),
          (error) => error.getStatus() === 403,
        );

        const skill = await service.addSkill(profile.id, profile.userId, {
          skillName: name,
          proficiencyLevel: 8,
        });
        assert.ok(
          (await service.getSkills(profile.id)).some(
            (item) => item.id === skill.id,
          ),
        );
        await assert.rejects(
          service.addSkill(profile.id, profile.userId, {
            skillName: name.toLowerCase(),
            proficiencyLevel: 5,
          }),
          (error) => error.getStatus() === 400,
        );
        await assert.rejects(
          service.deleteSkill(skill.id, -1),
          (error) => error.getStatus() === 403,
        );
        await service.deleteSkill(skill.id, profile.userId);
        assert.equal(
          await tx.freelancerSkill.findUnique({ where: { id: skill.id } }),
          null,
        );
        assert.ok(await tx.skill.findUnique({ where: { id: skill.skillId } }));

        const portfolio = await portfolios.addPortfolio(
          profile.id,
          profile.userId,
          {
            title: name,
            description: 'Integration check',
            technologies: ['TypeScript'],
            projectUrl: 'https://example.com',
          },
        );
        assert.ok(
          (await portfolios.getPortfolios(profile.id)).some(
            (item) => item.id === portfolio.id,
          ),
        );
        await portfolios.updatePortfolio(portfolio.id, profile.userId, {
          title: `${name} updated`,
        });
        assert.equal(
          (await portfolios.getPortfolioDetail(portfolio.id)).title,
          `${name} updated`,
        );
        await assert.rejects(
          portfolios.updatePortfolio(portfolio.id, -1, { title: 'Forbidden' }),
          (error) => error.getStatus() === 403,
        );
        await portfolios.deletePortfolio(portfolio.id, profile.userId);
        assert.ok(
          (await tx.portfolioItem.findUnique({ where: { id: portfolio.id } }))
            .deletedAt,
        );
        assert.ok(
          !(await portfolios.getPortfolios(profile.id)).some(
            (item) => item.id === portfolio.id,
          ),
        );
        await assert.rejects(
          portfolios.getPortfolioDetail(portfolio.id),
          (error) => error.getStatus() === 404,
        );
        verified = true;
        throw rollback;
      },
      { timeout: 90000, maxWait: 10000 },
    );
  } catch (error) {
    if (error !== rollback) throw error;
  } finally {
    await prisma.$disconnect();
  }
  assert.ok(verified);
  console.log(
    'PASS: profile update, field preservation, skills add/duplicate/hard delete, portfolio CRUD/soft delete, ownership; transaction rolled back.',
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
