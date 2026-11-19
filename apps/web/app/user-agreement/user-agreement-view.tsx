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
  CreditCard,
  AlertTriangle,
  MessageSquare,
  Users,
} from "@/components/icons";
import { Header, type UserRole } from "@/components/header";
import { Footer } from "@/components/footer";

type Props = {
  headerRole: UserRole;
};

export function UserAgreementView({ headerRole }: Props) {
  const t = useTranslations("userAgreement");
  const [activeSection, setActiveSection] = useState<string>("overview");

  const sections = [
    { id: "overview", title: t("sections.overview.toc"), icon: Gavel },
    { id: "eligibility", title: t("sections.eligibility.toc"), icon: Lock },
    { id: "profiles", title: t("sections.profiles.toc"), icon: Users },
    { id: "jobs-proposals", title: t("sections.jobsProposals.toc"), icon: FileText },
    {
      id: "contracts-milestones",
      title: t("sections.contractsMilestones.toc"),
      icon: CheckCircle2,
    },
    { id: "payments", title: t("sections.payments.toc"), icon: CreditCard },
    { id: "disputes", title: t("sections.disputes.toc"), icon: AlertTriangle },
    { id: "conduct", title: t("sections.conduct.toc"), icon: MessageSquare },
    {
      id: "intellectual-property",
      title: t("sections.intellectualProperty.toc"),
      icon: ShieldCheck,
    },
    {
      id: "termination",
      title: t("sections.termination.toc"),
      icon: AlertTriangle,
    },
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
                <FileText className="size-3.5" />
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
                      href="mailto:support@frevia.com"
                      className="font-semibold text-[#4fae2e] underline hover:text-[#3f9225]"
                    >
                      support@frevia.com
                    </a>
                  </p>
                </div>
              </div>
            </aside>

            {/* Document Body */}
            <div className="lg:col-span-8 space-y-12">
              {/* Notice Box */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-foreground/90 dark:text-foreground/85 leading-relaxed">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="size-5 shrink-0 text-[#4fae2e] mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {t("noticeTitle")}
                    </h4>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                      {t("noticeBody")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 1 */}
              <section id="overview" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    1
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("sections.overview.title")}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>{t("sections.overview.p1")}</p>
                  <p>{t("sections.overview.p2")}</p>
                  <p>{t("sections.overview.p3")}</p>
                </div>
              </section>

              {/* Section 2 */}
              <section id="eligibility" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    2
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("sections.eligibility.title")}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-foreground">
                        {t("sections.eligibility.item1Label")}
                      </strong>{" "}
                      {t("sections.eligibility.item1Body")}
                    </li>
                    <li>
                      <strong className="text-foreground">
                        {t("sections.eligibility.item2Label")}
                      </strong>{" "}
                      {t("sections.eligibility.item2Body")}
                    </li>
                    <li>
                      <strong className="text-foreground">
                        {t("sections.eligibility.item3Label")}
                      </strong>{" "}
                      {t("sections.eligibility.item3Body")}
                    </li>
                    <li>
                      <strong className="text-foreground">
                        {t("sections.eligibility.item4Label")}
                      </strong>{" "}
                      {t("sections.eligibility.item4Body")}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 3 */}
              <section id="profiles" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    3
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("sections.profiles.title")}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>{t("sections.profiles.p1")}</p>
                  <p>{t("sections.profiles.p2")}</p>
                  <p>{t("sections.profiles.p3")}</p>
                </div>
              </section>

              {/* Section 4 */}
              <section id="jobs-proposals" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    4
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("sections.jobsProposals.title")}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>{t("sections.jobsProposals.p1")}</p>
                  <p>{t("sections.jobsProposals.p2")}</p>
                </div>
              </section>

              {/* Section 5 */}
              <section id="contracts-milestones" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    5
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("sections.contractsMilestones.title")}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>{t("sections.contractsMilestones.p1")}</p>
                  <p>{t("sections.contractsMilestones.p2")}</p>
                  <p>{t("sections.contractsMilestones.p3")}</p>
                </div>
              </section>

              {/* Section 6 */}
              <section id="payments" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    6
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("sections.payments.title")}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-foreground">
                        {t("sections.payments.item1Label")}
                      </strong>{" "}
                      {t("sections.payments.item1Body")}
                    </li>
                    <li>
                      <strong className="text-foreground">
                        {t("sections.payments.item2Label")}
                      </strong>{" "}
                      {t("sections.payments.item2Body")}
                    </li>
                    <li>
                      <strong className="text-foreground">
                        {t("sections.payments.item3Label")}
                      </strong>{" "}
                      {t("sections.payments.item3Body")}
                    </li>
                    <li>
                      <strong className="text-foreground">
                        {t("sections.payments.item4Label")}
                      </strong>{" "}
                      {t("sections.payments.item4Body")}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 7 */}
              <section id="disputes" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    7
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("sections.disputes.title")}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>{t("sections.disputes.p1")}</p>
                  <p>{t("sections.disputes.p2")}</p>
                </div>
              </section>

              {/* Section 8 */}
              <section id="conduct" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    8
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("sections.conduct.title")}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>{t("sections.conduct.p1")}</p>
                  <p>{t("sections.conduct.p2")}</p>
                </div>
              </section>

              {/* Section 9 */}
              <section id="intellectual-property" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    9
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("sections.intellectualProperty.title")}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>{t("sections.intellectualProperty.p1")}</p>
                  <p>{t("sections.intellectualProperty.p2")}</p>
                  <p>{t("sections.intellectualProperty.p3")}</p>
                </div>
              </section>

              {/* Section 10 */}
              <section id="termination" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4fae2e]/10 text-sm font-bold text-[#4fae2e]">
                    10
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t("sections.termination.title")}
                  </h2>
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground pl-11">
                  <p>{t("sections.termination.p1")}</p>
                  <p>{t("sections.termination.p2")}</p>
                </div>
              </section>

              {/* Contact Card */}
              <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
                <h3 className="text-base font-semibold text-foreground">
                  {t("contactCard.title")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {t("contactCard.body")}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href="mailto:support@frevia.com"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#4fae2e] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-[#439c27]"
                  >
                    {t("contactCard.contactSupport")}
                  </a>
                  <Link
                    href="/privacy-policy"
                    className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    {t("contactCard.viewPrivacyPolicy")}
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

