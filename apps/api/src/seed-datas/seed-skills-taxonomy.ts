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

interface TaxonomySkill {
  id: string;
  canonical: string;
  category: string;
  aliases?: string[];
  aliases_vi?: string[];
  related?: string[];
}

interface TaxonomyFile {
  version: string;
  skills: TaxonomySkill[];
}

function resolveTaxonomyPath(): string {
  const candidatePaths = [
    path.resolve(
      __dirname,
      '../../../../../section-aware-cv-job-matching/data/taxonomy/skills_taxonomy.json',
    ),
    path.resolve(
      __dirname,
      '../../../../../section-aware-cv-job-matching/src/cvjd/data/taxonomy/skills_taxonomy.json',
    ),
    path.resolve(
      __dirname,
      '../../../../section-aware-cv-job-matching/data/taxonomy/skills_taxonomy.json',
    ),
    path.resolve(
      process.cwd(),
      '../../section-aware-cv-job-matching/data/taxonomy/skills_taxonomy.json',
    ),
    path.resolve(
      process.cwd(),
      '../section-aware-cv-job-matching/data/taxonomy/skills_taxonomy.json',
    ),
    path.resolve(
      process.cwd(),
      'section-aware-cv-job-matching/data/taxonomy/skills_taxonomy.json',
    ),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error(
    `Cannot find skills_taxonomy.json in any expected location: ${candidatePaths.join(', ')}`,
  );
}

async function seedSkillsTaxonomy() {
  const taxonomyPath = resolveTaxonomyPath();
  console.log(`Reading Skill Taxonomy from: ${taxonomyPath}`);

  const raw = fs.readFileSync(taxonomyPath, 'utf-8');
  const taxonomyData: TaxonomyFile = JSON.parse(raw);
  const skills = taxonomyData.skills;

  console.log(
    `Loaded ${skills.length} skills from taxonomy (version: ${taxonomyData.version}).`,
  );

  // Lấy các skill hiện có trong database
  const existingSkills = await prisma.skill.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  const existingSlugMap = new Map(existingSkills.map((s) => [s.slug, s]));
  const existingNameMap = new Map(
    existingSkills.map((s) => [s.name.toLowerCase().trim(), s]),
  );

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  // Xử lý từng kỹ năng
  for (const s of skills) {
    const slug = s.id.trim();
    const name = s.canonical.trim();
    const aliasesSummary = (s.aliases || []).slice(0, 5).join(', ');
    const desc = `[${s.category}] ${s.canonical}${aliasesSummary ? ` - Aliases: ${aliasesSummary}` : ''}`;

    const existingBySlug = existingSlugMap.get(slug);
    const existingByName = existingNameMap.get(name.toLowerCase());

    if (!existingBySlug && !existingByName) {
      // Kỹ năng mới hoàn toàn
      await prisma.skill.create({
        data: {
          name,
          slug,
          description: desc,
        },
      });
      createdCount++;
    } else if (existingBySlug) {
      // Cập nhật description hoặc name chuẩn hóa nếu cần
      if (
        existingBySlug.name !== name ||
        !existingSkills.find((item) => item.id === existingBySlug.id)
      ) {
        await prisma.skill.update({
          where: { id: existingBySlug.id },
          data: {
            description: desc,
          },
        });
        updatedCount++;
      } else {
        skippedCount++;
      }
    } else {
      skippedCount++;
    }
  }

  const totalInDb = await prisma.skill.count({ where: { deletedAt: null } });

  console.log('\n--- Sync Skills Taxonomy Results ---');
  console.log(`  Newly created skills: ${createdCount}`);
  console.log(`  Updated skills:       ${updatedCount}`);
  console.log(`  Already in sync:      ${skippedCount}`);
  console.log(`  Total active in DB:   ${totalInDb}`);
}

seedSkillsTaxonomy()
  .catch((err) => {
    console.error('Failed to seed skills taxonomy:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

