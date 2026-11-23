"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border-t border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 lg:gap-16">
          {/* ── Left Column: Brand & Info ── */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-3xl font-aquire tracking-tight font-extrabold sm:text-4xl text-zinc-950 dark:text-white">
                frevia
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-sm">
              {t("brandTagline")}
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="flex size-9 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 transition-colors hover:border-zinc-900 hover:bg-zinc-900 hover:text-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
              >
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="flex size-9 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 transition-colors hover:border-zinc-900 hover:bg-zinc-900 hover:text-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
              >
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34m1.39 9.74v-8.37H5.07v8.37h2.78z" />
                </svg>
              </a>

              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X (Twitter)"
                className="flex size-9 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 transition-colors hover:border-zinc-900 hover:bg-zinc-900 hover:text-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
              >
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* ── Right Column: Navigation Links ── */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {/* Group 1: Platform */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                {t("platform")}
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                <li>
                  <Link
                    href="/find-work"
                    className="hover:text-zinc-950 dark:hover:text-white transition-colors"
                  >
                    {t("findWork")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profiles"
                    className="hover:text-zinc-950 dark:hover:text-white transition-colors"
                  >
                    {t("expertsAndFreelancers")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="hover:text-zinc-950 dark:hover:text-white transition-colors"
                  >
                    {t("becomeFreelancer")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Group 2: Community */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                {t("community")}
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                <li>
                  <Link
                    href="/forum"
                    className="hover:text-zinc-950 dark:hover:text-white transition-colors"
                  >
                    {t("talksForum")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="hover:text-zinc-950 dark:hover:text-white transition-colors"
                  >
                    {t("helpCenter")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Group 3: Legal */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                {t("legal")}
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                <li>
                  <Link
                    href="/user-agreement"
                    className="hover:text-zinc-950 dark:hover:text-white transition-colors"
                  >
                    {t("termsAndConditions")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="hover:text-zinc-950 dark:hover:text-white transition-colors"
                  >
                    {t("privacyPolicy")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Bottom Row: Copyright & Branding ── */}
        <div className="mt-12 border-t border-zinc-200 dark:border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <p>{t("rights", { year })}</p>
          <p className="text-[11px] text-zinc-400">
            {t("poweredBy")}
          </p>
        </div>
      </div>
    </footer>
  );
}
