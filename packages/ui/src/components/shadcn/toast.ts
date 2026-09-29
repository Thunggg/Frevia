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

export function toastError(message: string, className?: string) {
  return toast.error(message, {
    style: errorStyle,
    position: "top-right",
    className,
  });
}

export function toastSuccess(message: string, className?: string) {
  return toast.success(message, {
    style: successStyle,
    position: "top-right",
    className,
  });
}
