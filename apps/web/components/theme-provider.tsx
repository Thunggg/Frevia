"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

// Filter out false-positive React 19 / development warnings:
// 1. next-themes injecting an inline script tag
// 2. Browser extensions (Bitwarden, 1Password, Dashlane, Chrome autofill) injecting attributes like fdprocessedid
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const errorString = args
      .map((arg) => {
        if (typeof arg === "string") return arg;
        if (arg instanceof Error) return `${arg.message} ${arg.stack ?? ""}`;
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(" ");

    const isExtensionAttributeMismatch =
      errorString.includes("fdprocessedid") ||
      errorString.includes("cz-shortcut-listen") ||
      errorString.includes("data-new-gr-c-s-check-loaded") ||
      errorString.includes("data-gr-ext-installed") ||
      errorString.includes("data-dashlane") ||
      errorString.includes("data-lastpass") ||
      errorString.includes("data-1p-ignore");

    if (
      errorString.includes("Encountered a script tag") ||
      isExtensionAttributeMismatch ||
      (errorString.includes("hydration-mismatch") &&
        errorString.includes("browser extension") &&
        isExtensionAttributeMismatch)
    ) {
      return;
    }

    originalError.apply(console, args);
  };
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
