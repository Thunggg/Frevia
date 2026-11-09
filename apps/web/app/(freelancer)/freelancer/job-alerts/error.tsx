"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "@/components/icons";

import { Button } from "@repo/ui/components/shadcn/button";

export default function JobAlertsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("jobAlerts");

  useEffect(() => {
    console.error("Job alerts page error:", error);
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
      <Button
        onClick={() => reset()}
        className="mt-6 rounded-full bg-[#4fae2e] text-white hover:bg-[#459928] gap-2"
      >
        <RotateCcw className="size-4" />
        {t("retry")}
      </Button>
    </div>
  );
}

