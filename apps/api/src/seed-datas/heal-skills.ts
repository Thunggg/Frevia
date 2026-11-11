import fs from 'fs';
import path from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

if (!process.env.DIRECT_URL) {
  console.log('Cannot find DIRECT_URL environment variable');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL,
  }),
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface TaxonomySkill {
  id: string;
  canonical: string;
  category: string;
  aliases?: string[];
}

function loadTaxonomy(): Map<string, TaxonomySkill> {
  const p = path.resolve(
    __dirname,
    '../../../../../section-aware-cv-job-matching/data/taxonomy/skills_taxonomy.json',
  );
  const raw = fs.readFileSync(p, 'utf-8');
  const data = JSON.parse(raw);
  const map = new Map<string, TaxonomySkill>();

  for (const s of data.skills as TaxonomySkill[]) {
    // Map both lower canonical and lower id
    map.set(s.canonical.toLowerCase().trim(), s);
    map.set(s.id.toLowerCase().trim(), s);
    if (s.aliases) {
      for (const a of s.aliases) {
        if (!map.has(a.toLowerCase().trim())) {
          map.set(a.toLowerCase().trim(), s);
        }
      }
    }
  }
  return map;
}

async function healSkills() {
  console.log('Starting Skills Healing Process...');
  const taxonomyMap = loadTaxonomy();
  console.log(`Loaded taxonomy reference entries.`);

  const allSkills = await prisma.skill.findMany({
    include: {
      _count: {
        select: {
          jobs: true,
          freelancerSkills: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  console.log(`Analyzing ${allSkills.length} skills in database...`);

  // Step 1: Assign safe unique temporary slugs to all skills to break any collision cycles
  console.log(
    'Step 1: Setting temporary slugs to avoid unique index collisions...',
  );
  for (const s of allSkills) {
    await prisma.skill.update({
      where: { id: s.id },
      data: { slug: `temp-heal-${s.id}` },
    });
  }

  // Step 2: Determine target canonical name and slug for each skill
  console.log('Step 2: Grouping skills by target slug...');
  const groupsByTargetSlug = new Map<
    string,
    {
      targetName: string;
      targetSlug: string;
      description?: string;
      members: typeof allSkills;
    }
  >();

  for (const s of allSkills) {
    const tax = taxonomyMap.get(s.name.toLowerCase().trim());
    let targetSlug: string;
    let targetName: string;
    let desc: string | undefined;

    if (tax) {
      targetSlug = tax.id;
      targetName = tax.canonical;
      const aliasesSummary = (tax.aliases || []).slice(0, 5).join(', ');
      desc = `[${tax.category}] ${tax.canonical}${aliasesSummary ? ` - Aliases: ${aliasesSummary}` : ''}`;
    } else {
      targetSlug = slugify(s.name) || `skill-${s.id}`;
      targetName = s.name.trim();
      desc = s.description || undefined;
    }

    if (!groupsByTargetSlug.has(targetSlug)) {
      groupsByTargetSlug.set(targetSlug, {
        targetName,
        targetSlug,
        description: desc,
        members: [],
      });
    }
    groupsByTargetSlug.get(targetSlug)!.members.push(s);
  }

  console.log(`Formed ${groupsByTargetSlug.size} distinct target slug groups.`);

  // Step 3: Deduplicate and merge references
  console.log('Step 3: Merging references and assigning correct slugs...');
  let mergedCount = 0;
  let updatedCount = 0;

  for (const [targetSlug, group] of groupsByTargetSlug.entries()) {
    // Sort members so the one with the most relations or lowest id becomes primary
    group.members.sort((a, b) => {
      const aRels = a._count.jobs + a._count.freelancerSkills;
      const bRels = b._count.jobs + b._count.freelancerSkills;
      if (bRels !== aRels) return bRels - aRels;
      return a.id - b.id;
    });

    const primary = group.members[0];
    const duplicates = group.members.slice(1);

    // Merge duplicates into primary
    for (const dup of duplicates) {
      // Re-point JobSkills
      const dupJobSkills = await prisma.jobSkill.findMany({
        where: { skillId: dup.id },
      });
      for (const js of dupJobSkills) {
        const existingPrimary = await prisma.jobSkill.findUnique({
          where: {
            jobId_skillId: {
              jobId: js.jobId,
              skillId: primary.id,
            },
          },
        });
        if (!existingPrimary) {
          await prisma.jobSkill.update({
            where: { jobId_skillId: { jobId: js.jobId, skillId: dup.id } },
            data: { skillId: primary.id },
          });
        } else {
          await prisma.jobSkill.delete({
            where: { jobId_skillId: { jobId: js.jobId, skillId: dup.id } },
          });
        }
      }

      // Re-point FreelancerSkills
      const dupFreelancerSkills = await prisma.freelancerSkill.findMany({
        where: { skillId: dup.id },
      });
      for (const fs of dupFreelancerSkills) {
        const existingPrimary = await prisma.freelancerSkill.findUnique({
          where: {
            freelancerProfileId_skillId: {
              freelancerProfileId: fs.freelancerProfileId,
              skillId: primary.id,
            },
          },
        });
        if (!existingPrimary) {
          await prisma.freelancerSkill.update({
            where: {
              freelancerProfileId_skillId: {
                freelancerProfileId: fs.freelancerProfileId,
                skillId: dup.id,
              },
            },
            data: { skillId: primary.id },
          });
        } else {
          await prisma.freelancerSkill.delete({
            where: {
              freelancerProfileId_skillId: {
                freelancerProfileId: fs.freelancerProfileId,
                skillId: dup.id,
              },
            },
          });
        }
      }

      // Delete the duplicate skill
      await prisma.skill.delete({ where: { id: dup.id } });
      mergedCount++;
    }

    // Set canonical name, slug and description on primary
    await prisma.skill.update({
      where: { id: primary.id },
      data: {
        name: group.targetName,
        slug: group.targetSlug,
        description: group.description,
      },
    });
    updatedCount++;
  }

  // Step 4: Ensure all 615 taxonomy skills exist
  console.log('Step 4: Ensuring all taxonomy canonical skills exist...');
  const taxonomyFilePath = path.resolve(
    __dirname,
    '../../../../../section-aware-cv-job-matching/data/taxonomy/skills_taxonomy.json',
  );
  const rawTaxonomy = fs.readFileSync(taxonomyFilePath, 'utf-8');
  const fullTaxonomy = JSON.parse(rawTaxonomy);

  let newlyAddedFromTaxonomy = 0;
  for (const item of fullTaxonomy.skills as TaxonomySkill[]) {
    const existing = await prisma.skill.findFirst({
      where: { slug: item.id },
    });
    if (!existing) {
      const aliasesSummary = (item.aliases || []).slice(0, 5).join(', ');
      await prisma.skill.create({
        data: {
          name: item.canonical,
          slug: item.id,
          description: `[${item.category}] ${item.canonical}${aliasesSummary ? ` - Aliases: ${aliasesSummary}` : ''}`,
        },
      });
      newlyAddedFromTaxonomy++;
    }
  }

  const finalTotal = await prisma.skill.count();
  console.log('\n--- Healing Process Completed ---');
  console.log(`  Updated / normalized skills: ${updatedCount}`);
  console.log(`  Merged & removed duplicate skills: ${mergedCount}`);
  console.log(`  Newly added from taxonomy: ${newlyAddedFromTaxonomy}`);
  console.log(`  Total clean skills in DB: ${finalTotal}`);
}

healSkills()
  .catch((err) => {
    console.error('Failed to heal skills:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
