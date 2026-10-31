"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/shadcn/dropdown-menu";
import { Check, Languages } from "@/components/icons";
import { setLocaleCookie } from "@/i18n/actions";
import { isLocale, locales, localeLabels, type Locale } from "@/i18n/config";

export function LanguageSwitcher() {
  const activeLocale = useLocale();
  const t = useTranslations("language");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const selectLocale = (nextLocale: string) => {
    if (!isLocale(nextLocale) || nextLocale === activeLocale) return;

    const targetLocale: Locale = nextLocale;

    startTransition(async () => {
      await setLocaleCookie(targetLocale);
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("switchTo")}
          disabled={isPending}
          className="rounded-full p-2 text-foreground transition-colors hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
        >
          <Languages className="size-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onSelect={() => selectLocale(locale)}
            className="cursor-pointer gap-2"
          >
            <Check
              className={`size-4 ${
                locale === activeLocale ? "opacity-100" : "opacity-0"
              }`}
            />
            {localeLabels[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
