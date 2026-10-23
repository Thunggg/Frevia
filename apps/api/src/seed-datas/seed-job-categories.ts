import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

if (!process.env.DIRECT_URL) {
  console.log('Cannot find DB URL');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL,
  }),
});

type JobCategorySeed = {
  name: string;
  description: string;
  /** Chỉ dùng khi slug đã tồn tại trong DB (giữ nguyên URL cũ), còn lại tự sinh từ name. */
  slug?: string;
  /** Slug của các job mẫu sẽ được gắn vào danh mục này. */
  jobSlugs?: string[];
};

// 100 danh mục công việc, gom theo 12 nhóm ngành nghề.
// Slug được sinh tự động từ `name` bằng đúng thuật toán của
// JobCategoriesAdminRepository.slugify() nên URL luôn khớp với tên.
const jobCategories: JobCategorySeed[] = [
  // ===== 1. IT & Technology (1–15) =====
  {
    name: 'Web Development',
    description:
      'Design and build websites and web applications, from landing pages to full e-commerce platforms.',
    jobSlugs: ['build-landing-page', 'develop-rest-api', 'e-commerce-website'],
  },
  {
    name: 'Mobile Development',
    description:
      'Build cross-platform and native mobile applications for iOS and Android.',
    slug: 'mobile-app-development',
    jobSlugs: ['react-native-mobile-app'],
  },
  {
    name: 'Backend Development',
    description:
      'Build server-side services, APIs, databases and business logic with scalable architecture.',
  },
  {
    name: 'Frontend Development',
    description:
      'Implement responsive, accessible user interfaces with modern web frameworks.',
  },
  {
    name: 'Fullstack Development',
    description:
      'Handle both frontend and backend of web products, from UI to deployment.',
  },
  {
    name: 'DevOps & Cloud',
    description:
      'Automate infrastructure, CI/CD pipelines, containerisation and cloud operations.',
  },
  {
    name: 'Data & AI',
    description:
      'Turn raw data into insights and build AI-powered features into products.',
  },
  {
    name: 'Machine Learning & AI',
    description:
      'Train, evaluate and deploy machine learning models, chatbots and LLM integrations.',
    slug: 'ai-machine-learning',
    jobSlugs: ['ai-chatbot-integration'],
  },
  {
    name: 'Cybersecurity',
    description:
      'Protect systems and data: penetration testing, security audits and incident response.',
  },
  {
    name: 'QA/QC & Testing',
    description:
      'Ensure product quality through manual testing, test automation and release validation.',
  },
  {
    name: 'IT Support & Helpdesk',
    description:
      'Provide technical support to end users, troubleshoot issues and manage IT tickets.',
  },
  {
    name: 'System Admin & Network',
    description:
      'Maintain servers, networks and system configurations to keep operations running.',
  },
  {
    name: 'Database & Data Engineering',
    description:
      'Design schemas, optimise queries and build reliable data pipelines and warehouses.',
  },
  {
    name: 'Game Development',
    description:
      'Create games and interactive experiences, from gameplay logic to engine integration.',
  },
  {
    name: 'Blockchain & Web3',
    description:
      'Develop smart contracts, dApps and on-chain or crypto-related products.',
  },

  // ===== 2. Design & Creative (16–23) =====
  {
    name: 'UI/UX Design',
    description:
      'Design user flows, wireframes and interfaces that are usable and visually polished.',
  },
  {
    name: 'Graphic Design',
    description:
      'Create visual assets such as logos, illustrations, posters and marketing materials.',
  },
  {
    name: 'Motion & Video Design',
    description:
      'Produce animated content, video editing and motion graphics for brand and product.',
  },
  {
    name: '3D & Animation',
    description:
      'Model, render and animate 3D assets for games, products and visual effects.',
  },
  {
    name: 'Game Art & Illustration',
    description:
      'Create game characters, environments, icons and illustration for digital products.',
  },
  {
    name: 'Branding & Identity',
    description:
      'Shape brand strategy, visual identity, guidelines and naming for companies.',
  },
  {
    name: 'Interior Design',
    description:
      'Plan and design residential and commercial interiors, layouts and materials.',
  },
  {
    name: 'Fashion Design',
    description:
      'Design garments, collections and fashion concepts from sketch to sample.',
  },

  // ===== 3. Marketing & Communications (24–33) =====
  {
    name: 'Digital Marketing',
    description:
      'Plan and run online campaigns across paid, owned and organic channels.',
  },
  {
    name: 'SEO & SEM',
    description:
      'Improve search visibility through technical SEO, content optimisation and paid search.',
  },
  {
    name: 'Content Marketing',
    description:
      'Create and distribute content that attracts, engages and retains an audience.',
  },
  {
    name: 'Social Media Marketing',
    description:
      'Grow and engage communities on social platforms through content and analytics.',
  },
  {
    name: 'Performance Marketing',
    description:
      'Optimise ad spend and campaigns for measurable results such as leads and ROAS.',
  },
  {
    name: 'Brand Marketing',
    description:
      'Build brand awareness, positioning and campaigns for products or companies.',
  },
  {
    name: 'PR & Communications',
    description:
      'Manage media relations, press releases and corporate communications.',
  },
  {
    name: 'Event Marketing',
    description:
      'Plan and promote events, conferences and brand activations from idea to execution.',
  },
  {
    name: 'Influencer & Affiliate',
    description:
      'Run influencer collaborations and affiliate programmes that drive sales.',
  },
  {
    name: 'Copywriting & Editing',
    description:
      'Write, edit and proofread marketing copy, articles, emails and scripts.',
  },

  // ===== 4. Business & Sales (34–42) =====
  {
    name: 'Sales B2B',
    description:
      'Sell products and services to companies, managing pipelines and key accounts.',
  },
  {
    name: 'Sales B2C & Retail',
    description:
      'Sell directly to individual customers through stores, showrooms and outlets.',
  },
  {
    name: 'Business Development',
    description:
      'Identify new opportunities, partnerships and revenue channels for growth.',
  },
  {
    name: 'Account Management',
    description:
      'Maintain client relationships, renew contracts and grow account value.',
  },
  {
    name: 'E-commerce',
    description:
      'Run online stores: listings, marketplace operations, conversion and operations.',
  },
  {
    name: 'Retail & Store Operations',
    description:
      'Manage daily retail store operations, merchandising and in-store sales targets.',
  },
  {
    name: 'Telesales & Customer Service',
    description:
      'Handle inbound and outbound calls, sales follow-ups and customer support.',
  },
  {
    name: 'Export & Import',
    description:
      'Manage international trade documentation, customs procedures and shipment coordination.',
  },
  {
    name: 'Franchise & Licensing',
    description:
      'Develop and support franchise networks, licensing models and partner agreements.',
  },

  // ===== 5. Finance, Accounting & Banking (43–52) =====
  {
    name: 'Accounting',
    description:
      'Maintain books, ledgers and financial records for individuals or companies.',
  },
  {
    name: 'Auditing',
    description:
      'Review financial statements and internal controls to verify compliance and accuracy.',
  },
  {
    name: 'Corporate Finance',
    description:
      'Support budgeting, financial planning, reporting and funding for businesses.',
  },
  {
    name: 'Banking & Credit',
    description:
      'Work with bank products, lending, credit assessment and customer accounts.',
  },
  {
    name: 'Investment & Securities',
    description:
      'Analyse and trade securities, manage investment portfolios and market research.',
  },
  {
    name: 'Insurance',
    description:
      'Underwrite, sell and administer insurance policies and claims.',
  },
  {
    name: 'Tax',
    description:
      'Handle tax compliance, declarations, filings and tax planning for clients.',
  },
  {
    name: 'Financial Analysis',
    description:
      'Analyse financial data, build models and support investment or strategy decisions.',
  },
  {
    name: 'Fintech',
    description:
      'Build technology products and platforms for payments, lending and finance.',
  },
  {
    name: 'Fund & Asset Management',
    description:
      'Manage investment funds and client assets, including performance and reporting.',
  },

  // ===== 6. Human Resources & Administration (53–58) =====
  {
    name: 'Recruitment & HR',
    description:
      'Handle hiring, talent sourcing, interviewing and general people operations.',
  },
  {
    name: 'Training & Development',
    description:
      'Design and deliver training programmes that build skills for teams and organisations.',
  },
  {
    name: 'Compensation & Benefits',
    description:
      'Run payroll, compensation structures and employee benefit programmes.',
  },
  {
    name: 'Administration & Office',
    description:
      'Handle daily office administration, documentation, scheduling and internal coordination.',
  },
  {
    name: 'Employment Law',
    description:
      'Advise on employment contracts, workplace compliance and labour relations.',
  },
  {
    name: 'HR Analytics',
    description:
      'Use data and metrics to measure workforce performance, engagement and cost.',
  },

  // ===== 7. Education & Training (59–64) =====
  {
    name: 'General Education',
    description:
      'Teach general subjects at primary and secondary school levels.',
  },
  {
    name: 'Higher Education',
    description: 'Teach and support students at university and college level.',
  },
  {
    name: 'Language Centers',
    description:
      'Teach languages in classroom and online settings to learners of all levels.',
  },
  {
    name: 'EdTech',
    description:
      'Build educational platforms, LMS, learning content and education technology products.',
  },
  {
    name: 'Vocational Training',
    description:
      'Deliver practical training for specific trades and vocational skills.',
  },
  {
    name: 'Tutoring & Private Lessons',
    description:
      'Provide one-to-one or small-group tutoring for students and adult learners.',
  },

  // ===== 8. Healthcare & Wellness (65–72) =====
  {
    name: 'Healthcare & Hospitals',
    description:
      'Provide clinical care and hospital services across medical and nursing roles.',
  },
  {
    name: 'Pharmaceuticals',
    description:
      'Work on pharmaceutical products: production, quality, regulatory affairs and sales.',
  },
  {
    name: 'Medical Devices',
    description:
      'Develop, manufacture, market or support medical devices and equipment.',
  },
  {
    name: 'Health Care & Wellness',
    description:
      'Support wellbeing through preventive care, health services and lifestyle programmes.',
  },
  {
    name: 'Dentistry',
    description:
      'Provide dental treatments, dental care services and clinic operations.',
  },
  {
    name: 'Beauty & Spa',
    description: 'Deliver beauty treatments, spa services and cosmetic care.',
  },
  {
    name: 'Psychology & Therapy',
    description:
      'Provide psychological assessment, counselling and mental health therapy.',
  },
  {
    name: 'Veterinary',
    description:
      'Diagnose, treat and prevent diseases and injuries in animals.',
  },

  // ===== 9. Engineering & Construction (73–81) =====
  {
    name: 'Construction & Civil Engineering',
    description:
      'Plan, build and supervise civil works, from site preparation to handover.',
  },
  {
    name: 'Architecture',
    description:
      'Design buildings and spaces, from concept sketches to construction documents.',
  },
  {
    name: 'Mechanical Engineering & Manufacturing',
    description:
      'Design machines and production lines, and manage manufacturing processes.',
  },
  {
    name: 'Electrical & Electronics',
    description:
      'Design, install and maintain electrical systems, circuits and electronic devices.',
  },
  {
    name: 'Automotive & Mechanics',
    description:
      'Repair, maintain and improve vehicles, engines and automotive systems.',
  },
  {
    name: 'Real Estate',
    description:
      'Buy, sell, rent and manage properties, and advise on real estate opportunities.',
  },
  {
    name: 'Interior Design & Fit-out',
    description:
      'Deliver interior fit-out projects: detailing, materials, and site execution.',
  },
  {
    name: 'Infrastructure & Transportation',
    description:
      'Deliver transport and infrastructure projects such as roads, bridges and utilities.',
  },
  {
    name: 'Energy & Environment',
    description:
      'Work on renewable energy, utilities and environmental or sustainability projects.',
  },

  // ===== 10. Travel, Hospitality & Food (82–87) =====
  {
    name: 'Travel & Tours',
    description:
      'Plan, sell and operate tours, itineraries and travel packages.',
  },
  {
    name: 'Hotels & Resorts',
    description:
      'Run hotel and resort services: front office, reservations, housekeeping and operations.',
  },
  {
    name: 'Restaurant & Food Service',
    description:
      'Work in restaurants and food service: kitchen, service and outlet management.',
  },
  {
    name: 'Bar & Cafe',
    description:
      'Serve beverages, run bar operations and manage beverage programmes.',
  },
  {
    name: 'Air Freight & Maritime',
    description:
      'Coordinate air cargo, shipping and maritime logistics operations.',
  },
  {
    name: 'Events & Entertainment',
    description:
      'Produce events, shows and entertainment experiences for audiences and brands.',
  },

  // ===== 11. Logistics, Transport & Production (88–95) =====
  {
    name: 'Logistics & Supply Chain',
    description:
      'Plan and manage supply chain operations, from sourcing through to distribution.',
  },
  {
    name: 'Transportation & Delivery',
    description:
      'Move goods and passengers safely and on time using road, rail or water transport.',
  },
  {
    name: 'Warehousing & Storage',
    description:
      'Manage warehouses, inventory, stock accuracy and fulfilment activities.',
  },
  {
    name: 'Manufacturing & Factory',
    description:
      'Operate and improve production lines, factory processes and output quality.',
  },
  {
    name: 'Production Quality Assurance',
    description:
      'Control and assure product quality on the production floor and in the supply chain.',
  },
  {
    name: 'Agriculture & Aquaculture',
    description:
      'Work in crop farming, livestock or aquaculture production and processing.',
  },
  {
    name: 'Food & Beverage',
    description:
      'Produce and process food and beverage products at industrial scale.',
  },
  {
    name: 'Textiles & Footwear',
    description:
      'Manufacture garments, fabrics, leather goods and footwear products.',
  },

  // ===== 12. Legal, Services & Others (96–100) =====
  {
    name: 'Legal & Law',
    description:
      'Practise or support legal work including contracts, disputes and compliance.',
  },
  {
    name: 'Consulting & Advisory',
    description:
      'Advise organisations on strategy, operations and specialist business questions.',
  },
  {
    name: 'Customer Service',
    description:
      'Resolve customer questions and issues through chat, email and phone support.',
  },
  {
    name: 'Translation & Interpretation',
    description:
      'Translate documents, localise content and interpret between languages.',
  },
  {
    name: 'General Labor & Services',
    description:
      'General helper, technician and multi-service roles for on-site assignments.',
  },
];

