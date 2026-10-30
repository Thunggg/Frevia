/**
 * Seed freelancer từ dataset `data/UpdatedResumeDataSet.csv` (962 dòng CV, 25 nhóm nghề).
 *
 * - Dedupe theo nội dung resume: dataset chỉ có 166 resume duy nhất (phần còn lại
 *   là bản sao lặp), nên thực tế seed tối đa 166 freelancer.
 * - Lấy mẫu phân bổ đều theo `Category` (seed cố định => chạy lại cho kết quả giống nhau).
 * - Mỗi resume tạo 1 user (role Freelancer) + Profile + FreelancerProfile.
 * - Email dạng người thật `firstname.lastname@gmail.com` (trùng tên thì thêm số).
 * - Parse 3 khối có cấu trúc trong CV: `Education Details`, `Skill Details`,
 *   `Company Details` để dựng education / skills / experience.
 * - Skill được map vào catalog `Skill`; proficiency (1-10) suy ra từ số tháng
 *   kinh nghiệm ghi trong `Skill Details`.
 * - Sinh file PDF CV thật cho mỗi freelancer, lưu `uploads/cvs/<userId>/<hash>.pdf`
 *   và gắn vào `FreelancerProfile.cvUrl` (`local://...`) + `cvFileName`.
 * - Idempotent: email tất định theo thứ tự sinh nên chạy lại chỉ update, không
 *   tạo trùng; user email seed cũ (`resume-...@seed.local`) được đổi sang email mới.
 *
 * Chạy: pnpm --filter api seed:freelancers-dataset
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { AvailabilityStatus, PrismaClient } from '@prisma/client';
import { RoleName } from '@shared/types';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
  '../../data/UpdatedResumeDataSet.csv',
  '../data/UpdatedResumeDataSet.csv',
  'data/UpdatedResumeDataSet.csv',
];

const TARGET_FREELANCER_COUNT = 200;
const SAMPLE_SEED = 20261013;
const CREATED_AT_SPREAD_DAYS = 90;
const FALLBACK_PASSWORD = 'Password@123';
const MAX_SKILLS_PER_FREELANCER = 8;
const MAX_EXPERIENCES_PER_FREELANCER = 4;
const MAX_EDUCATIONS_PER_FREELANCER = 3;
const MAX_CERTIFICATIONS_PER_FREELANCER = 3;
const EXPERIENCE_DESCRIPTION_MAX_LENGTH = 1200;
const BIO_MAX_LENGTH = 500;

// ==================== Tiện ích ====================

function resolveCsvPath(): string {
  for (const relativePath of CSV_RELATIVE_PATHS) {
    const candidate = path.resolve(process.cwd(), relativePath);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(
    `Cannot find UpdatedResumeDataSet.csv. Looked in: ${CSV_RELATIVE_PATHS.join(', ')}`,
  );
}

/** Parser CSV chuẩn RFC 4180: hỗ trợ quote, escaped quote, comma và newline trong ô. */
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

