"use client";

import { toast } from "@repo/ui/components/shadcn/sonner";

const errorStyle = {
  "--normal-text": "var(--color-red-600)",
} as React.CSSProperties;

const successStyle = {
  "--normal-text": "light-dark(var(--color-green-600), var(--color-green-400))",
} as React.CSSProperties;

const warningStyle = {
  "--normal-text": "light-dark(var(--color-amber-800), var(--color-amber-300))",
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
