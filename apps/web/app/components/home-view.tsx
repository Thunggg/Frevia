"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { BannerSlot } from "@/components/banner-slot";
import { HeroSlider } from "./hero-slider";
import { BackToTop } from "./back-to-top";
import type { JobCategoryBrowseItemType } from "@shared/types";
import {
  ArrowUpRight,
  Briefcase,
  ChevronDown,
  Code2,
  Palette,
  Megaphone,
  Cpu,
  Smartphone,
  PenTool,
  Video,
  Cloud,
  Layers,
} from "lucide-react";

type HomeViewProps = {
  categories?: JobCategoryBrowseItemType[];
};

type CardTheme = "light" | "blue" | "dark";

// Luân phiên 3 màu bg theo yêu cầu: Xám trắng, Xanh dương, Đen
// Bố trí 2 dòng, mỗi dòng 4 card, không bị trùng màu kề nhau
const CARD_THEMES: CardTheme[] = [
  "light", // Card 0: Xám trắng
  "blue",  // Card 1: Xanh dương
  "dark",  // Card 2: Đen
  "light", // Card 3: Xám trắng
  "blue",  // Card 4: Xanh dương
  "dark",  // Card 5: Đen
  "light", // Card 6: Xám trắng
  "blue",  // Card 7: Xanh dương
];

// Hàm lấy phong cách theo màu nền
function getThemeStyles(theme: CardTheme) {
  if (theme === "blue") {
    return {
      card: "bg-[#0069D3] text-white border-blue-400/30 hover:bg-[#005fb8] shadow-lg shadow-blue-500/15",
      badge: "bg-white text-[#0069D3] font-bold shadow-xs",
      title: "text-white",
      desc: "text-blue-100/90",
      iconBox: "bg-white text-[#0069D3] shadow-xs",
      action: "text-white/95 group-hover:text-white",
      divider: "border-white/20",
    };
  }
  if (theme === "dark") {
    return {
      card: "bg-zinc-950 text-white border-zinc-800/90 hover:bg-black shadow-md dark:bg-black dark:border-zinc-800",
      badge: "bg-white text-zinc-950 font-bold shadow-xs",
      title: "text-white",
      desc: "text-zinc-400",
      iconBox: "bg-zinc-900 text-white border border-zinc-800 shadow-xs",
      action: "text-zinc-300 group-hover:text-white",
      divider: "border-white/10",
    };
  }
  // theme === "light" (Xám trắng)
  return {
    card: "bg-[#F4F5F7] text-zinc-950 border-zinc-200/90 hover:bg-[#EAECEF] dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-850 shadow-xs",
    badge: "bg-white text-zinc-700 font-semibold shadow-xs border border-zinc-200/50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200",
    title: "text-zinc-950 dark:text-zinc-50",
    desc: "text-zinc-600 dark:text-zinc-400",
    iconBox: "bg-white text-zinc-900 border border-zinc-200/80 shadow-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100",
    action: "text-zinc-700 group-hover:text-[#0069D3] dark:text-zinc-300 dark:group-hover:text-blue-400",
    divider: "border-zinc-300/60 dark:border-zinc-800",
  };
}

// Hàm gán Icon trực quan tương ứng với danh mục
function getCategoryIcon(slug: string, name: string) {
  const s = (slug + " " + name).toLowerCase();
  if (
    s.includes("web") ||
    s.includes("frontend") ||
    s.includes("fontend") ||
    s.includes("backend") ||
    s.includes("fullstack") ||
    s.includes("dev") ||
    s.includes("lap-trinh")
  ) {
    return Code2;
  }
  if (
    s.includes("mobile") ||
    s.includes("ios") ||
    s.includes("android") ||
    s.includes("app") ||
    s.includes("di-dong")
  ) {
    return Smartphone;
  }
  if (
    s.includes("design") ||
    s.includes("ui") ||
    s.includes("ux") ||
    s.includes("thiet-ke") ||
    s.includes("do-hoa") ||
    s.includes("graphic")
  ) {
    return Palette;
  }
  if (
    s.includes("marketing") ||
    s.includes("seo") ||
    s.includes("ads") ||
    s.includes("quang-cao") ||
    s.includes("truyen-thong")
  ) {
    return Megaphone;
  }
  if (
    s.includes("ai") ||
    s.includes("data") ||
    s.includes("du-lieu") ||
    s.includes("tri-tue") ||
    s.includes("machine")
  ) {
    return Cpu;
  }
  if (
    s.includes("content") ||
    s.includes("writing") ||
    s.includes("dich-thuat") ||
    s.includes("viet-lach") ||
    s.includes("noi-dung")
  ) {
    return PenTool;
  }
  if (
    s.includes("video") ||
    s.includes("media") ||
    s.includes("animation") ||
    s.includes("am-thanh") ||
    s.includes("motion")
  ) {
    return Video;
  }
  if (
    s.includes("cloud") ||
    s.includes("devops") ||
    s.includes("ha-tang") ||
    s.includes("system")
  ) {
    return Cloud;
  }
  return Layers;
}

