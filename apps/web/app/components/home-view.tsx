import Image from "next/image";
import Link from "next/link";

import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import { Button } from "@repo/ui/components/shadcn/button";
import { RoleName, type GetMeResType } from "@shared/types";

import styles from "./home-view.module.css";

type HomeViewProps = {
  user: GetMeResType | null;
};

function resolveHeaderRole(user: GetMeResType | null): UserRole {
  if (!user) return "GUEST";

  const primaryRole =
    user.roles.find((role) => role.isPrimary) ?? user.roles[0];

  if (primaryRole?.name === RoleName.CLIENT) return "CLIENT";
  if (primaryRole?.name === RoleName.FREELANCER) return "FREELANCER";

  return "FREELANCER";
}

export function HomeView({ user }: HomeViewProps) {
  const role = resolveHeaderRole(user);
  const isLoggedIn = Boolean(user);
  const displayName = user?.profile?.displayName ?? "there";
  const isClient = role === "CLIENT";
  const primaryHref = isClient ? "/projects" : "/find-work";
  const primaryLabel = isClient ? "Go to My Jobs" : "Find Work";
  const pathHeadline = isClient
    ? "Manage your jobs"
    : "Browse open projects";
  const pathBody = isClient
    ? "Post work, review proposals, and keep active projects moving."
    : "Discover projects that match your skills and apply with confidence.";
  const headline = isLoggedIn
    ? `Welcome back, ${displayName}`
    : "Work that finds the right people";
  const subtext = isLoggedIn
    ? "Pick up projects, hire talent, or join the community forum."
    : "A calm marketplace to hire freelancers, find work, and share what you learn.";

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={role} />

      <main className="flex-1">
        <section className="relative isolate min-h-[calc(100dvh-4.5rem)] overflow-hidden border-b border-[#4fae2e]/15 dark:border-[#4fae2e]/25">
          <div className={`absolute inset-0 ${styles.heroMedia}`}>
            <Image
              src="/home/hero.jpg"
              alt="Collaborative workspace with soft green light"
              fill
              priority
              sizes="100vw"
              className={`object-cover object-center ${styles.heroMediaImg}`}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(105deg,#eaf8df_0%,#eaf8df_42%,rgba(234,248,223,0.72)_58%,rgba(234,248,223,0.28)_100%)] dark:bg-[linear-gradient(105deg,#12331f_0%,#12331f_44%,rgba(18,51,31,0.78)_62%,rgba(18,51,31,0.35)_100%)]"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,rgba(79,174,46,0.18),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_20%_30%,rgba(79,174,46,0.22),transparent_55%)]"
            />
          </div>

          <div className="relative mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-7xl flex-col justify-center px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-20 lg:pt-14">
            <div className="max-w-xl lg:max-w-136">
              <div
                className={`flex items-center gap-3 ${styles.reveal} ${styles.revealDelay1}`}
              >
                <Image
                  src="/Logo.png"
                  alt=""
                  width={48}
                  height={48}
                  className="size-12 object-contain"
                  priority
                />
                <span className="text-4xl font-semibold tracking-tight text-[#4fae2e] sm:text-5xl">
                  Frevia
                </span>
              </div>

              <h1
                className={`mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15] ${styles.reveal} ${styles.revealDelay2}`}
              >
                {headline}
              </h1>

              <p
                className={`mt-4 max-w-[36ch] text-base leading-relaxed text-foreground/70 sm:text-lg dark:text-foreground/75 ${styles.reveal} ${styles.revealDelay3}`}
              >
                {subtext}
              </p>

              <div
                className={`mt-8 flex flex-wrap items-center gap-3 ${styles.reveal} ${styles.revealDelay4}`}
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-[#4fae2e] text-white hover:bg-[#459928] active:scale-[0.98] dark:bg-[#4fae2e] dark:text-white dark:hover:bg-[#5bc03a]"
                >
                  <Link href={primaryHref}>{primaryLabel}</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-[#4fae2e]/35 bg-background/50 text-foreground backdrop-blur-sm hover:border-[#4fae2e]/55 hover:bg-[#eaf8df]/60 active:scale-[0.98] dark:border-[#4fae2e]/40 dark:bg-[#12331f]/40 dark:hover:bg-[#12331f]/70"
                >
                  <Link href="/forum">Visit Forum</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div
            className={`mx-auto grid max-w-7xl items-stretch gap-8 px-4 py-16 sm:px-6 md:grid-cols-12 md:gap-10 md:py-20 lg:px-8 ${styles.sectionReveal}`}
          >
            <div className="flex flex-col justify-center md:col-span-7">
              <h2 className="max-w-[20ch] text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {pathHeadline}
              </h2>
              <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
                {pathBody}
              </p>
            </div>

            <Link
              href={primaryHref}
              className="group relative flex min-h-36 flex-col justify-end overflow-hidden rounded-xl bg-[#eaf8df] p-6 transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#dff5cf] active:scale-[0.99] md:col-span-5 md:min-h-44 dark:bg-[#12331f] dark:hover:bg-[#184029]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-[#4fae2e]/15 dark:bg-[#4fae2e]/20"
              />
              <span className="relative flex items-center justify-between gap-3 text-xl font-semibold tracking-tight text-foreground">
                {primaryLabel}
                <span
                  aria-hidden
                  className="text-[#4fae2e] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                >
                  →
                </span>
              </span>
            </Link>
          </div>
        </section>

        <section className="bg-[#eaf8df]/45 dark:bg-[#12331f]/55">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-16 lg:px-8">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Talk shop in the forum
            </h2>
            <p className="mt-3 max-w-[50ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
              Ask questions, share tips, and learn from freelancers and clients
              building on Frevia.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
