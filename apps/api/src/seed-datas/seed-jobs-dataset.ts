/**
 * Seed job t�?dataset `data/Cleaned_DS_Jobs.csv` (660 dòng job Data/Analytics).
 *
 * - Dedupe theo title + company + description.
 * - Lấy mẫu 200 job, phân b�?đều theo `job_simp` (có seed c�?định => chạy lại cho kết qu�?giống nhau).
 * - Mỗi job gắn 1 danh mục (Data & AI / Machine Learning & AI / Database & Data Engineering)
 *   dựa trên `Job Title` và `job_simp`.
 * - Budget = 20% lương năm trong CSV (budgetType ch�?có FIXED_PRICE).
 * - Tạo user Client + ClientProfile cho mỗi công ty trong dataset.
 * - Idempotent: chạy lại s�?update theo slug, không tạo trùng.
 *
 * Chạy: npm run seed:jobs-dataset
 */
import { PrismaPg } from '@prisma/adapter-pg';
import {
  BudgetType,
  JobStatus,
  PrismaClient,
  type Prisma,
} from '@prisma/client';
import { RoleName } from '@shared/types';
import { existsSync, readFileSync } from 'node:fs';
import 'dotenv/config';
import path from 'node:path';
import { HashingService } from '../shared/services/hashing.service';

if (!process.env.DIRECT_URL) {
  console.log('Cannot find DB URL');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

const hashingService = new HashingService();

// ==================== Cấu hình ====================

const CSV_RELATIVE_PATHS = [
  '../../data/Cleaned_DS_Jobs.csv',
  '../data/Cleaned_DS_Jobs.csv',
  'data/Cleaned_DS_Jobs.csv',
];

const TARGET_JOB_COUNT = 200;
const SAMPLE_SEED = 20260926;
const CREATED_AT_SPREAD_DAYS = 60;
const DEADLINE_DAYS = 14;
const EXPIRY_DAYS = 30;
/** Ngân sách d�?án = 20% lương năm trong CSV. */
const BUDGET_RATE = 0.2;
const DESCRIPTION_MAX_LENGTH = 6000;
const FEATURED_EVERY = 10;
const FALLBACK_PASSWORD = 'Password@123';

// Danh mục dùng cho dataset (tra cứu theo tên, không ph�?thuộc slug �?// "Machine Learning & AI" đang gi�?slug legacy `ai-machine-learning`).
const CATEGORY_DATA_AI = 'Data & AI';
const CATEGORY_ML_AI = 'Machine Learning & AI';
const CATEGORY_DATA_ENGINEERING = 'Database & Data Engineering';

/** Cột c�?k�?năng trong CSV -> tên skill trong catalog. */
const SKILL_FLAG_TO_NAME: Record<string, string> = {
  python: 'Python',
  excel: 'Excel',
  hadoop: 'Hadoop',
  spark: 'Spark',
  aws: 'AWS',
  tableau: 'Tableau',
  big_data: 'Big Data',
};

/** Skill b�?sung dựa trên danh mục của job. */
const CATEGORY_EXTRA_SKILLS: Record<string, string[]> = {
  [CATEGORY_ML_AI]: ['Machine Learning'],
};

// ==================== Kiểu d�?liệu CSV ====================

type DatasetRow = {
  title: string;
  description: string;
  company: string;
  industry: string;
  sector: string;
  companySize: string;
  ownership: string;
  headquarters: string;
  jobState: string;
  minSalary: number;
  maxSalary: number;
  avgSalary: number;
  jobSimp: string;
  seniority?: string;
  skillFlags: string[];
};

// ==================== Tiện ích ====================

function resolveCsvPath(): string {
  for (const relativePath of CSV_RELATIVE_PATHS) {
    const candidate = path.resolve(process.cwd(), relativePath);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(
    `Cannot find Cleaned_DS_Jobs.csv. Looked in: ${CSV_RELATIVE_PATHS.join(', ')}`,
  );
}

/** Parser CSV chuẩn RFC 4180: h�?tr�?quote, escaped quote, comma và newline trong ô. */
function parseCsv(content: string): string[][] {
  const text = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
          continue;
        }
        inQuotes = false;
        continue;
      }
      field += char;
      continue;
    }

    if (char === '"' && field.length === 0) {
      inQuotes = true;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }
    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Hash FNV-1a base36 đ�?tạo hậu t�?email ổn định cho tên công ty. */
