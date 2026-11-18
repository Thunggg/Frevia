// Audit only: isolated fixtures, database transaction rolled back, external storage mocked.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const {
  RoleName,
  SocialPlatform,
  AddSocialLinkSchema,
  UpdateClientProfileSchema,
  ClientProfileDetailSchema,
} = require('@shared/types');
const {
  AccountProfileRepository,
} = require('../dist/src/routes/account-profile/account-profile.repo');
const {
  AccountProfileService,
} = require('../dist/src/routes/account-profile/account-profile.service');

async function main() {
  assert.ok(process.env.DIRECT_URL);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DIRECT_URL,
      max: 1,
      connectionTimeoutMillis: 10000,
    }),
  });
  const rollback = new Error('AUDIT_ROLLBACK');
  const results = [];
  const check = async (name, action) => {
    try {
      await action();
      results.push({ name, result: 'PASS' });
    } catch (error) {
      results.push({
        name,
        result: 'FAIL',
        reason: error.message.split('\n')[0],
      });
    }
  };
  try {
    await prisma.$transaction(
      async (tx) => {
        const fixture = async (roleName, nested = true) => {
          const role = await tx.role.findFirst({
            where: { name: roleName, deletedAt: null },
          });
          assert.ok(role);
          return tx.user.create({
            data: {
              email: `audit-${randomUUID()}@example.invalid`,
              userRoles: { create: { roleId: role.id, isPrimary: true } },
              profile: {
                create: {
                  displayName: 'Audit fixture',
                  bio: 'Audit biography',
                  profileCompletionPercent: 80,
                  ...(roleName === RoleName.CLIENT
                    ? {
                        clientProfile: {
                          create: { companyName: 'Audit company' },
                        },
                      }
                    : nested
                      ? { freelancerProfile: { create: { title: 'Engineer' } } }
                      : {}),
                },
              },
            },
            select: { id: true },
          });
        };
        const client = await fixture(RoleName.CLIENT);
        const freelancer = await fixture(RoleName.FREELANCER);
        const newFreelancer = await fixture(RoleName.FREELANCER, false);
        const database = new Proxy(tx, {
          get(target, key) {
            return key === '$transaction'
              ? (callback) => callback(tx)
              : target[key];
          },
        });
        const repository = new AccountProfileRepository(database);
        const service = new AccountProfileService(
          repository,
          {
            requiresManualReview: () => false,
            directUpdateResult: (profileStrength) => ({
              reviewRequired: false,
              profileStrength,
            }),
          },
          {
            isConfigured: () => true,
            uploadFile: async () => ({
              secure_url: 'https://example.invalid/audit-document.png',
            }),
          },
          {},
          {},
        );
        const file = {
          originalname: 'audit.png',
          mimetype: 'image/png',
          size: 8,
          buffer: Buffer.from('audit'),
        };
        await check('UC-18.02 no submission status', async () => {
          assert.equal(
            (await service.getIdentityStatus(freelancer.id)).status,
            null,
          );
        });
        await check(
          'UC-18.01 creates PENDING document and persists status',
          async () => {
            const document = await service.uploadIdentityDocument(
              freelancer.id,
              'ID_CARD',
              file,
            );
            assert.equal(document.status, 'PENDING');
            assert.equal(
              (await service.getIdentityStatus(freelancer.id)).status,
              'PENDING',
            );
          },
        );
        await check('UC-18.01 blocks a second PENDING submission', async () => {
          await assert.rejects(
            service.uploadIdentityDocument(freelancer.id, 'ID_CARD', file),
          );
        });
        await tx.idVerificationDocument.updateMany({
          where: { userId: freelancer.id },
          data: { status: 'APPROVED' },
        });
        await check(
          'UC-18.01 blocks an APPROVED account submission',
          async () => {
            await assert.rejects(
              service.uploadIdentityDocument(freelancer.id, 'ID_CARD', file),
            );
          },
        );
        await check('UC-18.01 rejects documents above 5 MB', async () => {
          await assert.rejects(
            service.uploadIdentityDocument(newFreelancer.id, 'ID_CARD', {
              ...file,
              size: 6 * 1024 * 1024,
            }),
          );
        });
        await check('UC-18.01 accepts WebP in manual upload', async () => {
          await service.uploadIdentityDocument(newFreelancer.id, 'ID_CARD', {
            ...file,
            mimetype: 'image/webp',
          });
        });
        await check(
          'UC-18.02 rejected status includes review notes',
          async () => {
            await tx.idVerificationDocument.updateMany({
              where: { userId: freelancer.id },
              data: {
                status: 'REJECTED',
                reviewNotes: 'Please provide a clearer image',
              },
            });
            const status = await service.getIdentityStatus(freelancer.id);
            assert.equal(status.status, 'REJECTED');
            assert.equal(
              status.documents[0].reviewNotes,
              'Please provide a clearer image',
            );
          },
        );
        await check(
          'UC-19.01 client response excludes sensitive user fields',
          async () => {
            const response = ClientProfileDetailSchema.parse(
              await service.getClientProfile(client.id),
            );
            assert.ok(!('user' in response));
          },
        );
        await check('UC-19.02 company update persists', async () => {
          await service.updateClientProfile(client.id, {
            companyName: 'Updated audit company',
            companyDescription: 'Description',
            website: 'https://example.com',
          });
          assert.equal(
            (await service.getClientProfile(client.id)).clientProfile
              .companyName,
            'Updated audit company',
          );
        });
        await check(
          'UC-19.02 rejects non-HTTP company URLs at validation',
          async () => {
            assert.equal(
              UpdateClientProfileSchema.safeParse({
                companyName: 'Company',
                website: 'javascript:alert(1)',
              }).success,
              false,
            );
          },
        );
        await check(
          'UC-20.01/02 social link add/list and duplicate rejection',
          async () => {
            await service.addSocialLink(client.id, {
              platform: SocialPlatform.GITHUB,
              url: 'https://github.com/example',
            });
            assert.equal((await service.getSocialLinks(client.id)).length, 1);
            await assert.rejects(
              service.addSocialLink(client.id, {
                platform: SocialPlatform.GITHUB,
                url: 'https://github.com/other',
              }),
              (error) => error.getStatus() === 409,
            );
          },
        );
        await check(
          'UC-20.02 rejects non-HTTP social URLs at validation',
          async () => {
            assert.equal(
              AddSocialLinkSchema.safeParse({
                platform: SocialPlatform.WEBSITE,
                url: 'javascript:alert(1)',
              }).success,
              false,
            );
          },
        );
        await check('UC-20.03 ownership check and hard deletion', async () => {
          const [link] = await service.getSocialLinks(client.id);
          await assert.rejects(
            service.deleteSocialLink(freelancer.id, link.id),
            (error) => error.getStatus() === 403,
          );
          await service.deleteSocialLink(client.id, link.id);
          assert.equal(
            await tx.socialLink.findUnique({ where: { id: link.id } }),
            null,
          );
        });
        await check(
          'UC-21.01/02 favorites add/list and duplicate rejection',
          async () => {
            await service.addFavorite(client.id, freelancer.id);
            assert.ok(
              (await service.getFavorites(client.id)).some(
                (item) => item.freelancerId === freelancer.id,
              ),
            );
            await assert.rejects(
              service.addFavorite(client.id, freelancer.id),
              (error) => error.getStatus() === 409,
            );
          },
        );
        await check(
          'UC-21.01 newly registered freelancer stays visible after favoriting',
          async () => {
            await service.addFavorite(client.id, newFreelancer.id);
            assert.ok(
              (await service.getFavorites(client.id)).some(
                (item) => item.freelancerId === newFreelancer.id,
              ),
            );
          },
        );
        await check('UC-21.03 favorite removal persists', async () => {
          await service.removeFavorite(client.id, freelancer.id);
          assert.equal(
            await repository.findFavorite(client.id, freelancer.id),
            null,
          );
        });
        throw rollback;
      },
      { timeout: 90000, maxWait: 10000 },
    );
  } catch (error) {
    if (error !== rollback) throw error;
  } finally {
    await prisma.$disconnect();
  }
  console.log(
    JSON.stringify(
      {
        rollback: true,
        storageAndAi: 'not tested; storage mocked',
        checks: results,
      },
      null,
      2,
    ),
  );
  if (results.some((item) => item.result === 'FAIL')) process.exitCode = 1;
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
