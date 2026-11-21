import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  ArrowUpRight,
  Phone,
  Mail,
  Globe,
  Play,
  Briefcase,
  Star,
  CheckCircle2,
  Share2,
} from "lucide-react";

interface FreelancerProfile {
  id: string;
  name: string;
  greeting: string;
  role: string;
  subRole: string;
  award: string;
  tagline: string;
  bio: string;
  avatar: string;
  hourlyRate: string;
  phone: string;
  email: string;
  clientsCount: string;
  yearsExperience: string;
  projectsCompleted: string;
  satisfactionRate: string;
  skills: string[];
  mockups: { title: string; image: string }[];
}

const FREELANCER_DATA: Record<string, FreelancerProfile> = {
  default: {
    id: "mitchel-jonson",
    name: "MITCHEL JONSON",
    greeting: "Hey there. I'm",
    role: "DIGITAL DESIGNER",
    subRole: "Front-end Developer",
    award: "Firm of the Year 2026",
    tagline:
      "Helping brands stand out with thoughtful and compelling design solutions that convert and scale.",
    bio: "I love collaborating with brands and founders. If you're ready to bring your next big idea to life, let's connect!",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85",
    hourlyRate: "$65/hr",
    phone: "+1 (555) 123-4567",
    email: "mitchel.jonson@frevia.work",
    clientsCount: "5K+",
    yearsExperience: "12",
    projectsCompleted: "100+",
    satisfactionRate: "98%",
    skills: [
      "UI/UX Design",
      "Next.js",
      "Design Systems",
      "Figma",
      "Brand Identity",
      "Frontend Architecture",
    ],
    mockups: [
      {
        title: "Brand Guidelines & Book Mockup",
        image:
          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
      },
      {
        title: "iPad Pro Dashboard App UI",
        image:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  "1": {
    id: "1",
    name: "ALEX NGUYEN",
    greeting: "Xin chào. Tôi là",
    role: "CLOUD ARCHITECT",
    subRole: "Senior Full-Stack Engineer",
    award: "Top Rated Plus 2026",
    tagline:
      "Xây dựng hạ tầng phân tán chịu tải cao, microservices hiện đại và ứng dụng SaaS quy mô lớn.",
    bio: "Sẵn sàng hợp tác cùng các nhà sáng lập và doanh nghiệp để hiện thực hoá các sản phẩm công nghệ đột phá.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=85",
    hourlyRate: "$45/hr",
    phone: "+84 908 123 456",
    email: "alex.nguyen@frevia.work",
    clientsCount: "3K+",
    yearsExperience: "8",
    projectsCompleted: "120+",
    satisfactionRate: "99%",
    skills: ["NestJS", "React", "Next.js", "AWS", "PostgreSQL", "Docker", "Kubernetes"],
    mockups: [
      {
        title: "Cloud Infrastructure Architecture",
        image:
          "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
      },
      {
        title: "Microservices Admin Dashboard",
        image:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
};

export default async function FreelancerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = FREELANCER_DATA[id] || {
    ...FREELANCER_DATA.default,
    id,
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white text-zinc-950 font-sans dark:bg-zinc-950 dark:text-zinc-50">
      {/* Frevia Guest Header */}
      <Header role="GUEST" />

      {/* Profile Page Wrapper (Mitchel Jonson Style Layout) */}
      <main className="flex-1">
        {/* ── Sub Navigation Bar (Matching Image 2 Header Bar) ── */}
        <div className="border-b border-zinc-100 bg-white/80 backdrop-blur-md dark:border-zinc-900 dark:bg-zinc-950/80 sticky top-[60px] z-30">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400">
              <Link href="#about" className="hover:text-blue-600 transition-colors">
                About
              </Link>
              <Link href="#services" className="hover:text-blue-600 transition-colors">
                Services
              </Link>
              <Link href="#work" className="hover:text-blue-600 transition-colors">
                Work
              </Link>
              <Link href="#experience" className="hover:text-blue-600 transition-colors">
                Experience
              </Link>
              <Link href="#contact" className="hover:text-blue-600 transition-colors">
                Contact
              </Link>
            </div>

            <Button
              asChild
              className="rounded-full bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 text-xs font-semibold px-5 py-2 shadow-sm"
            >
              <Link href={`mailto:${profile.email}`}>
                <span>See Our Works</span>
                <ArrowUpRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Section 1: Hero Profile (Mitchel Jonson Grid) ── */}
        <section id="about" className="py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
              {/* Left Column: Greeting, Name, Tagline, CTA */}
              <div className="lg:col-span-4 space-y-6">
                <div>
                  <p className="text-sm sm:text-base font-medium text-zinc-500 dark:text-zinc-400">
                    {profile.greeting}
                  </p>
                  <h1 className="mt-1 text-4xl sm:text-5xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-none">
                    {profile.name}
                  </h1>
                </div>

                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-sm">
                  {profile.tagline}
                </p>

                <div className="pt-2">
                  <Button
                    asChild
                    className="rounded-full bg-[#0069D3] hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-6 py-3 shadow-md group"
                  >
                    <Link href={`mailto:${profile.email}`}>
                      <span>Lets Talk Brief</span>
                      <div className="ml-2 flex size-5 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                        <ArrowUpRight className="size-3 text-white" />
                      </div>
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Center Column: Portrait Card + Social Icons + Available Badge */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center">
                <div className="relative">
                  {/* Portrait Card */}
                  <div className="relative aspect-3/4 w-64 sm:w-72 overflow-hidden rounded-[32px] bg-zinc-100 shadow-xl border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="h-full w-full object-cover object-top"
                    />

                    {/* Social Floating Icons on the right */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <a
                        href="#contact"
                        className="flex size-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-zinc-700 shadow-sm transition-transform hover:scale-110 hover:text-blue-600"
                        title="Website"
                      >
                        <Globe className="size-4" />
                      </a>
                      <a
                        href="#contact"
                        className="flex size-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-zinc-700 shadow-sm transition-transform hover:scale-110 hover:text-blue-600"
                        title="Share"
                      >
                        <Share2 className="size-4" />
                      </a>
                    </div>
                  </div>

                  {/* Available For New Projects Badge */}
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Available For New Projects
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Roles, Digital Designer, 5K Clients */}
              <div className="lg:col-span-4 space-y-6 lg:pl-6">
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    {profile.award}
                  </p>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    {profile.subRole}
                  </p>
                  <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                    {profile.role}
                  </h2>
                </div>

                {/* Social Proof Avatars */}
                <div className="pt-2 space-y-1.5">
                  <div className="flex -space-x-2">
                    <div className="size-8 rounded-full border-2 border-white bg-zinc-200 overflow-hidden dark:border-zinc-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                        alt="Client 1"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="size-8 rounded-full border-2 border-white bg-zinc-200 overflow-hidden dark:border-zinc-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
                        alt="Client 2"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="size-8 rounded-full border-2 border-white bg-zinc-200 overflow-hidden dark:border-zinc-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80"
                        alt="Client 3"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-zinc-950 text-[10px] font-bold text-white dark:border-zinc-950">
                      {profile.clientsCount}
                    </div>
                  </div>

                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {profile.clientsCount} Clients World-Wide
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Loved by founders globally
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 2: Trusted by 20+ best companies (Logos) ── */}
        <section className="border-y border-zinc-200/60 bg-zinc-50/50 py-8 dark:border-zinc-900 dark:bg-zinc-900/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <span className="text-xs font-semibold text-zinc-500 shrink-0">
                Trusted by 20+ best companies
              </span>

              <div className="flex flex-wrap items-center justify-center gap-8 text-xs font-bold text-zinc-400 dark:text-zinc-500">
                <span className="flex items-center gap-1.5 font-mono text-zinc-700 dark:text-zinc-300">
                  <Briefcase className="size-4 text-blue-600" /> VEXTER LABS
                </span>
                <span className="flex items-center gap-1.5 font-mono text-zinc-700 dark:text-zinc-300">
                  <Star className="size-4 text-blue-600" /> ACME STUDIO
                </span>
                <span className="flex items-center gap-1.5 font-mono text-zinc-700 dark:text-zinc-300">
                  <CheckCircle2 className="size-4 text-blue-600" /> NOVA CLOUD
                </span>
                <span className="flex items-center gap-1.5 font-mono text-zinc-700 dark:text-zinc-300">
                  <Globe className="size-4 text-blue-600" /> NEXUS TECH
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 3: Collaboration & Work Mockups ── */}
        <section id="work" className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
              {/* Left Column: Collaboration Callout & Contact Pills */}
              <div className="lg:col-span-5 space-y-6">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
                  {profile.bio}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                      <Phone className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-zinc-500">Call Today</p>
                      <p className="text-xs font-bold text-zinc-900 truncate dark:text-zinc-100">
                        {profile.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                      <Mail className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-zinc-500">Email Me</p>
                      <p className="text-xs font-bold text-zinc-900 truncate dark:text-zinc-100">
                        {profile.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    asChild
                    className="rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs sm:text-sm font-semibold px-6 py-3 dark:bg-white dark:text-zinc-950"
                  >
                    <Link href={`mailto:${profile.email}`}>
                      <span>Lets Talk Brief</span>
                      <ArrowUpRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Right Column: Work Mockups Grid (Hey Mockup!, Pad Pro Mockup) */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {(profile.mockups ?? []).map((mockup, idx) => (
                  <div
                    key={idx}
                    className="group relative flex flex-col overflow-hidden rounded-[24px] border border-zinc-200/70 bg-zinc-50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mockup.image}
                        alt={mockup.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {mockup.title}
                      </span>
                      <ArrowUpRight className="size-4 text-zinc-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 4: Dark Banner Section (Stats & Empowerment) ── */}
        <section id="experience" className="pb-16 sm:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[32px] bg-zinc-950 text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-white/10">
              {/* Banner Headline */}
              <h4 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white max-w-3xl leading-snug">
                We are passionate about empowering individuals and businesses to take control of their projects, user-first experiences.
              </h4>

              {/* Stats & Video Intro Row */}
              <div className="mt-12 grid grid-cols-2 gap-8 border-t border-white/10 pt-10 sm:grid-cols-4 items-center">
                {/* 1: Video Preview Card */}
                <div className="relative aspect-16/10 overflow-hidden rounded-2xl border border-white/20 bg-zinc-900 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80"
                    alt="Video preview"
                    className="h-full w-full object-cover opacity-70 group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex size-10 items-center justify-center rounded-full bg-white text-zinc-950 shadow-md">
                      <Play className="size-4 ml-0.5 fill-current" />
                    </div>
                  </div>
                </div>

                {/* 2: Years of Experience */}
                <div className="space-y-1 sm:pl-4">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
                    {profile.yearsExperience}
                  </p>
                  <p className="text-xs text-zinc-400">Years of Experience</p>
                </div>

                {/* 3: Projects Complete */}
                <div className="space-y-1 sm:pl-4">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
                    {profile.projectsCompleted}
                  </p>
                  <p className="text-xs text-zinc-400">Project Complete</p>
                </div>

                {/* 4: Satisfaction Client */}
                <div className="space-y-1 sm:pl-4">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
                    {profile.satisfactionRate}
                  </p>
                  <p className="text-xs text-zinc-400">Satisfaction Client</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