function hash36(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

/** Mulberry32: shuffle ổn định đ�?seed chạy lại vẫn chọn đúng tập job. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    [result[index], result[swapWith]] = [result[swapWith], result[index]];
  }
  return result;
}

function toNumber(value: string | undefined): number {
  const parsed = Number.parseFloat((value ?? '').trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/** Sentinel -1 / Unknown / rỗng trong dataset => undefined. */
function clean(value: string | undefined): string | undefined {
  const trimmed = (value ?? '').trim();
  if (
    !trimmed ||
    trimmed === '-1' ||
    trimmed.toLowerCase() === 'unknown' ||
    trimmed.toLowerCase() === 'na'
  ) {
    return undefined;
  }
  return trimmed;
}

function normalizeDescription(value: string): string {
  const text = value
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (text.length <= DESCRIPTION_MAX_LENGTH) {
    return text;
  }

  const clipped = text.slice(0, DESCRIPTION_MAX_LENGTH);
  const lastBreak = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastBreak > 0 ? lastBreak : clipped.length).trimEnd()}…`;
}

// ==================== Đọc & chuẩn hoá dataset ====================

function readDataset(csvPath: string): DatasetRow[] {
  const rows = parseCsv(readFileSync(csvPath, 'utf-8'));
  const header = rows[0]?.map((column) => column.trim());
  if (!header) {
    throw new Error('CSV is empty');
  }

  const columnIndex = new Map<string, number>();
  header.forEach((column, index) => columnIndex.set(column, index));

  const requiredColumns = [
    'Job Title',
    'Job Description',
    'Company Name',
    'Location',
    'Headquarters',
    'Size',
    'Type of ownership',
    'Industry',
    'Sector',
    'min_salary',
    'max_salary',
    'avg_salary',
    'job_simp',
    'seniority',
  ];
  const missing = requiredColumns.filter((column) => !columnIndex.has(column));
  if (missing.length > 0) {
    throw new Error(`CSV is missing columns: ${missing.join(', ')}`);
  }

  const get = (row: string[], column: string): string =>
    row[columnIndex.get(column) ?? -1] ?? '';

  const dataset: DatasetRow[] = [];
  const seen = new Set<string>();

  for (const raw of rows.slice(1)) {
    const title = clean(get(raw, 'Job Title'));
    const description = clean(get(raw, 'Job Description'));
    const company = clean(get(raw, 'Company Name'));
    if (!title || !description || !company) {
      continue;
    }

    const key = `${title}|${company}|${description}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    dataset.push({
      title: title.slice(0, 255),
      description,
      company,
      industry: clean(get(raw, 'Industry')) ?? 'Not specified',
      sector: clean(get(raw, 'Sector')) ?? 'Not specified',
      companySize: clean(get(raw, 'Size')) ?? 'Not specified',
      ownership: clean(get(raw, 'Type of ownership')) ?? 'Not specified',
      headquarters:
        clean(get(raw, 'Headquarters')) ??
        clean(get(raw, 'Location')) ??
        'Remote',
      jobState: clean(get(raw, 'job_state')) ?? '',
      minSalary: toNumber(get(raw, 'min_salary')),
      maxSalary: toNumber(get(raw, 'max_salary')),
      avgSalary: toNumber(get(raw, 'avg_salary')),
      jobSimp: (clean(get(raw, 'job_simp')) ?? 'na').toLowerCase(),
      seniority: clean(get(raw, 'seniority')),
      skillFlags: Object.keys(SKILL_FLAG_TO_NAME).filter(
        (flag) => get(raw, flag).trim() === '1',
      ),
    });
  }

  return dataset;
}

/** Lấy mẫu N job, phân b�?đều theo job_simp. */
function sampleJobs(dataset: DatasetRow[], count: number): DatasetRow[] {
  const random = createRandom(SAMPLE_SEED);
  const groups = new Map<string, DatasetRow[]>();

  for (const row of dataset) {
    const group = groups.get(row.jobSimp) ?? [];
    group.push(row);
    groups.set(row.jobSimp, group);
  }

  const groupKeys = [...groups.keys()].sort();
  for (const key of groupKeys) {
    groups.set(key, shuffle(groups.get(key)!, random));
  }

  const sampled: DatasetRow[] = [];
  let progress = true;
  while (sampled.length < count && progress) {
    progress = false;
    for (const key of groupKeys) {
      const group = groups.get(key)!;
      const next = group.shift();
      if (!next) {
        continue;
      }
      progress = true;
      sampled.push(next);
      if (sampled.length >= count) {
        break;
      }
    }
  }

  return sampled;
}

// ==================== Nghiệp v�?====================

