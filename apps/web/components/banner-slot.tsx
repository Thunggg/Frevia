"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BannerPosition } from "@shared/types";
import { http } from "@/lib/http";

interface BannerSlotProps {
  position: BannerPosition;
  className?: string;
}

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

  const content = (
    // eslint-disable-next-line @next/next/no-img-element -- banner image from Cloudinary
    <img
      src={imageUrl}
      alt={title}
      className="h-full w-full object-cover"
    />
  );

  return (
    <div className={className}>
      {linkUrl ? (
        <Link href={linkUrl} target="_blank" rel="noopener noreferrer">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}