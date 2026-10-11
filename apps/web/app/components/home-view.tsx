import Image from "next/image";
import Link from "next/link";
import { Fraunces } from "next/font/google";

import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import { Button } from "@repo/ui/components/shadcn/button";
import { RoleName, type GetMeResType } from "@shared/types";

import { HeroSlider } from "./hero-slider";
import { RevealOnScroll } from "./reveal-on-scroll";
import { SkillsHighlight } from "./skills-highlight";
import styles from "./home-view.module.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-home-display",
  display: "swap",
});

const PARTNERS = [
  { src: "/home/partners/northwind.svg", alt: "Northwind", width: 148 },
  { src: "/home/partners/brightly.svg", alt: "Brightly", width: 128 },
  { src: "/home/partners/cascade.svg", alt: "Cascade", width: 132 },
  { src: "/home/partners/orbit-labs.svg", alt: "Orbit Labs", width: 142 },
  { src: "/home/partners/harbor-co.svg", alt: "Harbor Co", width: 138 },
] as const;

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

  const primaryHref = !isLoggedIn
    ? "/register"
    : isClient
      ? "/projects"
      : "/find-work";
  const primaryLabel = !isLoggedIn
    ? "Get started"
    : isClient
      ? "Go to My Jobs"
      : "Find Work";

  const headline = isLoggedIn
    ? `Welcome back, ${displayName}`
    : "Work finds the right people";
  const subtext = isLoggedIn
    ? "Continue where you left off: projects, freelancers, or the community forum."
    : "Hire freelancers, find paid work, and grow with a community that stays calm and clear.";

  return (
    <div
      className={`${display.variable} flex min-h-dvh flex-col bg-background font-sans`}
    >
      <Header role={role} />

      <main className="flex-1">
        <section
          className={`border-b border-[#4fae2e]/12 dark:border-[#4fae2e]/20 ${styles.heroBand}`}
        >
          <div className="mx-auto max-w-3xl px-4 pb-8 pt-14 text-center sm:px-6 sm:pb-10 sm:pt-20 lg:pt-24">
            <div
              className={`inline-flex items-center justify-center gap-2.5 ${styles.reveal} ${styles.revealDelay1}`}
            >
              <Image
                src="/Logo.png"
                alt=""
                width={40}
                height={40}
                className="size-10 object-contain"
                priority
              />
              <span className="text-2xl font-semibold tracking-tight text-[#4fae2e] sm:text-3xl">
                Frevia
              </span>
            </div>

            <h1
              className={`${styles.display} mt-8 text-[2.15rem] leading-[1.15] tracking-tight text-foreground sm:text-5xl sm:leading-[1.12] lg:text-[3.25rem] ${styles.reveal} ${styles.revealDelay2}`}
            >
              {headline}
            </h1>

            <p
              className={`mx-auto mt-5 max-w-[40ch] text-base leading-relaxed text-foreground/65 sm:text-lg dark:text-foreground/75 ${styles.reveal} ${styles.revealDelay3}`}
            >
              {subtext}
            </p>

            <div
              className={`mt-9 flex flex-wrap items-center justify-center gap-3 ${styles.reveal} ${styles.revealDelay4}`}
            >
              <Button
                asChild
                size="lg"
                className={`${styles.ctaPrimary} min-w-40 bg-[#4fae2e] px-8 text-white hover:bg-[#459928] dark:bg-[#4fae2e] dark:text-white dark:hover:bg-[#5bc03a]`}
              >
                <Link href={primaryHref}>{primaryLabel}</Link>
              </Button>
              {!isLoggedIn ? (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className={`${styles.ctaSecondary} min-w-36 border-[#4fae2e]/35 bg-transparent text-foreground hover:border-[#4fae2e]/55 hover:bg-[#eaf8df]/70 dark:border-[#4fae2e]/40 dark:hover:bg-[#4fae2e]/15`}
                >
                  <Link href="/login">Log in</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className={`${styles.ctaSecondary} min-w-36 border-[#4fae2e]/35 bg-transparent text-foreground hover:border-[#4fae2e]/55 hover:bg-[#eaf8df]/70 dark:border-[#4fae2e]/40 dark:hover:bg-[#4fae2e]/15`}
                >
                  <Link href="/forum">Visit Forum</Link>
                </Button>
              )}
            </div>
          </div>

          <div
            className={`mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6 sm:pb-14 ${styles.reveal} ${styles.revealDelay5}`}
          >
            <HeroSlider />
          </div>
        </section>

        <section className="border-b border-border bg-background">
          <div className={styles.partnersRow}>
            {PARTNERS.map((partner, i) => (
              <RevealOnScroll key={partner.src} delayMs={i * 70}>
                {/* eslint-disable-next-line @next/next/no-img-element -- SVG wordmarks need currentColor via img */}
                <img
                  src={partner.src}
                  alt={partner.alt}
                  width={partner.width}
                  height={32}
                  className={`${styles.partnerLogo} opacity-50 grayscale dark:opacity-60 dark:invert`}
                  style={{ animationDelay: `${i * 0.6}s` }}
                />
              </RevealOnScroll>
            ))}
          </div>
        </section>

        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <RevealOnScroll>
              <h2
                className={`${styles.display} text-3xl leading-tight tracking-tight text-foreground sm:text-4xl`}
              >
                Skills that get found
              </h2>
            </RevealOnScroll>
            <RevealOnScroll delayMs={90}>
              <p className="mx-auto mt-4 max-w-[42ch] text-base leading-relaxed text-foreground/65 sm:text-lg dark:text-foreground/75">
                Categories clients search for — highlighted as they surface on
                Frevia.
              </p>
            </RevealOnScroll>
            <RevealOnScroll delayMs={160}>
              <div className="mt-10">
                <SkillsHighlight />
              </div>
            </RevealOnScroll>
          </div>
        </section>

        <section className="bg-[#f4faf0] dark:bg-[#1a1c1a]">
          <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 sm:py-24">
            <RevealOnScroll>
              <h2
                className={`${styles.display} text-3xl leading-tight tracking-tight text-foreground sm:text-4xl`}
              >
                Talk shop in the community
              </h2>
            </RevealOnScroll>
            <RevealOnScroll delayMs={90}>
              <p className="mx-auto mt-5 max-w-[40ch] text-base leading-relaxed text-foreground/65 sm:text-lg dark:text-foreground/75">
                Ask questions, share tips, and learn from freelancers and
                clients building on Frevia.
              </p>
            </RevealOnScroll>
            <RevealOnScroll delayMs={160}>
              <Button
                asChild
                size="lg"
                variant="outline"
                className={`${styles.ctaSecondary} mt-9 min-w-40 border-[#4fae2e]/40 bg-transparent text-foreground hover:bg-[#eaf8df] dark:border-[#4fae2e]/40 dark:hover:bg-[#4fae2e]/15`}
              >
                <Link href="/forum">Visit Forum</Link>
              </Button>
            </RevealOnScroll>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