function resolveCategoryName(row: DatasetRow): string {
  const title = row.title.toLowerCase();

  if (
    /machine learning|deep learning|artificial intelligence|\bml\b|\bai\b|\bnlp\b|\bllm\b/.test(
      title,
    )
  ) {
    return CATEGORY_ML_AI;
  }
  if (
    /data engineer|data engineering|\betl\b|big data|data warehouse|\bdataplatform\b/.test(
      title,
    )
  ) {
    return CATEGORY_DATA_ENGINEERING;
  }

  switch (row.jobSimp) {
    case 'mle':
      return CATEGORY_ML_AI;
    case 'data engineer':
      return CATEGORY_DATA_ENGINEERING;
    default:
      return CATEGORY_DATA_AI;
  }
}

function buildSkills(row: DatasetRow, categoryName: string): string[] {
  const names = row.skillFlags.map((flag) => SKILL_FLAG_TO_NAME[flag]);
  names.push(...(CATEGORY_EXTRA_SKILLS[categoryName] ?? []));
  return [...new Set(names)];
}

function calculateBudget(row: DatasetRow): {
  budgetMin: number | null;
  budgetMax: number | null;
} {
  const min = Math.round(row.minSalary * 1000 * BUDGET_RATE);
  const max = Math.round(row.maxSalary * 1000 * BUDGET_RATE);
  return {
    budgetMin: min > 0 ? min : null,
    budgetMax: max > min ? max : min > 0 ? min : null,
  };
}

async function loadCategoryIds(): Promise<Map<string, number>> {
  const names = [CATEGORY_DATA_AI, CATEGORY_ML_AI, CATEGORY_DATA_ENGINEERING];
  const categories = await prisma.jobCategory.findMany({
    where: { name: { in: names, mode: 'insensitive' }, deletedAt: null },
    select: { id: true, name: true },
  });

  const categoryIds = new Map(
    categories.map((item) => [item.name.toLowerCase(), item.id]),
  );
  const missing = names.filter((name) => !categoryIds.has(name.toLowerCase()));
  if (missing.length > 0) {
    throw new Error(
      `Missing job categories: ${missing.join(', ')}. Run "npm run seed:job-categories" first.`,
    );
  }
  return categoryIds;
}

/** Đảm bảo các skill dùng trong dataset tồn tại, tr�?v�?map slug -> id. */
async function ensureSkills(
  skillNames: string[],
): Promise<Map<string, number>> {
  const wanted = [...new Set(skillNames)];
  const slugs = wanted.map(slugify);

  const existing = await prisma.skill.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  });

  const skillMap = new Map(existing.map((skill) => [skill.slug, skill.id]));
  const missing = wanted.filter((_, index) => !skillMap.has(slugs[index]));

  if (missing.length > 0) {
    await prisma.skill.createMany({
      data: missing.map((name, index) => ({ name, slug: slugs[index] })),
      skipDuplicates: true,
    });
    const created = await prisma.skill.findMany({
      where: { slug: { in: missing.map((_, index) => slugs[index]) } },
      select: { id: true, slug: true },
    });
    for (const skill of created) {
      skillMap.set(skill.slug, skill.id);
    }
  }

  return skillMap;
}

/** Mỗi công ty trong dataset tr�?thành 1 client (user + profile + clientProfile). */
async function ensureClients(
  companies: string[],
  rowsByCompany: Map<string, DatasetRow>,
  clientRoleId: number,
  passwordHash: string,
): Promise<Map<string, number>> {
  const clientIds = new Map<string, number>();

  for (const company of companies) {
    const email = `${slugify(company).slice(0, 50) || 'company'}-${hash36(company)}@seed.local`;
    const sample = rowsByCompany.get(company)!;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (user) {
      clientIds.set(company, user.id);
      continue;
    }

    const companyDescription = [
      `${company} is hiring for data and analytics positions.`,
      `Industry: ${sample.industry}. Sector: ${sample.sector}.`,
      `Company size: ${sample.companySize}. Ownership: ${sample.ownership}.`,
      `Headquarters: ${sample.headquarters}.`,
    ].join(' ');

    const created = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        isBanned: false,
        userRoles: {
          create: { roleId: clientRoleId, isPrimary: true },
        },
        profile: {
          create: {
            displayName: company,
            bio: `${company} works with freelance specialists on analytics, data platform and AI projects.`,
            profileCompletionPercent: 80,
            clientProfile: {
              create: {
                companyName: company,
                companyDescription,
                website: `https://example.com/`,
              },
            },
          },
        },
      },
      select: { id: true },
    });

    clientIds.set(company, created.id);
  }

  return clientIds;
}

// ==================== Main ====================

