"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { http } from "@/lib/http";
import type { BannerAdminItemType } from "@shared/types";

export function ProjectHeroBanner() {
  const [banner, setBanner] = useState<BannerAdminItemType | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    http
      .get<{ banners: BannerAdminItemType[] }>("/api/banners?position=HOME_HERO")
      .then((res) => {
        if (cancelled) return;
        const active = res.data?.banners?.[0] ?? null;
        if (active?.imageUrl) {
          setBanner(active);
        }
      })
      .catch(() => {
        // Fallback to project default banner image if API fails or empty
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const imageUrl = banner?.imageUrl || "/banner/image.png";
  const title = banner?.title || "Frevia - Freelancer Marketplace Platform";
  const linkUrl = banner?.linkUrl;

  const content = (
    <div className="relative w-full h-36 sm:h-52 md:h-60 overflow-hidden rounded-2xl border border-border/80 bg-muted shadow-xs transition-shadow hover:shadow-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={title}
        className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.01]"
      />
    </div>
  );

  if (linkUrl) {
    return (
      <Link
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </Link>
    );
  }

  return content;
}

