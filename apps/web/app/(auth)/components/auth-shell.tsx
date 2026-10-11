import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

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
      <aside className="relative hidden w-[42%] overflow-hidden lg:block">
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
          className="absolute inset-0 bg-[linear-gradient(160deg,#eaf8df_0%,rgba(234,248,223,0.88)_38%,rgba(18,51,31,0.55)_100%)] dark:bg-[linear-gradient(160deg,#12331f_0%,rgba(18,51,31,0.92)_45%,rgba(18,51,31,0.72)_100%)]"
        />
        <div className="relative z-10 p-10 xl:p-12">
          <Link
            href="/"
            className={`flex items-center gap-3 ${styles.reveal} ${styles.delay1}`}
          >
            <Image
              src="/Logo.png"
              alt=""
              width={40}
              height={40}
              className="size-10 object-contain"
              priority
            />
            <span className="text-3xl font-semibold tracking-tight text-[#4fae2e]">
              Frevia
            </span>
          </Link>

          {(panelTitle || panelDescription) && (
            <div className={`mt-8 max-w-sm ${styles.reveal} ${styles.delay2}`}>
              {panelTitle ? (
                <p className="text-xl font-semibold tracking-tight text-foreground xl:text-2xl">
                  {panelTitle}
                </p>
              ) : null}
              {panelDescription ? (
                <p className="mt-2 text-sm leading-relaxed text-foreground/70 dark:text-foreground/75">
                  {panelDescription}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_90%_0%,rgba(79,174,46,0.08),transparent_45%)] dark:bg-[radial-gradient(ellipse_at_90%_0%,rgba(79,174,46,0.12),transparent_45%)]"
        />

        <div className="relative flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/Logo.png"
                alt=""
                width={32}
                height={32}
                className="size-8 object-contain"
                priority
              />
              <span className="text-2xl font-semibold tracking-tight text-[#4fae2e]">
                Frevia
              </span>
            </Link>
          </div>

          <div
            className={`mx-auto w-full max-w-md ${styles.reveal} ${styles.delay3}`}
          >
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
