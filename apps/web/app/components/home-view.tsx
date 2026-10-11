import Link from "next/link";

import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import { Button } from "@repo/ui/components/shadcn/button";
import { RoleName, type GetMeResType } from "@shared/types";

import { BackToTop } from "./back-to-top";
import { HeroSlider } from "./hero-slider";
import { RevealOnScroll } from "./reveal-on-scroll";
import { SkillsHighlight } from "./skills-highlight";
import styles from "./home-view.module.css";

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

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={role} />

      <main className="flex-1">
        {/* ── Hero Carousel (full-width) ── */}
        <section className="w-full">
          <HeroSlider />
        </section>

        {/* ── Partners ── */}
        <section className="border-y border-border/50 bg-background">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
            <RevealOnScroll>
              <p className="mb-8 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">
                Trusted by forward-thinking teams
              </p>
            </RevealOnScroll>
            <div className={styles.partnersRow}>
              {PARTNERS.map((partner, i) => (
                <RevealOnScroll key={partner.src} delayMs={i * 70}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- SVG wordmarks need currentColor via img */}
                  <img
                    src={partner.src}
                    alt={partner.alt}
                    width={partner.width}
                    height={32}
                    className={`${styles.partnerLogo} opacity-40 grayscale dark:opacity-50 dark:invert`}
                    style={{ animationDelay: `${i * 0.6}s` }}
                  />
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ── Skills ── */}
        <section className="border-b border-border/40 bg-background">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-20">
              <RevealOnScroll>
                <div className="max-w-lg lg:sticky lg:top-28">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4fae2e]/70">
                    Discover
                  </p>
                  <h2
                    className={`${styles.display} mt-3 text-3xl leading-tight tracking-tight text-foreground sm:text-4xl`}
                  >
                    Skills that get found
                  </h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-foreground/50 dark:text-foreground/60">
                    Categories clients search for — highlighted as they surface
                    on Frevia.
                  </p>
                  <div className="mt-8 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/40">
                      15 skills
                    </span>
                    <div className="h-px flex-1 bg-border/50" />
                  </div>
                </div>
              </RevealOnScroll>
              <RevealOnScroll delayMs={90}>
                <div>
                  <SkillsHighlight />
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </section>

        {/* ── Community ── */}
        <section className="border-b border-border/40 bg-background">
          <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 sm:py-32">
            <RevealOnScroll>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4fae2e]/70">
                Community
              </p>
              <h2
                className={`${styles.display} text-3xl leading-tight tracking-tight text-foreground sm:text-4xl`}
              >
                Talk shop with peers
              </h2>
            </RevealOnScroll>
            <RevealOnScroll delayMs={90}>
              <p className="mx-auto mt-5 max-w-[40ch] text-base leading-relaxed text-foreground/50 sm:text-lg dark:text-foreground/60">
                Ask questions, share tips, and learn from freelancers and
                clients building on Frevia.
              </p>
            </RevealOnScroll>
            <RevealOnScroll delayMs={160}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
                <Button
                  asChild
                  size="lg"
                  className={`${styles.ctaPrimary} min-w-[11rem] bg-[#4fae2e] px-8 text-sm font-semibold text-white shadow-lg shadow-[#4fae2e]/20 hover:bg-[#459928] dark:shadow-[#4fae2e]/25 dark:hover:bg-[#5bc03a]`}
                >
                  <Link href="/forum">Join the Forum</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className={`${styles.ctaSecondary} min-w-[9rem] border-border/60 bg-transparent text-sm font-medium text-foreground/70 hover:border-[#4fae2e]/40 hover:bg-[#4fae2e]/5 hover:text-foreground dark:border-white/10 dark:text-foreground/60 dark:hover:border-[#4fae2e]/30 dark:hover:bg-[#4fae2e]/10`}
                >
                  <Link href="/register">Get started</Link>
                </Button>
              </div>
            </RevealOnScroll>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