export function HomeView({ categories = [] }: HomeViewProps) {
  const tCategories = useTranslations("home.categories");
  const tAi = useTranslations("home.ai");
  const tFaqs = useTranslations("home.faqs");

  // Chỉ lấy đúng 8 category có nhiều job nhất từ database
  const top8Categories = [...categories]
    .sort((a, b) => b.jobCount - a.jobCount)
    .slice(0, 8);

  // Quản lý trạng thái mở/đóng FAQs (mặc định câu cuối index 5 mở giống trong ảnh mockup)
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([5]);

  const toggleFaq = (index: number) => {
    setOpenFaqIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const faqItems = [
    { q: tFaqs("q1"), a: tFaqs("a1") },
    { q: tFaqs("q2"), a: tFaqs("a2") },
    { q: tFaqs("q3"), a: tFaqs("a3") },
    { q: tFaqs("q4"), a: tFaqs("a4") },
    { q: tFaqs("q5"), a: tFaqs("a5") },
    { q: tFaqs("q6"), a: tFaqs("a6") },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      {/* Header chỉ dành cho Guest */}
      <Header role="GUEST" />

      <BannerSlot
        position="GLOBAL_HEADER"
        className="border-b border-border/50 bg-background"
      />

      <main className="flex-1">
        {/* ── 1. Hero Section (Pipely style with DB Banner) ── */}
        <section className="w-full bg-white dark:bg-zinc-950">
          <HeroSlider />
        </section>

        <BannerSlot
          position="HOME_HERO"
          className="border-b border-border/50 bg-background"
        />

        {/* ── 2. Top 8 Job Categories (4 card / dòng, 3 màu xám trắng - xanh dương - đen, không có nút lưu, song ngữ Anh - Việt) ── */}
        <section className="py-16 sm:py-24 bg-white dark:bg-zinc-950 border-t border-border/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <h2 className="mt-3 text-3xl tracking-tight text-foreground sm:text-4xl">
                  {tCategories("title")}
                </h2>
              </div>

              <Link
                href="/find-work"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0069D3] hover:text-blue-700 dark:hover:text-blue-400 group"
              >
                <span>{tCategories("viewAll")}</span>
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            {top8Categories.length === 0 ? (
              <div className="rounded-sm border border-dashed border-border bg-white p-12 text-center dark:bg-zinc-900">
                <Briefcase className="mx-auto size-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">
                  {tCategories("empty")}
                </p>
              </div>
            ) : (
              /* Grid 4 card trên một dòng (2 hàng x 4 cột = 8 categories) */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                {top8Categories.map((category, index) => {
                  const theme =
                    CARD_THEMES[index % CARD_THEMES.length] ?? "light";
                  const themeStyles = getThemeStyles(theme);
                  const Icon = getCategoryIcon(category.slug, category.name);

                  return (
                    <Link
                      key={category.id}
                      href={`/find-work?category=${category.slug}`}
                      className={`group relative flex flex-col justify-between overflow-hidden rounded-sm sm:rounded-sm p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl border min-h-[230px] sm:min-h-[250px] ${themeStyles.card}`}
                    >

                      {/* Middle Section: Tên danh mục từ DB + Mô tả từ DB (nếu có) bên trái, Huy hiệu icon tròn bên phải */}
                      <div className="flex items-start justify-between gap-3 my-4">
                        <div className="min-w-0 flex-1">
                          <h3
                            className={`text-lg sm:text-xl font-black tracking-tight leading-snug line-clamp-2 ${themeStyles.title}`}
                          >
                            {category.name}
                          </h3>

                          {/* Chỉ hiển thị description NẾU CÓ TRONG DATABASE, nếu null hoặc rỗng thì không hiển thị */}
                          {Boolean(category.description) && (
                            <p
                              className={`mt-2 text-xs leading-relaxed line-clamp-2 ${themeStyles.desc}`}
                            >
                              {category.description}
                            </p>
                          )}
                        </div>

                        {/* Circular Icon Badge */}
                        <div
                          className={`flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-108 ${themeStyles.iconBox}`}
                        >
                          <Icon className="size-5 sm:size-6" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── 3. AI Matching Banner Section (Matching User Image with Black Background) ── */}
        <section className="py-16 sm:py-20 bg-white dark:bg-zinc-950 border-t border-border/50">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            {/* Banner card container with solid black bg */}
            <div className="relative overflow-hidden rounded-[32px] bg-black text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-white/10">
              <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
                {/* Left Column: Heading, Description, White CTA button */}
                <div className="z-10 lg:col-span-7 xl:col-span-7 space-y-6">
                  <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl leading-[1.15] text-white">
                    {tAi("bannerTitle")}
                  </h2>

                  <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl">
                    {tAi("bannerDesc")}
                  </p>

                  <div className="pt-2">
                    <Link
                      href="/find-work"
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs sm:text-sm font-bold text-zinc-950 transition-all hover:bg-zinc-200 shadow-md"
                    >
                      <span>{tAi("bannerBtn")}</span>
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </div>
                </div>

                {/* Right Column: Layered Floating Visual (Portrait + Glass card + Sent widget) */}
                <div className="relative flex justify-center items-center lg:col-span-5 xl:col-span-5 pt-4 lg:pt-0">
                  <div className="relative flex items-center justify-center">
                    {/* Center Layer: Expert Portrait Card */}
                    <div className="relative w-64 sm:w-72 aspect-4/5 overflow-hidden rounded-[28px] bg-linear-to-b from-rose-900/60 to-zinc-900 shadow-2xl border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=85"
                        alt={tAi("expertName")}
                        className="h-full w-full object-cover object-top filter contrast-105"
                      />
                      {/* Bottom Gradient overlay with name & rating */}
                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/50 to-transparent p-4 pt-10 text-center">
                        <p className="text-sm sm:text-base font-bold text-white">
                          {tAi("expertName")} <span className="text-amber-400">★ 4.8</span>
                        </p>
                        <p className="text-xs text-zinc-300">
                          {tAi("expertRole")}
                        </p>
                      </div>
                    </div>

                    {/* Left Layer: Glassmorphism Floating Card (CRM automation / Smart matching) */}
                    <div className="absolute -left-6 sm:-left-10 top-10 sm:top-14 z-20 rounded-2xl border border-white/25 bg-black/40 backdrop-blur-xl p-3.5 sm:p-4 shadow-2xl text-white max-w-[170px] pointer-events-none">
                      <span className="inline-block rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[9px] font-semibold tracking-wider text-white">
                        {tAi("badgeTrending")}
                      </span>
                      <p className="mt-2 text-sm sm:text-base font-bold leading-tight text-white">
                        CRM
                        <br />
                        automation
                      </p>
                    </div>

                    {/* Right Layer: Sent Invitations Widget */}
                    <div className="absolute -right-4 sm:-right-8 bottom-4 sm:bottom-6 z-20 rounded-2xl bg-white p-3 shadow-2xl text-zinc-900 w-48 sm:w-56 border border-zinc-100 pointer-events-none">
                      <div className="space-y-2">
                        {/* Row 1 */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                              alt="Talent 1"
                              className="size-6 rounded-full object-cover shrink-0"
                            />
                            <div className="space-y-1">
                              <div className="h-1.5 w-12 bg-zinc-200 rounded-full" />
                              <div className="h-1 w-8 bg-zinc-100 rounded-full" />
                            </div>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 border border-emerald-200/50 shrink-0">
                            {tAi("sentPill")}
                          </span>
                        </div>

                        {/* Row 2 */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80"
                              alt="Talent 2"
                              className="size-6 rounded-full object-cover shrink-0"
                            />
                            <div className="space-y-1">
                              <div className="h-1.5 w-14 bg-zinc-200 rounded-full" />
                              <div className="h-1 w-9 bg-zinc-100 rounded-full" />
                            </div>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 border border-emerald-200/50 shrink-0">
                            {tAi("sentPill")}
                          </span>
                        </div>

                        {/* Row 3 */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80"
                              alt="Talent 3"
                              className="size-6 rounded-full object-cover shrink-0"
                            />
                            <div className="space-y-1">
                              <div className="h-1.5 w-10 bg-zinc-200 rounded-full" />
                              <div className="h-1 w-6 bg-zinc-100 rounded-full" />
                            </div>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 border border-emerald-200/50 shrink-0">
                            {tAi("sentPill")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. FAQs Section (Exactly matching uploaded Image) ── */}
        <section className="py-16 sm:py-24 bg-zinc-50/40 dark:bg-zinc-900/20 border-t border-border/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
              {/* Left Column: Big Elegant FAQs Title */}
              <div className="lg:col-span-4">
                <h2 className="text-4xl font-normal tracking-tight text-foreground sm:text-5xl lg:text-6xl font-sans">
                  {tFaqs("title")}
                </h2>
              </div>

              {/* Right Column: Accordion Questions */}
              <div className="lg:col-span-8 divide-y divide-zinc-200/80 dark:divide-zinc-800">
                {faqItems.map((item, idx) => {
                  const isOpen = openFaqIndices.includes(idx);

                  return (
                    <div key={idx} className="py-5 sm:py-6">
                      <button
                        type="button"
                        onClick={() => toggleFaq(idx)}
                        className="flex w-full items-center justify-between gap-4 text-left group"
                        aria-expanded={isOpen}
                      >
                        <span className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[#0069D3] transition-colors leading-snug">
                          {item.q}
                        </span>
                        <ChevronDown
                          className={`size-4 shrink-0 text-zinc-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#0069D3]" : ""
                            }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="mt-3.5 pr-6 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed animate-in fade-in-50 duration-200">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer trắng đen đơn giản */}
      <Footer />
      <BackToTop />
    </div>
  );
}
