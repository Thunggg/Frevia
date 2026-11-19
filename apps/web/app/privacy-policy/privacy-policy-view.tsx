"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Lock,
  Gavel,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Shield,
} from "@/components/icons";
import { Header, type UserRole } from "@/components/header";
import { Footer } from "@/components/footer";

type Props = {
  headerRole: UserRole;
};

export function PrivacyPolicyView({ headerRole }: Props) {
  const t = useTranslations("privacyPolicy");
  const [activeSection, setActiveSection] = useState<string>("collection");

  const sections = [
    { id: "principles", title: t("sections.principles.toc"), icon: ShieldCheck },
    { id: "collection", title: t("sections.collection.toc"), icon: FileText },
    { id: "usage", title: t("sections.usage.toc"), icon: CheckCircle2 },
    { id: "third-parties", title: t("sections.thirdParties.toc"), icon: Shield },
    { id: "security", title: t("sections.security.toc"), icon: Lock },
    { id: "user-rights", title: t("sections.userRights.toc"), icon: Gavel },
    { id: "cookies", title: t("sections.cookies.toc"), icon: Eye },
    { id: "contact", title: t("sections.contact.toc"), icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Header role={headerRole} />

      <main className="flex-1">
        {/* Hero Header */}
        <div className="border-b border-border/60 bg-linear-to-b from-emerald-500/5 via-background to-background py-12 md:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-[#4fae2e] mb-6"
            >
              <ArrowLeft className="size-4" />
              <span>{t("backToHome")}</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-[#4fae2e] dark:text-emerald-400">
                <ShieldCheck className="size-3.5" />
                {t("badge")}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("lastModified")}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Content Layout */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-3 px-2">
                  {t("tocTitle")}
                </h3>
                <nav className="flex flex-col space-y-1">
                  {sections.map((section) => {
                    const IconComponent = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        onClick={() => setActiveSection(section.id)}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-[#4fae2e]/10 text-[#4fae2e] font-semibold"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                      >
                        <IconComponent className="size-4 shrink-0 text-[#4fae2e]" />
                        <span className="truncate">{section.title}</span>
                      </a>
                    );
                  })}
                </nav>

                <div className="mt-6 border-t border-border/60 pt-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("tocFooterPrompt")}{" "}
                    <a
                      href="mailto:privacy@frevia.com"
                      className="font-semibold text-[#4fae2e] underline hover:text-[#3f9225]"
                    >
                      privacy@frevia.com
                    </a>
                  </p>
                </div>
              </div>
            </aside>

            {/* Document Body */}
            <div className="lg:col-span-8 space-y-12">
              {/* Core Commitment Card */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-foreground/90 dark:text-foreground/85 leading-relaxed">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="size-5 shrink-0 text-[#4fae2e] mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {t("commitmentTitle")}
                    </h4>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                      {t("commitmentBody")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 1 */}
              <section id="principles" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    1
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("sections.principles.title")}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>{t("sections.principles.p1")}</p>
                  <p>{t("sections.principles.p2")}</p>
                </div>
              </section>

              {/* Section 2 */}
              <section id="collection" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    2
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("sections.collection.title")}
                  </h2>
                </div>
                <div className="space-y-4 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      {t("sections.collection.card1Title")}
                    </h3>
                    <p className="text-xs sm:text-sm">
                      {t("sections.collection.card1Body")}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      {t("sections.collection.card2Title")}
                    </h3>
                    <p className="text-xs sm:text-sm">
                      {t("sections.collection.card2Body")}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      {t("sections.collection.card3Title")}
                    </h3>
                    <p className="text-xs sm:text-sm">
                      {t("sections.collection.card3Body")}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      {t("sections.collection.card4Title")}
                    </h3>
                    <p className="text-xs sm:text-sm">
                      {t("sections.collection.card4Body")}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      {t("sections.collection.card5Title")}
                    </h3>
                    <p className="text-xs sm:text-sm">
                      {t("sections.collection.card5Body")}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      {t("sections.collection.card6Title")}
                    </h3>
                    <p className="text-xs sm:text-sm">
                      {t("sections.collection.card6Body")}
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section id="usage" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    3
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("sections.usage.title")}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-foreground">
                        {t("sections.usage.item1Label")}
                      </strong>{" "}
                      {t("sections.usage.item1Body")}
                    </li>
                    <li>
                      <strong className="text-foreground">
                        {t("sections.usage.item2Label")}
                      </strong>{" "}
                      {t("sections.usage.item2Body")}
                    </li>
                    <li>
                      <strong className="text-foreground">
                        {t("sections.usage.item3Label")}
                      </strong>{" "}
                      {t("sections.usage.item3Body")}
                    </li>
                    <li>
                      <strong className="text-foreground">
                        {t("sections.usage.item4Label")}
                      </strong>{" "}
                      {t("sections.usage.item4Body")}
                    </li>
                    <li>
                      <strong className="text-foreground">
                        {t("sections.usage.item5Label")}
                      </strong>{" "}
                      {t("sections.usage.item5Body")}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 4 */}
              <section id="third-parties" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    4
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("sections.thirdParties.title")}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>{t("sections.thirdParties.intro")}</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-foreground">Stripe:</strong>{" "}
                      {t("sections.thirdParties.stripeBody")}
                    </li>
                    <li>
                      <strong className="text-foreground">Cloudinary:</strong>{" "}
                      {t("sections.thirdParties.cloudinaryBody")}
                    </li>
                    <li>
                      <strong className="text-foreground">Google OAuth:</strong>{" "}
                      {t("sections.thirdParties.googleBody")}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 5 */}
              <section id="security" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    5
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("sections.security.title")}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>{t("sections.security.p1")}</p>
                  <p>{t("sections.security.p2")}</p>
                </div>
              </section>

              {/* Section 6 */}
              <section id="user-rights" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    6
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("sections.userRights.title")}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-foreground">
                        {t("sections.userRights.item1Label")}
                      </strong>{" "}
                      {t("sections.userRights.item1Body")}
                    </li>
                    <li>
                      <strong className="text-foreground">
                        {t("sections.userRights.item2Label")}
                      </strong>{" "}
                      {t("sections.userRights.item2Body")}
                    </li>
                    <li>
                      <strong className="text-foreground">
                        {t("sections.userRights.item3Label")}
                      </strong>{" "}
                      {t("sections.userRights.item3Body")}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 7 */}
              <section id="cookies" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    7
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("sections.cookies.title")}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>{t("sections.cookies.intro")}</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-foreground">accessToken:</strong>{" "}
                      {t("sections.cookies.accessTokenBody")}
                    </li>
                    <li>
                      <strong className="text-foreground">locale / theme:</strong>{" "}
                      {t("sections.cookies.localeThemeBody")}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 8 */}
              <section id="contact" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    8
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("sections.contact.title")}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>{t("sections.contact.intro")}</p>
                  <p className="font-semibold text-foreground">
                    {t("sections.contact.emailLabel")}{" "}
                    <a
                      href="mailto:privacy@frevia.com"
                      className="text-[#4fae2e] underline hover:text-[#3f9225]"
                    >
                      privacy@frevia.com
                    </a>
                  </p>
                </div>
              </section>

              {/* Action Card */}
              <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
                <h3 className="text-base font-semibold text-foreground">
                  {t("actionCard.title")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {t("actionCard.body")}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/user-agreement"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#4fae2e] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-[#439c27]"
                  >
                    {t("actionCard.viewAgreement")}
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    {t("actionCard.backToRegister")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

