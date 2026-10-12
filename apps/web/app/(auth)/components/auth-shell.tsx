import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";

import styles from "./auth-shell.module.css";

type AuthShellProps = {
  title: string;
  description: string;
  imageSrc: string;
  panelTitle?: string;
  panelDescription?: string;
  children: ReactNode;
};

export function AuthShell({
  title,
  description,
  imageSrc,
  panelTitle,
  panelDescription,
  children,
}: AuthShellProps) {
  return (
    <div className="flex min-h-dvh font-sans">
      <aside className="sticky top-0 hidden h-dvh w-[42%] overflow-hidden lg:block">
        <Image
          src={imageSrc}
          alt=""
          fill
          priority
          sizes="42vw"
          className={`object-cover object-center ${styles.media}`}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(168deg,rgba(234,248,223,0.97)_0%,rgba(180,225,155,0.82)_30%,rgba(79,174,46,0.35)_60%,rgba(18,51,31,0.65)_100%)] dark:bg-[linear-gradient(168deg,rgba(22,23,22,0.98)_0%,rgba(26,28,26,0.95)_40%,rgba(18,18,18,0.92)_100%)]"
        />
        <div className="absolute left-0 top-0 h-1 w-20 bg-[#4fae2e] lg:block" />
        <div className="relative z-10 p-10 xl:p-12">
          <Link
            href="/"
            className={`flex items-center gap-3 ${styles.reveal} ${styles.delay1}`}
          >
            <Image
              src="/frevia-mark.png"
              alt=""
              width={40}
              height={40}
              className="size-10 object-contain"
              priority
            />
            <span className="text-3xl font-bold tracking-tight text-[#4fae2e]">
              Frevia
            </span>
          </Link>

          {(panelTitle || panelDescription) && (
            <div className={`mt-10 max-w-sm ${styles.reveal} ${styles.delay2}`}>
              {panelTitle ? (
                <p className="text-2xl font-bold leading-snug tracking-tight text-foreground xl:text-3xl">
                  {panelTitle}
                </p>
              ) : null}
              {panelDescription ? (
                <p className="mt-3 text-sm leading-relaxed text-foreground/60 dark:text-foreground/65">
                  {panelDescription}
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div
          aria-hidden
          className={`absolute bottom-10 left-10 right-10 ${styles.reveal} ${styles.delay3}`}
        >
          <p className="text-xs leading-relaxed text-foreground/50 dark:text-foreground/40">
            A curated marketplace connecting talented freelancers with
            visionary clients.
          </p>
          <div className="mt-3 flex items-center gap-3 text-[11px] text-foreground/35 dark:text-foreground/30">
            <span>&copy; {new Date().getFullYear()} Frevia</span>
            <span className="text-foreground/15">·</span>
            <Link href="/forum" className="transition-colors hover:text-[#4fae2e]/70">
              Help Center
            </Link>
            <span className="text-foreground/15">·</span>
            <Link href="/forum" className="transition-colors hover:text-[#4fae2e]/70">
              Guidelines
            </Link>
          </div>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col overflow-y-auto bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_5%,rgba(79,174,46,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_85%_5%,rgba(79,174,46,0.1),transparent_50%)]"
        />

        <div className="relative flex min-h-dvh flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
          <div className="absolute right-4 top-4 sm:right-8 sm:top-6 lg:right-12">
            <ThemeToggle />
          </div>

          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/frevia-mark.png"
                alt=""
                width={32}
                height={32}
                className="size-8 object-contain"
                priority
              />
              <span className="text-2xl font-bold tracking-tight text-[#4fae2e]">
                Frevia
              </span>
            </Link>
          </div>

          <div
            className={`mx-auto w-full max-w-md ${styles.reveal} ${styles.delay3}`}
          >
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
