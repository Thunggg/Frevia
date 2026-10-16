import React from "react";
import { cn } from "@repo/ui/lib/utils";

export interface VerifiedBadgeProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  text?: string;
  showText?: boolean;
}

export function VerifiedBadge({
  className,
  size = "sm",
  text = "Verified",
  showText = true,
}: VerifiedBadgeProps) {
  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-[10px] gap-1",
    sm: "px-2 py-0.5 text-[11px] gap-1.5",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  };

  const iconWrapClasses = {
    xs: "size-3.5",
    sm: "size-4",
    md: "size-4.5",
    lg: "size-5",
  };

  const svgClasses = {
    xs: "size-2.5",
    sm: "size-3",
    md: "size-3.5",
    lg: "size-4",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold transition-colors shrink-0",
        "bg-[#EBF3FE] dark:bg-[#0069D3]/15 border border-[#D0E1F8] dark:border-[#0069D3]/30",
        "text-[#0069D3] dark:text-[#60a5fa]",
        sizeClasses[size],
        className
      )}
      title="Verified Freelancer"
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-[#D0E1F8] dark:bg-[#0069D3]/30 shrink-0",
          iconWrapClasses[size]
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className={cn("fill-[#0069D3] dark:fill-[#38bdf8] shrink-0", svgClasses[size])}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 12-scalloped seal badge matching reference */}
          <path d="M10.29 2.29a2.4 2.4 0 0 1 3.42 0l1.22 1.22a2.4 2.4 0 0 0 1.7.7h1.72a2.4 2.4 0 0 1 2.4 2.4v1.72a2.4 2.4 0 0 0 .7 1.7l1.22 1.22a2.4 2.4 0 0 1 0 3.42l-1.22 1.22a2.4 2.4 0 0 0-.7 1.7v1.72a2.4 2.4 0 0 1-2.4 2.4h-1.72a2.4 2.4 0 0 0-1.7.7l-1.22 1.22a2.4 2.4 0 0 1-3.42 0l-1.22-1.22a2.4 2.4 0 0 0-1.7-.7h-1.72a2.4 2.4 0 0 1-2.4-2.4v-1.72a2.4 2.4 0 0 0-.7-1.7l-1.22-1.22a2.4 2.4 0 0 1 0-3.42l1.22-1.22a2.4 2.4 0 0 0 .7-1.7V6.33a2.4 2.4 0 0 1 2.4-2.4h1.72a2.4 2.4 0 0 0 1.7-.7l1.22-1.22z" />
          <path
            d="M8.8 12.2l2.3 2.3 4.9-4.9"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </span>
      {showText && <span className="leading-none select-none">{text}</span>}
    </span>
  );
}
