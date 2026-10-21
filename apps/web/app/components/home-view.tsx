import Link from "next/link";

import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import { RoleName, type GetMeResType } from "@shared/types";

import { Button } from "@repo/ui/components/shadcn/button";
import { BackToTop } from "./back-to-top";
import { BannerSlot } from "@/components/banner-slot";
import { HeroSlider } from "./hero-slider";
import { RevealOnScroll } from "./reveal-on-scroll";
import { SkillsHighlight } from "./skills-highlight";
import styles from "./home-view.module.css";

const PARTNERS = [
  {
    name: "Google",
    path: "M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z",
  },
  {
    name: "Microsoft",
    path: "M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z",
  },
  {
    name: "Amazon",
    path: "M13.67 19.38c-3.79 2.8-9.03 4.31-13.67 1.25-.63-.42-.09-1.07.56-.73 3.32 1.76 7.42 2.81 10.8 1.07 1.34-.69 3.01-1.99 3.01-1.99.7-.49 1.16.14.3.4zM23.6 19.38c-.37-.47-2.45-.24-3.41-.12-.34.04-.39-.24-.09-.45 1.95-1.39 5.12-.99 5.56-.45.44.53-.41 3.73-2.27 5.25-.29.24-.56.11-.43-.2.43-1.03 1.34-3.56.64-4.48zM15.46 8.71c0-1.78-.17-3.31-.96-4.52C13.25 2.29 11.39 1.5 9.17 1.5c-3.73 0-6.9 2.11-7.79 5.86-.18.76.39.92.83.92.51 0 .8-.35.94-.85.73-2.67 2.76-4.22 6.02-4.22 1.83 0 3.36.63 4.19 1.63.78.93.93 2.14.93 3.51v.79c-2.31.06-4.83.18-7.05.94-2.88.98-4.53 2.84-4.53 5.43 0 3.1 2.22 5.09 5.52 5.09 2.5 0 4.32-1.08 5.41-2.61l.07-.09.31 1.95c.08.49.43.76.85.76.43 0 .76-.29.83-.78l.86-5.74V8.71h-.09zm-2.03 6.13c0 .87-.27 1.84-.96 2.52-.77.77-1.89 1.13-3.08 1.13-2.02 0-3.36-1.1-3.36-2.92 0-2.31 1.92-3.36 4.88-3.54 1.05-.06 2.05-.09 2.52-.15v2.96z",
  },
  {
    name: "Spotify",
    path: "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z",
  },
  {
    name: "Netflix",
    path: "M5.398 0v.006c.038 2.062.068 4.125.105 6.188.087 4.793.18 9.585.275 14.378.006.27.013.54.019.811.26-.06.52-.12.782-.182 1.325-.308 2.65-.615 3.975-.923.003-.021.006-.042.008-.063.07-.367.14-.734.21-1.101.173-.902.346-1.803.52-2.705.419-2.18.838-4.36 1.257-6.541.054-.282.108-.564.162-.846l4.28 14.07c1.393-.323 2.787-.647 4.18-.97.003-.01.005-.02.007-.03V0h-4.364v15.228L7.697 0H5.398z",
  },
  {
    name: "Airbnb",
    path: "M12 0c-4.48 0-7.39 3.49-7.39 7.42 0 3.39 1.95 6.69 4.3 9.87 1.08 1.47 2.21 2.82 3.09 3.82.88-1 2.01-2.35 3.09-3.82 2.35-3.18 4.3-6.48 4.3-9.87C19.39 3.49 16.48 0 12 0zm0 18.24c-2.09-2.58-5.39-7.05-5.39-10.82C6.61 4.54 8.7 2 12 2s5.39 2.54 5.39 5.42c0 3.77-3.3 8.24-5.39 10.82zM12 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  },
  {
    name: "Stripe",
    path: "M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.745 6.19 2.04 4.79 3.308 4.01 5.143 4.01 7.408c0 4.417 2.76 6.036 6.549 7.374 2.379.845 3.197 1.479 3.197 2.457 0 .979-.831 1.48-2.253 1.48-1.928 0-4.789-.963-6.719-2.072l-.946 5.548C5.467 22.84 8.44 24 11.758 24c2.617 0 4.788-.732 6.254-2.054 1.465-1.322 2.24-3.232 2.24-5.632-.013-4.484-2.825-6.098-6.276-7.164z",
  },
  {
    name: "Meta",
    path: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm2.712 15.344c-1.315 0-2.417-.674-3.08-1.68-.382.593-.974 1.082-1.696 1.385-.722.303-1.536.368-2.31.185-.775-.182-1.464-.61-1.954-1.21-.491-.6-.757-1.353-.746-2.13.023-1.637 1.155-2.998 2.684-3.23 1.162-.177 2.348.163 3.238.93v-.08c0-.75-.24-1.306-.722-1.67-.48-.364-1.173-.546-2.078-.546-.78 0-1.657.17-2.63.51l-.546-1.572c1.23-.464 2.45-.696 3.66-.696 1.455 0 2.59.362 3.407 1.086.817.724 1.226 1.777 1.226 3.16v4.618h1.492v1.542h-1.492v.871zm-2.016-3.262c-.328-.507-.803-.896-1.36-1.115-.558-.22-1.172-.25-1.748-.087-.905.257-1.527 1.077-1.527 2.013 0 .546.183 1.065.513 1.453.33.388.795.614 1.297.632.55.02 1.084-.168 1.51-.53.426-.363.69-.877.747-1.433l.568-.933z",
  },
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

      <BannerSlot position="GLOBAL_HEADER" className="border-b border-border/50 bg-background" />

      <main className="flex-1">
        <section className="w-full">
          <HeroSlider />
        </section>

        <BannerSlot position="HOME_HERO" className="border-b border-border/50 bg-background" />

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
                <RevealOnScroll key={partner.name} delayMs={i * 70}>
                  <svg
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label={partner.name}
                    width="24"
                    height={32}
                    fill="currentColor"
                    className={`${styles.partnerLogo} opacity-40 grayscale dark:opacity-50 dark:invert`}
                    style={{ animationDelay: `${i * 0.6}s` }}
                  >
                    <path d={partner.path} />
                  </svg>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ── Skills ── */}
        <section className="border-b border-border/40 bg-background/50 py-10 sm:py-10">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 bg-[#F6F5F9] dark:bg-zinc-900/60 dark:border dark:border-white/5 rounded-2xl">
            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
              <RevealOnScroll className="lg:col-span-5">
                <div className="max-w-lg lg:sticky lg:top-28">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">
                    Discover
                  </p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Skills that get found
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    Categories clients search for — highlighted as they surface on Frevia.
                  </p>
                </div>
              </RevealOnScroll>

              <RevealOnScroll delayMs={90} className="lg:col-span-7">
                <SkillsHighlight />
              </RevealOnScroll>
            </div>
          </div>
        </section>

        <BannerSlot position="HOME_BODY" className="border-b border-border/50 bg-background" />

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
                  className={`min-w-[11rem] bg-[#4fae2e] px-8 text-sm font-semibold text-white shadow-lg shadow-[#4fae2e]/20 hover:bg-[#459928] dark:shadow-[#4fae2e]/25 dark:hover:bg-[#5bc03a]`}
                >
                  <Link href="/forum">Join the Forum</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className={`min-w-[9rem] border-border/60 bg-transparent text-sm font-medium text-foreground/70 hover:border-[#4fae2e]/40 hover:bg-[#4fae2e]/5 hover:text-foreground dark:border-white/10 dark:text-foreground/60 dark:hover:border-[#4fae2e]/30 dark:hover:bg-[#4fae2e]/10`}
                >
                  <Link href="/register">Get started</Link>
                </Button>
              </div>
            </RevealOnScroll>
          </div>
        </section>
      </main>

      <BannerSlot position="FOOTER" className="border-b border-border/50 bg-background" />

      <Footer />
      <BackToTop />
    </div>
  );
}
