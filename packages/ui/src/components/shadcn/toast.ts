"use client";

import { toast } from "@repo/ui/components/shadcn/sonner";

const errorStyle = {
  "--normal-bg":
    "light-dark(var(--destructive), color-mix(in oklab, var(--destructive) 60%, var(--background)))",
  "--normal-text": "var(--color-white)",
  "--normal-border": "transparent",
} as React.CSSProperties;

const successStyle = {
  "--normal-bg":
    "color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))",
  "--normal-text": "light-dark(var(--color-green-600), var(--color-green-400))",
  "--normal-border":
    "light-dark(var(--color-green-600), var(--color-green-400))",
} as React.CSSProperties;

const warningStyle = {
  "--normal-bg":
    "color-mix(in oklab, light-dark(var(--color-amber-600), var(--color-amber-400)) 15%, var(--background))",
  "--normal-text": "light-dark(var(--color-amber-800), var(--color-amber-300))",
  "--normal-border":
    "light-dark(var(--color-amber-500), var(--color-amber-400))",
} as React.CSSProperties;

export function toastError({
  message,
  className,
  duration,
}: {
  message: string;
  className?: string;
  duration?: number;
}) {
  return toast.error(message, {
    style: errorStyle,
    position: "top-right",
    className,
    duration: duration || 3000,
  });
}

export function toastWarning({
  message,
  className,
  duration,
}: {
  message: string;
  className?: string;
  duration?: number;
}) {
  return toast.warning(message, {
    style: warningStyle,
    position: "top-right",
    className,
    duration: duration || 4000,
  });
}

export function toastSuccess({
  message,
  className,
  duration,
}: {
  message: string;
  className?: string;
  duration?: number;
}) {
  return toast.success(message, {
    style: successStyle,
    position: "top-right",
    className,
    duration: duration || 3000,
  });
}