/** Hash FNV-1a base36 để tạo khoá ổn định theo nội dung resume. */
function hash36(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

/** Mulberry32: chọn mẫu / tên ổn định để seed chạy lại cho kết quả giống nhau. */
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

function truncate(value: string, maxLength: number): string {
  const text = value.trim();
  if (text.length <= maxLength) {
    return text;
  }
  const clipped = text.slice(0, maxLength);
  const lastBreak = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastBreak > 0 ? lastBreak : clipped.length).trimEnd()}…`;
}

/**
 * Chuẩn hoá text resume: bỏ CR, thay ký tự ngoài ASCII (bullet lỗi mã hoá,
 * ký tự đặc biệt) bằng khoảng trắng, gộp khoảng trắng thừa.
 */
function normalizeText(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[^\n\x20-\x7e]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/(\s+|\/|-)/)
    .map((part) => {
      if (!part.trim() || /^(\s+|\/|-)$/.test(part)) {
        return part;
      }
      if (/^[a-z]{1,3}\d*$/.test(part) && part.length <= 3) {
        return part.toUpperCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

/** Title trong CV thường viết hoa toàn bộ; chỉ title-case khi thật sự all-caps. */
function formatTitle(value: string): string {
  const cleaned = value.trim();
  return cleaned === cleaned.toUpperCase() ? toTitleCase(cleaned) : cleaned;
}

// ==================== Kiểu dữ liệu CV ====================

type ResumeRow = {
  category: string;
  title: string;
  resume: string;
};

type ParsedSkill = {
  name: string;
  slug: string;
  months: number;
};

type ParsedExperience = {
  company: string;
  description: string;
};

// ==================== Đọc & chuẩn hoá dataset ====================

function readDataset(csvPath: string): ResumeRow[] {
  const rows = parseCsv(readFileSync(csvPath, 'utf-8'));
  const header = rows[0]?.map((column) => column.trim());
  if (!header) {
    throw new Error('CSV is empty');
  }

  const categoryIndex = header.indexOf('Category');
  const resumeIndex = header.indexOf('Resume');
  if (categoryIndex < 0 || resumeIndex < 0) {
    throw new Error('CSV is missing "Category" or "Resume" columns');
  }

  const dataset: ResumeRow[] = [];
  const seen = new Set<string>();

  for (const raw of rows.slice(1)) {
    const category = (raw[categoryIndex] ?? '').trim();
    const resume = normalizeText(raw[resumeIndex] ?? '');
    if (!category || !resume || !resume.includes('Skill Details')) {
      continue;
    }

    const key = hash36(resume);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    dataset.push({ category, title: extractTitle(resume, category), resume });
  }

  return dataset;
}

/** Lấy mẫu N resume, phân bổ đều theo Category. */
function sampleByCategory(dataset: ResumeRow[], count: number): ResumeRow[] {
  const random = createRandom(SAMPLE_SEED);
  const groups = new Map<string, ResumeRow[]>();

  for (const row of dataset) {
    const group = groups.get(row.category) ?? [];
    group.push(row);
    groups.set(row.category, group);
  }

  const groupKeys = [...groups.keys()].sort();
  for (const key of groupKeys) {
    groups.set(key, shuffle(groups.get(key)!, random));
  }

  const sampled: ResumeRow[] = [];
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

// ==================== Parse các khối trong CV ====================

const EDUCATION_KEYWORDS =
  /(b\.?e\b|b\.?tech|b\.?sc|m\.?sc|m\.?tech|b\.?ca|m\.?ca|mba|b\.?com|m\.?com|bba|b\.?a\b|m\.?a\b|diploma|bachelor|master|ph\.?d|ll\.?b|h\.?s\.?c|s\.?s\.?c|sslc|12th|10th|higher secondary|matriculation|university|college|school|institute|academy|polytechnic|graduat)/i;

function extractTitle(resume: string, category: string): string {
  const skillIndex = resume.indexOf('Skill Details');
  const educationIndex = resume.lastIndexOf('Education Details', skillIndex);
  if (skillIndex < 0 || educationIndex < 0) {
    return formatTitle(category);
  }

  const block = resume.slice(
    educationIndex + 'Education Details'.length,
    skillIndex,
  );
  for (const line of block.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || EDUCATION_KEYWORDS.test(trimmed)) {
      continue;
    }
    return formatTitle(truncate(trimmed, 255));
  }

  return formatTitle(category);
}

function parseEducation(resume: string): string[] {
  const skillIndex = resume.indexOf('Skill Details');
  const educationIndex = resume.lastIndexOf('Education Details', skillIndex);
  if (skillIndex < 0 || educationIndex < 0) {
    return [];
  }

  const block = resume.slice(
    educationIndex + 'Education Details'.length,
    skillIndex,
  );
  const results: string[] = [];
  const seen = new Set<string>();

  for (const line of block.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || !EDUCATION_KEYWORDS.test(trimmed)) {
      continue;
    }
    const cleaned = truncate(trimmed, 200);
    if (seen.has(cleaned)) {
      continue;
    }
    seen.add(cleaned);
    results.push(cleaned);
  }

  return results.slice(0, MAX_EDUCATIONS_PER_FREELANCER);
}

function parseSkills(resume: string): ParsedSkill[] {
  const skillIndex = resume.indexOf('Skill Details');
  const companyIndex = resume.indexOf('Company Details', skillIndex);
  if (skillIndex < 0 || companyIndex < 0) {
    return [];
  }

  const block = resume.slice(skillIndex + 'Skill Details'.length, companyIndex);

  const bySlug = new Map<string, ParsedSkill>();
  for (const line of block.split('\n')) {
    const match = /^(.+?)\s*-\s*ex(?:prience|perience)\s*-\s*(.+)$/i.exec(
      line.trim(),
    );
    if (!match) {
      continue;
    }

    const months = parseMonths(match[2]);
    const names = match[1]
      .split(',')
      .map((name) => name.replace(/[.\s]+$/, '').trim())
      .filter((name) => name.length >= 2 && name.length <= 60);

    for (const name of names) {
      const slug = slugify(name);
      if (!slug) {
        continue;
      }
      const existing = bySlug.get(slug);
      if (existing) {
        existing.months = Math.max(existing.months, months);
        continue;
      }
      bySlug.set(slug, { name: toTitleCase(name), slug, months });
    }
  }

  return [...bySlug.values()].slice(0, MAX_SKILLS_PER_FREELANCER);
}

function parseMonths(value: string): number {
  const text = value.toLowerCase();
  if (/less than 1 year|less than a year/.test(text)) {
    return 1;
  }
  const monthMatch = /(\d+)\s*(?:month|months|month's)/.exec(text);
  if (monthMatch) {
    return Number.parseInt(monthMatch[1], 10) || 1;
  }
  const yearMatch = /(\d+)\s*(?:year|years|year's)/.exec(text);
  if (yearMatch) {
    return (Number.parseInt(yearMatch[1], 10) || 1) * 12;
  }
  return 1;
}

/** Quy đổi số tháng kinh nghiệm -> proficiency 1-10. */
function proficiencyFromMonths(months: number): number {
  if (months >= 120) return 10;
  if (months >= 96) return 9;
  if (months >= 72) return 8;
  if (months >= 60) return 7;
  if (months >= 48) return 6;
  if (months >= 36) return 5;
  if (months >= 24) return 4;
  if (months >= 12) return 3;
  if (months >= 6) return 2;
  return 1;
}

function parseExperiences(resume: string, title: string): ParsedExperience[] {
  const companyIndex = resume.indexOf('Company Details');
  if (companyIndex < 0) {
    return [];
  }

  const block = resume.slice(companyIndex + 'Company Details'.length);
  const experiences: { company: string; description: string[] }[] = [];
  let current: { company: string; description: string[] } | null = null;

  for (const line of block.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const companyMatch = /^company\s*-\s*(.*)$/i.exec(trimmed);
    if (companyMatch) {
      if (current) {
        experiences.push(current);
      }
      current = { company: companyMatch[1].trim(), description: [] };
      continue;
    }

    const descriptionMatch = /^description\s*-\s*(.*)$/i.exec(trimmed);
    if (descriptionMatch && current) {
      if (descriptionMatch[1].trim()) {
        current.description.push(descriptionMatch[1].trim());
      }
      continue;
    }

    if (current) {
      current.description.push(trimmed);
    }
  }
  if (current) {
    experiences.push(current);
  }

  return experiences
    .map((item) => ({
      company: truncate(item.company, 150),
      description: truncate(
        item.description.join(' '),
        EXPERIENCE_DESCRIPTION_MAX_LENGTH,
      ),
    }))
    .filter((item) => item.company.length > 0)
    .slice(0, MAX_EXPERIENCES_PER_FREELANCER)
    .map((item) => ({
      company: item.company,
      description: item.description || `Worked as ${truncate(title, 150)}.`,
    }));
}

function parseCertifications(resume: string): string[] {
  const results: string[] = [];
  const seen = new Set<string>();

  for (const line of resume.split('\n')) {
    if (!/certif/i.test(line)) {
      continue;
    }
    const cleaned = truncate(line.replace(/^[^a-z0-9]*/i, '').trim(), 200);
    if (cleaned.length < 4 || seen.has(cleaned)) {
      continue;
    }
    seen.add(cleaned);
    results.push(cleaned);
    if (results.length >= MAX_CERTIFICATIONS_PER_FREELANCER) {
      break;
    }
  }

  return results;
}

function parseLanguages(resume: string): string[] {
  const languages = ['English — Professional'];
  const extras: [RegExp, string][] = [
    [/hindi/i, 'Hindi — Native'],
    [/marathi/i, 'Marathi — Native'],
    [/tamil/i, 'Tamil — Native'],
    [/telugu/i, 'Telugu — Native'],
    [/german/i, 'German — Basic'],
  ];

  for (const [pattern, label] of extras) {
    if (pattern.test(resume) && !languages.includes(label)) {
      languages.push(label);
    }
  }

  return languages;
}

// ==================== Tên hiển thị ====================

const FIRST_NAMES = [
  'Aarav',
  'Vivaan',
  'Aditya',
  'Ananya',
  'Diya',
  'Ishaan',
  'Kavya',
  'Rohan',
  'Meera',
  'Arjun',
  'Priya',
  'Karan',
  'Sneha',
  'Rahul',
  'Neha',
  'Vikram',
  'Pooja',
  'Siddharth',
  'Riya',
  'Manish',
  'Divya',
  'Nikhil',
  'Shreya',
  'Amit',
  'Ritika',
  'Sandeep',
  'Tanvi',
  'Varun',
  'Ayesha',
  'Harsh',
  'Nisha',
  'Yash',
  'Anjali',
  'Gaurav',
  'Payal',
  'Suresh',
  'Lakshmi',
  'Deepak',
  'Swati',
  'Kunal',
];

const LAST_NAMES = [
  'Sharma',
  'Verma',
  'Patel',
  'Gupta',
  'Reddy',
  'Nair',
  'Iyer',
  'Singh',
  'Kumar',
  'Rao',
  'Mehta',
  'Joshi',
  'Desai',
  'Chopra',
  'Kapoor',
  'Malhotra',
  'Bose',
  'Mukherjee',
  'Pillai',
  'Bhat',
  'Shetty',
  'Kulkarni',
  'Naidu',
  'Das',
  'Roy',
  'Chatterjee',
  'Menon',
  'Sinha',
  'Pandey',
  'Mishra',
  'Yadav',
  'Jain',
  'Agarwal',
  'Bansal',
  'Thakur',
  'Saxena',
  'Trivedi',
  'Dutta',
  'Banerjee',
  'Ghosh',
];

function buildDisplayName(random: () => number): string {
  const first = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

/**
 * Email dạng người thật `firstname.lastname@gmail.com`; nếu trùng thì thêm số
 * (`firstname.lastname2@gmail.com`). Tất định theo thứ tự sinh nên chạy lại
 * cho kết quả giống nhau.
 */
function buildEmail(displayName: string, usedEmails: Set<string>): string {
  const parts = displayName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const handle =
    parts.length >= 2
      ? `${parts[0]}.${parts[parts.length - 1]}`
      : (parts[0] ?? 'freelancer');

  let candidate = `${handle}@gmail.com`;
  let suffix = 2;
  while (usedEmails.has(candidate)) {
    candidate = `${handle}${suffix}@gmail.com`;
    suffix += 1;
  }
  usedEmails.add(candidate);
  return candidate;
}

// ==================== Skill catalog ====================

/** Đảm bảo các skill dùng trong dataset tồn tại, trả về map slug -> id. */
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

/**
 * Tạo/khôi phục user seed theo email dạng thật.
 *
 * Ưu tiên: user đã có email mới -> dùng lại; nếu chưa, tìm user email seed cũ
 * (`resume-...@seed.local`) và đổi sang email mới (giữ nguyên id/relations);
 * cuối cùng mới tạo mới. Nhờ vậy chạy lại không tạo trùng và tự migrate email cũ.
 */
async function ensureSeedUser(input: {
  email: string;
  legacyEmail: string;
  passwordHash: string;
  roleId: number;
}): Promise<{ id: number }> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { deletedAt: null },
    });
    return existing;
  }

  const legacy = await prisma.user.findUnique({
    where: { email: input.legacyEmail },
    select: { id: true },
  });
  if (legacy) {
    return prisma.user.update({
      where: { id: legacy.id },
      data: { email: input.email, deletedAt: null },
      select: { id: true },
    });
  }

  return prisma.user.create({
    data: {
      email: input.email,
      password: input.passwordHash,
      isBanned: false,
      userRoles: { create: { roleId: input.roleId, isPrimary: true } },
    },
    select: { id: true },
  });
}

// ==================== File CV ====================

/**
 * Sinh PDF CV tối giản 1 trang từ danh sách dòng text (không cần thư viện
 * ngoài). Đủ hợp lệ để trình xem PDF mở được và để API/`analyzeCv` đọc.
 */
function buildCvPdf(lines: string[]): Buffer {
  const escape = (value: string): string =>
    value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const toAscii = (value: string): string =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7e]/g, ' ');

  const content =
    'BT /F1 11 Tf 14 TL 50 750 Td\n' +
    lines
      .slice(0, 52)
      .map((line) => `(${escape(toAscii(line))}) Tj T*`)
      .join('\n') +
    '\nET';

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}

/** Dựng nội dung CV text để đưa vào PDF. */
function buildCvLines(input: {
  displayName: string;
  email: string;
  title: string;
  bio: string;
  skills: ParsedSkill[];
  education: string[];
  certifications: string[];
  experiences: ParsedExperience[];
  languages: string[];
}): string[] {
  const lines: string[] = [input.displayName, input.title, input.email];

  if (input.bio) {
    lines.push('', input.bio);
  }
  if (input.skills.length > 0) {
    lines.push(
      '',
      'Skills: ' + input.skills.map((skill) => skill.name).join(', '),
    );
  }
  if (input.experiences.length > 0) {
    lines.push('', 'Experience');
    for (const experience of input.experiences) {
      lines.push(`- ${input.title} @ ${experience.company}`);
      if (experience.description) {
        lines.push(`  ${experience.description}`);
      }
    }
  }
  if (input.education.length > 0) {
    lines.push('', 'Education');
    for (const education of input.education) {
      lines.push(`- ${education}`);
    }
  }
  if (input.certifications.length > 0) {
    lines.push('', 'Certifications');
    for (const certification of input.certifications) {
      lines.push(`- ${certification}`);
    }
  }
  if (input.languages.length > 0) {
    lines.push('', 'Languages: ' + input.languages.join(', '));
  }

  return lines;
}

// ==================== Main ====================

async function main() {
  const csvPath = resolveCsvPath();
  console.log(`Reading dataset: ${csvPath}`);

  const dataset = readDataset(csvPath);
  console.log(`Dataset rows after dedupe: ${dataset.length}`);

  const sampled = sampleByCategory(dataset, TARGET_FREELANCER_COUNT);
  console.log(`Sampled freelancers: ${sampled.length}`);

  const freelancerRole = await prisma.role.findFirst({
    where: { name: RoleName.FREELANCER, deletedAt: null },
    select: { id: true },
  });
  if (!freelancerRole) {
    throw new Error(
      'Role "Freelancer" not found. Run "pnpm --filter api seed" first.',
    );
  }

  const prepared = sampled.map((row) => {
    const skills = parseSkills(row.resume);
    return {
      row,
      skills,
      education: parseEducation(row.resume),
      experiences: parseExperiences(row.resume, row.title),
      certifications: parseCertifications(row.resume),
      languages: parseLanguages(row.resume),
      bio: buildBio(row, skills),
    };
  });

  const skillMap = await ensureSkills(
    prepared.flatMap((item) => item.skills.map((skill) => skill.name)),
  );
  console.log(`Skills available: ${skillMap.size}`);

  const seedPassword =
    process.env.SEED_FREELANCER_PASSWORD ?? FALLBACK_PASSWORD;
  const passwordHash = await hashingService.hash(seedPassword);
  const nameRandom = createRandom(SAMPLE_SEED + 7);

  const now = Date.now();
  const stats = { created: 0, updated: 0 };
  const categoryCount = new Map<string, number>();
  const usedEmails = new Set<string>();
  let sampleEmail = '';

  for (const [index, item] of prepared.entries()) {
    const { row, skills, education, experiences, certifications, languages } =
      item;
    const resumeHash = hash36(row.resume);
    const legacyEmail = `resume-${resumeHash}@seed.local`;
    const displayName = buildDisplayName(nameRandom);
    const email = buildEmail(displayName, usedEmails);
    if (index === 0) {
      sampleEmail = email;
    }
    const createdAt = new Date(
      now - (index % CREATED_AT_SPREAD_DAYS) * 24 * 60 * 60 * 1000,
    );
    const avatarSeed = `freelancer-${resumeHash}`;
    const availability = [
      AvailabilityStatus.AVAILABLE,
      AvailabilityStatus.AVAILABLE,
      AvailabilityStatus.BUSY,
      AvailabilityStatus.AWAY,
    ][index % 4];

    const user = await ensureSeedUser({
      email,
      legacyEmail,
      passwordHash,
      roleId: freelancerRole.id,
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: user.id, roleId: freelancerRole.id },
      },
      create: { userId: user.id, roleId: freelancerRole.id, isPrimary: true },
      update: {},
    });

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        displayName,
        avatarUrl: `https://picsum.photos/seed/${avatarSeed}/400/400`,
        coverUrl: `https://picsum.photos/seed/cover-${avatarSeed}/1600/500`,
        bio: item.bio,
        onlineStatus: index % 3 === 0,
        availabilityStatus: availability,
        profileCompletionPercent: 70 + (index % 30),
        createdAt,
      },
      update: {
        displayName,
        avatarUrl: `https://picsum.photos/seed/${avatarSeed}/400/400`,
        coverUrl: `https://picsum.photos/seed/cover-${avatarSeed}/1600/500`,
        bio: item.bio,
        onlineStatus: index % 3 === 0,
        availabilityStatus: availability,
        profileCompletionPercent: 70 + (index % 30),
      },
      select: { id: true },
    });

    const cvRelativePath = `cvs/${user.id}/${resumeHash}.pdf`;
    const cvAbsolutePath = path.join(process.cwd(), 'uploads', cvRelativePath);
    mkdirSync(path.dirname(cvAbsolutePath), { recursive: true });
    writeFileSync(
      cvAbsolutePath,
      buildCvPdf(
        buildCvLines({
          displayName,
          email,
          title: row.title,
          bio: item.bio,
          skills,
          education,
          certifications,
          experiences,
          languages,
        }),
      ),
    );
    const cvFileName = `${slugify(displayName) || 'freelancer'}-resume.pdf`;

    const freelancerProfile = await prisma.freelancerProfile.upsert({
      where: { profileId: profile.id },
      create: {
        profileId: profile.id,
        title: row.title,
        education,
        certifications,
        languages,
        experience: experiences.map((exp) => `${row.title} — ${exp.company}`),
        idVerified: index % 2 === 0,
        cvUrl: `local://${cvRelativePath}`,
        cvFileName,
        cvPublicId: null,
        cvUploadedAt: createdAt,
      },
      update: {
        title: row.title,
        education,
        certifications,
        languages,
        experience: experiences.map((exp) => `${row.title} — ${exp.company}`),
        idVerified: index % 2 === 0,
        cvUrl: `local://${cvRelativePath}`,
        cvFileName,
        cvUploadedAt: createdAt,
      },
      select: { id: true },
    });

    await prisma.$transaction([
      prisma.freelancerSkill.deleteMany({
        where: { freelancerProfileId: freelancerProfile.id },
      }),
      prisma.freelancerExperience.deleteMany({
        where: { freelancerProfileId: freelancerProfile.id },
      }),
      prisma.freelancerEducation.deleteMany({
        where: { freelancerProfileId: freelancerProfile.id },
      }),
    ]);

    const skillRows = skills
      .map((skill) => {
        const skillId = skillMap.get(skill.slug);
        if (!skillId) {
          return null;
        }
        return {
          freelancerProfileId: freelancerProfile.id,
          skillId,
          proficiencyLevel: proficiencyFromMonths(skill.months),
        };
      })
      .filter((value): value is NonNullable<typeof value> => value !== null);

    if (skillRows.length > 0) {
      await prisma.freelancerSkill.createMany({
        data: skillRows,
        skipDuplicates: true,
      });
    }

    if (experiences.length > 0) {
      await prisma.freelancerExperience.createMany({
        data: experiences.map((exp, expIndex) => ({
          freelancerProfileId: freelancerProfile.id,
          title: row.title,
          company: exp.company,
          description: exp.description,
          isCurrent: expIndex === 0,
        })),
      });
    }

    if (education.length > 0) {
      await prisma.freelancerEducation.createMany({
        data: education.map((line) => ({
          freelancerProfileId: freelancerProfile.id,
          degree: truncate(line, 150),
        })),
      });
    }

    stats.created += 1;
    categoryCount.set(row.category, (categoryCount.get(row.category) ?? 0) + 1);
  }

  const formatCount = (map: Map<string, number>): string =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');

  console.log('');
  console.log(`Freelancers seeded: ${stats.created}`);
  console.log(`Categories: ${formatCount(categoryCount)}`);
  console.log(
    `Sample login: ${sampleEmail || 'firstname.lastname@gmail.com'} (password from SEED_FREELANCER_PASSWORD)`,
  );
  console.log('Seed dataset freelancers completed!');
}

function buildBio(row: ResumeRow, skills: ParsedSkill[]): string {
  const skillList = skills
    .slice(0, 4)
    .map((skill) => skill.name)
    .join(', ');
  const focus = skillList || row.category;
  return truncate(
    `${row.title} with hands-on experience in ${focus}. Open to freelance and contract projects in ${row.category}.`,
    BIO_MAX_LENGTH,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
