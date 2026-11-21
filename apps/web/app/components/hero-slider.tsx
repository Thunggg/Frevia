"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { http } from "@/lib/http";

const FALLBACK_HERO_IMAGE =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80";

const HEADER_HEIGHT = "80px";

const TRUST_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
];

interface BannerItem {
  id: number;
  title: string;
  imageUrl: string | null;
  linkUrl: string | null;
  position: string;
  isActive: boolean;
}

export function HeroSlider() {
  const t = useTranslations("home.hero");
  const [banner, setBanner] = useState<BannerItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    http
      .get<{ banners: BannerItem[] }>("/api/banners?position=HOME_HERO")
      .then((res) => {
        if (cancelled) return;

        const active = res.data.banners?.[0];

        if (active?.imageUrl) {
          setBanner(active);
        }
      })
      .catch(() => {
        // Fallback silently if API fails
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const heroImageAlt = banner?.title || t("imageAlt");

  return (
    <section
      className="flex w-full items-center"
      style={{
        minHeight: `calc(100vh - ${HEADER_HEIGHT})`,
      }}
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center px-4 py-4 sm:px-6 lg:px-8">
        {/* Hero Card Container (Pipely Style) */}
        <div
          className="relative flex w-full items-center overflow-hidden rounded-[28px] border border-black/5 shadow-xl sm:rounded-[36px]"
          style={{
            minHeight: `calc(100vh - ${HEADER_HEIGHT} - 32px)`,
            backgroundImage: `url("${banner?.imageUrl || FALLBACK_HERO_IMAGE}")`,
            backgroundSize: "cover",
            backgroundPosition: "center right",
          }}
        >
          {/* Subtle Dark Gradient Overlay to guarantee text legibility on left side */}
          <div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/60 to-black/30 lg:to-transparent" />

          {/* Hero Content Grid */}
          <div className="relative z-10 grid w-full grid-cols-1 items-center gap-10 p-6 sm:p-12 lg:grid-cols-12 lg:gap-12 lg:p-16 xl:p-20">
            {/* Left Column: Heading, Subtitle, CTA buttons, Trust elements */}
            <div className="flex w-full flex-col items-start justify-center text-left lg:col-span-8 xl:col-span-7">
              {/* Main Heading (Matching Image: Expert insights. / Custom solutions.) */}
              <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                {t("titlePart1")}
                <br />
                <span className="text-blue-400">
                  {t("titlePart2")}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-zinc-200 sm:text-base lg:text-lg">
                {t("desc")}
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5 sm:gap-4">
                <Link
                  href="/find-work"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0069D3] hover:bg-blue-600 px-7 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
                >
                  <span>{t("findWorkBtn")}</span>
                  <ArrowRight className="size-4" />
                </Link>

                <Link
                  href="/profiles"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 px-7 py-3.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-md transition-all hover:scale-[1.02]"
                >
                  <span>{t("exploreExpertsBtn")}</span>
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>

              {/* Trust Section (Avatars stack + 10K+ badge + Subtitle) */}
              <div className="mt-10 pt-6 border-t border-white/15 w-full max-w-md">
                <div className="flex items-center gap-3">
                  {/* Overlapping Avatars */}
                  <div className="flex -space-x-2.5 overflow-hidden">
                    {TRUST_AVATARS.map((src, idx) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={idx}
                        src={src}
                        alt={`Trust avatar ${idx + 1}`}
                        className="inline-block size-9 rounded-full ring-2 ring-black/80 object-cover"
                      />
                    ))}
                    <div className="flex size-9 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white ring-2 ring-black/80">
                      10K+
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm font-medium text-zinc-300">
                    {t("consultantsTrust")}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: In case an active Banner from DB has a link or secondary badge */}
            {banner?.imageUrl && banner.linkUrl && (
              <div className="hidden lg:flex lg:col-span-4 xl:col-span-5 justify-end items-center">
                <a
                  href={banner.linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative overflow-hidden rounded-2xl border border-white/20 bg-black/40 backdrop-blur-md p-4 shadow-2xl transition-transform hover:scale-105 max-w-xs text-white"
                >
                  <p className="text-xs font-semibold text-blue-300">
                    Featured Sponsor
                  </p>
                  <p className="text-sm font-bold mt-1 line-clamp-2">
                    {heroImageAlt}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-300 mt-2 font-medium">
                    Khám phá ngay <ArrowUpRight className="size-3.5" />
                  </span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