async function main() {
  const csvPath = resolveCsvPath();
  console.log(`Reading dataset: ${csvPath}`);

  const dataset = readDataset(csvPath);
  console.log(`Dataset rows after dedupe: ${dataset.length}`);

  const sampled = sampleJobs(dataset, TARGET_JOB_COUNT);
  console.log(`Sampled jobs: ${sampled.length}`);

  const clientRole = await prisma.role.findFirst({
    where: { name: RoleName.CLIENT, deletedAt: null },
    select: { id: true },
  });
  if (!clientRole) {
    throw new Error('Role "Client" not found. Run "npm run seed" first.');
  }

  const categoryIds = await loadCategoryIds();

  const prepared = sampled.map((row) => {
    const categoryName = resolveCategoryName(row);
    return {
      row,
      categoryId: categoryIds.get(categoryName.toLowerCase())!,
      categoryName,
      skills: buildSkills(row, categoryName),
    };
  });

  const skillMap = await ensureSkills(prepared.flatMap((item) => item.skills));
  console.log(`Skills available: ${skillMap.size}`);

  const companies = [...new Set(sampled.map((row) => row.company))];
  const rowsByCompany = new Map<string, DatasetRow>();
  for (const row of sampled) {
    if (!rowsByCompany.has(row.company)) {
      rowsByCompany.set(row.company, row);
    }
  }

  const seedPassword = process.env.SEED_CLIENT_PASSWORD ?? FALLBACK_PASSWORD;
  const passwordHash = await hashingService.hash(seedPassword);
  const clientIds = await ensureClients(
    companies,
    rowsByCompany,
    clientRole.id,
    passwordHash,
  );
  console.log(`Clients ready: ${clientIds.size}`);

  const usedSlugs = new Set<string>();
  const stats = {
    created: 0,
    updated: 0,
    categoryCount: new Map<string, number>(),
    stateCount: new Map<string, number>(),
  };

  const now = Date.now();

  for (const [index, item] of prepared.entries()) {
    const { row, categoryId, categoryName } = item;
    const clientId = clientIds.get(row.company)!;

    const baseSlug =
      slugify(`${row.title}-${row.company}`).slice(0, 240) ||
      `dataset-job-${index + 1}`;
    let slug = baseSlug;
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);

    const { budgetMin, budgetMax } = calculateBudget(row);
    const createdAt = new Date(
      now - (index % CREATED_AT_SPREAD_DAYS) * 24 * 60 * 60 * 1000,
    );
    const skillIds = [
      ...new Set(
        item.skills
          .map((name) => skillMap.get(slugify(name)))
          .filter((id): id is number => typeof id === 'number'),
      ),
    ];

    const jobData: Prisma.JobUncheckedCreateInput = {
      clientId,
      title: row.title,
      slug,
      description: normalizeDescription(row.description),
      budgetMin,
      budgetMax,
      budgetType: BudgetType.FIXED_PRICE,
      deadline: new Date(createdAt.getTime() + DEADLINE_DAYS * 86_400_000),
      expiryDate: new Date(createdAt.getTime() + EXPIRY_DAYS * 86_400_000),
      status: JobStatus.OPEN,
      featured: index % FEATURED_EVERY === 0,
      createdAt,
    };

    const existing = await prisma.job.findUnique({
      where: { slug },
      select: { id: true },
    });

    const jobId = existing
      ? await (async () => {
          const updated = await prisma.job.update({
            where: { id: existing.id },
            data: {
              ...jobData,
              createdAt: undefined,
              deletedAt: null,
            },
          });
          return updated.id;
        })()
      : await prisma.job
          .create({
            data: {
              ...jobData,
              skills: { create: skillIds.map((skillId) => ({ skillId })) },
              jobCategories: { create: [{ categoryId }] },
            },
            select: { id: true },
          })
          .then((job) => job.id);

    if (existing) {
      stats.updated += 1;
      await prisma.jobSkill.createMany({
        data: skillIds.map((skillId) => ({ jobId, skillId })),
        skipDuplicates: true,
      });
      await prisma.jobJobCategory.createMany({
        data: [{ jobId, categoryId }],
        skipDuplicates: true,
      });
    } else {
      stats.created += 1;
    }

    stats.categoryCount.set(
      categoryName,
      (stats.categoryCount.get(categoryName) ?? 0) + 1,
    );
    if (row.jobState) {
      stats.stateCount.set(
        row.jobState,
        (stats.stateCount.get(row.jobState) ?? 0) + 1,
      );
    }
  }

  const formatCount = (map: Map<string, number>): string =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');

  console.log('');
  console.log(`Jobs created: ${stats.created}`);
  console.log(`Jobs updated: ${stats.updated}`);
  console.log(`Categories: ${formatCount(stats.categoryCount)}`);
  console.log(`Top states: ${formatCount(stats.stateCount)}`);
  console.log(`Sample client login: <company-slug>-<hash>@seed.local`);
  console.log('Seed dataset jobs completed!');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
