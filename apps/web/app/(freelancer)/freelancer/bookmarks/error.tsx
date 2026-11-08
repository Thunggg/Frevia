"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, RefreshCw } from "@/components/icons";
import { Button } from "@repo/ui/components/shadcn/button";

export default function BookmarksError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("bookmarks");
  const tCommon = useTranslations("common");

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center font-sans min-h-[450px]">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
        <AlertTriangle className="size-7" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground">
        {t("loadFailedTitle", { defaultValue: "Couldn't load saved jobs" })}
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {t("loadFailedDesc", {
          defaultValue:
            "An error occurred while loading your bookmarked jobs. Please try again.",
        })}
      </p>
      <Button
        onClick={() => reset()}
        className="mt-6 gap-2 rounded-full bg-[#4fae2e] text-white hover:bg-[#459928] cursor-pointer"
      >
        <RefreshCw className="size-4" />
        <span>{tCommon("tryAgain", { defaultValue: "Try again" })}</span>
      </Button>
    </div>
  );
}

