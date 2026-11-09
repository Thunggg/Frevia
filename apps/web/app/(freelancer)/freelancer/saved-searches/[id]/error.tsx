"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, ArrowLeft, RotateCcw } from "@/components/icons";

import { Button } from "@repo/ui/components/shadcn/button";

export default function SavedSearchDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("savedSearches");

  useEffect(() => {
    console.error("Saved search detail error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center font-sans">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
        <AlertTriangle className="size-7" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground">
        {t("errorTitle")}
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {t("errorDescription")}
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button
          asChild
          variant="outline"
          className="rounded-full gap-2 text-xs"
        >
          <Link href="/freelancer/saved-searches">
            <ArrowLeft className="size-4" />
            {t("breadcrumb")}
          </Link>
        </Button>
        <Button
          onClick={() => reset()}
          className="rounded-full bg-[#4fae2e] text-white hover:bg-[#459928] gap-2 text-xs"
        >
          <RotateCcw className="size-4" />
          {t("retry")}
        </Button>
      </div>
    </div>
  );
}
