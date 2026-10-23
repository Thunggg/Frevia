"use client";

import { toast } from "@repo/ui/components/shadcn/sonner";

type StatusToastOptions = {
  message: string;
  className?: string;
  duration?: number;
};

function getToastOptions({ className, duration }: StatusToastOptions) {
  return {
    className,
    duration: duration ?? 3000,
  };
}

export function toastError(options: StatusToastOptions) {
  return toast.error(options.message, getToastOptions(options));
}

export function toastSuccess(options: StatusToastOptions) {
  return toast.success(options.message, getToastOptions(options));
}

export function toastWarning(options: StatusToastOptions) {
  return toast.warning(options.message, getToastOptions(options));
}

export function toastInfo(options: StatusToastOptions) {
  return toast.info(options.message, getToastOptions(options));
}
