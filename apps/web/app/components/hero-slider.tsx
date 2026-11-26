
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { http } from "@/lib/http";

const FALLBACK_HERO_IMAGE =
  "https://i.pinimg.com/1200x/39/c0/ff/39c0ffbced02cc233ff42865fa394c68.jpg";

// CHANGE: Điều chỉnh chiều cao Header
const HEADER_HEIGHT = "80px";

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
        // Use fallback background if API fails
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const heroImageAlt = banner?.title || t("imageAlt");

  const imageCard = (
    <div className="group relative aspect-4/3 w-full max-w-lg overflow-hidden rounded-2xl border border-white/20 shadow-lg sm:rounded-3xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner?.imageUrl || ""}
        alt={heroImageAlt}
        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
      />

      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />
    </div>
  );

  return (
    <section
      className="flex w-full items-center"
      style={{
        minHeight: `calc(100vh - ${HEADER_HEIGHT})`,
      }}
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center px-4 py-3 sm:px-6 lg:px-8">

        {/* Hero Container */}
        <div
          className="relative flex w-full items-center overflow-hidden rounded-[28px] border border-black/5 shadow-xs sm:rounded-[32px]"
          style={{
            minHeight: `calc(100vh - ${HEADER_HEIGHT} - 24px)`,
            backgroundImage: `url("${FALLBACK_HERO_IMAGE}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Background Overlay */}
          <div className="absolute inset-0 bg-black/45" />

          {/* Content */}
          <div className="relative z-10 grid w-full grid-cols-1 items-center gap-8 p-6 sm:p-10 lg:grid-cols-12 lg:gap-12 lg:p-14 xl:p-16">

            {/* Left Column: API Banner */}
            {banner?.imageUrl && (
              <div className="relative flex items-center justify-center lg:col-span-5 lg:col-start-1 lg:row-start-1">
                {banner.linkUrl ? (
                  <a
                    href={banner.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full max-w-lg"
                  >
                    {imageCard}
                  </a>
                ) : (
                  <div className="w-full max-w-lg">
                    {imageCard}
                  </div>
                )}
              </div>
            )}

            {/* Right Column: Content */}
            <div className="flex w-full flex-col items-end justify-center text-right lg:col-span-7 lg:col-start-6 lg:row-start-1">

              {/* Heading */}
              <h1 className="w-full text-right text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl xl:text-6xl">
                {t("titlePart1")}
                <br />
                <span className="text-blue-300">
                  {t("titlePart2")}
                </span>
              </h1>

              {/* Description */}
              <p className="mt-5 w-full max-w-xl text-right text-sm leading-relaxed text-white/85 sm:text-base">
                {t("desc")}
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex w-full flex-wrap items-center justify-end gap-3">
                <Link
                  href="/find-work"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0069D3] px-6 py-3.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 hover:shadow-lg sm:text-sm"
                >
                  <span>{t("findWorkBtn")}</span>
                  <ArrowRight className="size-4" />
                </Link>

                <Link
                  href="/profiles"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/50 bg-white/10 px-6 py-3.5 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:text-sm"
                >
                  <span>{t("exploreExpertsBtn")}</span>
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
