"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BannerPosition } from "@shared/types";
import { http } from "@/lib/http";

interface BannerSlotProps {
  position: BannerPosition;
  className?: string;
}

// Chiều cao hiển thị theo từng vị trí banner (object-cover sẽ crop gọn đẹp).
const BANNER_HEIGHTS: Record<BannerPosition, string> = {
  GLOBAL_HEADER: "h-12 sm:h-14",
  HOME_HERO: "h-40 sm:h-64",
  HOME_BODY: "h-36 sm:h-56",
  SEARCH_RESULTS: "h-36 sm:h-56",
  FOOTER: "h-36 sm:h-56",
};

// Vị trí hiển thị banner trên giao diện người dùng.
// Vì mỗi position chỉ được phép có 1 banner active, component chỉ render khi có banner hợp lệ.
export function BannerSlot({ position, className }: BannerSlotProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    http
      .get<{ banners: { imageUrl: string | null; linkUrl: string | null; title: string }[] }>(
        `/api/banners?position=${position}`,
      )
      .then((res) => {
        if (cancelled) return;
        const banner = res.data.banners[0];
        setImageUrl(banner?.imageUrl ?? null);
        setLinkUrl(banner?.linkUrl ?? null);
        setTitle(banner?.title ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setImageUrl(null);
          setLinkUrl(null);
          setTitle(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [position]);

  if (!imageUrl || !title) return null;

  const frameClass = `block w-full overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-border/40 transition-shadow duration-200 ${
    BANNER_HEIGHTS[position]
  }`;

  const imageElement = (
    // eslint-disable-next-line @next/next/no-img-element -- banner image from Cloudinary
    <img
      src={imageUrl}
      alt={title}
      className="h-full w-full object-cover"
    />
  );

  return (
    <div className={className}>
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {linkUrl ? (
          <Link
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${frameClass} hover:ring-border/70 hover:shadow-md`}
          >
            {imageElement}
          </Link>
        ) : (
          <div className={frameClass}>{imageElement}</div>
        )}
      </div>
    </div>
  );
}