/** Giống hệt JobCategoriesAdminRepository.slugify() để slug luôn khớp với tên. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function resolveSlug(category: JobCategorySeed): string {
  const slug = category.slug ?? slugify(category.name);
  if (!slug) {
    throw new Error(`Cannot build slug for category "${category.name}"`);
  }
  return slug;
}

function assertUniqueCategories(categories: JobCategorySeed[]): void {
  const slugs = new Set<string>();
  const names = new Map<string, string>();

  for (const category of categories) {
    const slug = resolveSlug(category);
    const name = category.name.trim().toLowerCase();

    if (slugs.has(slug)) {
      throw new Error(`Duplicate slug "${slug}" in seed data`);
    }
    slugs.add(slug);

    const duplicatedName = names.get(name);
    if (duplicatedName) {
      throw new Error(
        `Duplicate category name "${category.name}" (already used by "${duplicatedName}")`,
      );
    }
    names.set(name, category.name);
  }
}

async function main() {
  console.log(`Seeding ${jobCategories.length} job categories...`);
  assertUniqueCategories(jobCategories);

  let created = 0;
  let updated = 0;
  let linked = 0;

  for (const category of jobCategories) {
    const slug = resolveSlug(category);
    const existing = await prisma.jobCategory.findFirst({
      where: { slug, deletedAt: null },
    });

    const jobCategory = existing
      ? await prisma.jobCategory.update({
          where: { id: existing.id },
          data: {
            name: category.name,
            description: category.description,
            status: 'ACTIVE',
          },
        })
      : await prisma.jobCategory.create({
          data: {
            name: category.name,
            slug,
            description: category.description,
            status: 'ACTIVE',
          },
        });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }

    if (!category.jobSlugs?.length) {
      continue;
    }

    const jobs = await prisma.job.findMany({
      where: { slug: { in: category.jobSlugs }, deletedAt: null },
      select: { id: true },
    });

    if (jobs.length > 0) {
      const result = await prisma.jobJobCategory.createMany({
        data: jobs.map((job) => ({
          jobId: job.id,
          categoryId: jobCategory.id,
        })),
        skipDuplicates: true,
      });
      linked += result.count;
      console.log(`  ${category.name} -> ${result.count} job(s) linked.`);
    } else {
      console.log(
        `  ${category.name} -> no sample job found, skipped linking.`,
      );
    }
  }

  console.log(
    `Seed job categories completed! Created: ${created}, updated: ${updated}, job links: ${linked}.`,
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
