"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
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
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", title: t("sections.overview.toc"), icon: Gavel },
    { id: "eligibility", title: t("sections.eligibility.toc"), icon: Lock },
    { id: "profiles", title: t("sections.profiles.toc"), icon: Users },
    {
      id: "jobs-proposals",
      title: t("sections.jobsProposals.toc"),
      icon: FileText,
    },
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

  const sectionHeading =
    "text-xl sm:text-2xl font-bold tracking-tight text-zinc-900";

  const sectionContent =
    "space-y-3 text-sm sm:text-base leading-7 text-zinc-600";

  const numberStyle =
    "flex size-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-sm font-semibold text-zinc-900";

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-zinc-900">
      <Header role={headerRole} />

      <main className="flex-1">

        {/* CONTENT */}
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
            {/* TABLE OF CONTENTS */}
            <aside className="lg:col-span-3">
              <div className="lg:sticky lg:top-24">
                <h3 className="mb-5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {t("tocTitle")}
                </h3>

                <nav className="flex flex-col gap-1">
                  {sections.map((section, index) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;

                    return (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        onClick={() => setActiveSection(section.id)}
                        className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${isActive
                          ? "bg-zinc-100 font-semibold text-zinc-950"
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                          }`}
                      >
                        <span className="w-5 text-xs tabular-nums text-zinc-400">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <Icon className="size-4 shrink-0" />

                        <span className="truncate">{section.title}</span>
                      </a>
                    );
                  })}
                </nav>

                <div className="mt-8 border-t border-zinc-200 pt-5">
                  <p className="text-xs leading-6 text-zinc-500">
                    {t("tocFooterPrompt")}{" "}
                    <a
                      href="mailto:support@frevia.com"
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      support@frevia.com
                    </a>
                  </p>
                </div>
              </div>
            </aside>

            {/* DOCUMENT BODY */}
            <div className="lg:col-span-9">
              <div className="space-y-14">
                {/* NOTICE */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-950">
                    {t("noticeTitle")}
                  </h2>

                  <p className="text-sm leading-7 text-zinc-600 sm:text-base">
                    {t("noticeBody")}
                  </p>
                </div>

                {/* SECTION 1 */}
                <section id="overview" className="scroll-mt-28 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className={numberStyle}>01</span>
                    <h2 className={sectionHeading}>
                      {t("sections.overview.title")}
                    </h2>
                  </div>

                  <div className={`${sectionContent} pl-11`}>
                    <p>{t("sections.overview.p1")}</p>
                    <p>{t("sections.overview.p2")}</p>
                    <p>{t("sections.overview.p3")}</p>
                  </div>
                </section>

                {/* SECTION 2 */}
                <section id="eligibility" className="scroll-mt-28 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className={numberStyle}>02</span>
                    <h2 className={sectionHeading}>
                      {t("sections.eligibility.title")}
                    </h2>
                  </div>

                  <ul
                    className={`${sectionContent} list-disc space-y-3 pl-16`}
                  >
                    <li>
                      <strong className="font-semibold text-zinc-900">
                        {t("sections.eligibility.item1Label")}
                      </strong>{" "}
                      {t("sections.eligibility.item1Body")}
                    </li>

                    <li>
                      <strong className="font-semibold text-zinc-900">
                        {t("sections.eligibility.item2Label")}
                      </strong>{" "}
                      {t("sections.eligibility.item2Body")}
                    </li>

                    <li>
                      <strong className="font-semibold text-zinc-900">
                        {t("sections.eligibility.item3Label")}
                      </strong>{" "}
                      {t("sections.eligibility.item3Body")}
                    </li>

                    <li>
                      <strong className="font-semibold text-zinc-900">
                        {t("sections.eligibility.item4Label")}
                      </strong>{" "}
                      {t("sections.eligibility.item4Body")}
                    </li>
                  </ul>
                </section>

                {/* SECTION 3 */}
                <section id="profiles" className="scroll-mt-28 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className={numberStyle}>03</span>
                    <h2 className={sectionHeading}>
                      {t("sections.profiles.title")}
                    </h2>
                  </div>

                  <div className={`${sectionContent} pl-11`}>
                    <p>{t("sections.profiles.p1")}</p>
                    <p>{t("sections.profiles.p2")}</p>
                    <p>{t("sections.profiles.p3")}</p>
                  </div>
                </section>

                {/* SECTION 4 */}
                <section
                  id="jobs-proposals"
                  className="scroll-mt-28 space-y-5"
                >
                  <div className="flex items-center gap-3">
                    <span className={numberStyle}>04</span>
                    <h2 className={sectionHeading}>
                      {t("sections.jobsProposals.title")}
                    </h2>
                  </div>

                  <div className={`${sectionContent} pl-11`}>
                    <p>{t("sections.jobsProposals.p1")}</p>
                    <p>{t("sections.jobsProposals.p2")}</p>
                  </div>
                </section>

                {/* SECTION 5 */}
                <section
                  id="contracts-milestones"
                  className="scroll-mt-28 space-y-5"
                >
                  <div className="flex items-center gap-3">
                    <span className={numberStyle}>05</span>
                    <h2 className={sectionHeading}>
                      {t("sections.contractsMilestones.title")}
                    </h2>
                  </div>

                  <div className={`${sectionContent} pl-11`}>
                    <p>{t("sections.contractsMilestones.p1")}</p>
                    <p>{t("sections.contractsMilestones.p2")}</p>
                    <p>{t("sections.contractsMilestones.p3")}</p>
                  </div>
                </section>

                {/* SECTION 6 */}
                <section id="payments" className="scroll-mt-28 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className={numberStyle}>06</span>
                    <h2 className={sectionHeading}>
                      {t("sections.payments.title")}
                    </h2>
                  </div>

                  <ul
                    className={`${sectionContent} list-disc space-y-3 pl-16`}
                  >
                    <li>
                      <strong className="font-semibold text-zinc-900">
                        {t("sections.payments.item1Label")}
                      </strong>{" "}
                      {t("sections.payments.item1Body")}
                    </li>

                    <li>
                      <strong className="font-semibold text-zinc-900">
                        {t("sections.payments.item2Label")}
                      </strong>{" "}
                      {t("sections.payments.item2Body")}
                    </li>

                    <li>
                      <strong className="font-semibold text-zinc-900">
                        {t("sections.payments.item3Label")}
                      </strong>{" "}
                      {t("sections.payments.item3Body")}
                    </li>

                    <li>
                      <strong className="font-semibold text-zinc-900">
                        {t("sections.payments.item4Label")}
                      </strong>{" "}
                      {t("sections.payments.item4Body")}
                    </li>
                  </ul>
                </section>

                {/* SECTION 7 */}
                <section id="disputes" className="scroll-mt-28 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className={numberStyle}>07</span>
                    <h2 className={sectionHeading}>
                      {t("sections.disputes.title")}
                    </h2>
                  </div>

                  <div className={`${sectionContent} pl-11`}>
                    <p>{t("sections.disputes.p1")}</p>
                    <p>{t("sections.disputes.p2")}</p>
                  </div>
                </section>

                {/* SECTION 8 */}
                <section id="conduct" className="scroll-mt-28 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className={numberStyle}>08</span>
                    <h2 className={sectionHeading}>
                      {t("sections.conduct.title")}
                    </h2>
                  </div>

                  <div className={`${sectionContent} pl-11`}>
                    <p>{t("sections.conduct.p1")}</p>
                    <p>{t("sections.conduct.p2")}</p>
                  </div>
                </section>

                {/* SECTION 9 */}
                <section
                  id="intellectual-property"
                  className="scroll-mt-28 space-y-5"
                >
                  <div className="flex items-center gap-3">
                    <span className={numberStyle}>09</span>
                    <h2 className={sectionHeading}>
                      {t("sections.intellectualProperty.title")}
                    </h2>
                  </div>

                  <div className={`${sectionContent} pl-11`}>
                    <p>{t("sections.intellectualProperty.p1")}</p>
                    <p>{t("sections.intellectualProperty.p2")}</p>
                    <p>{t("sections.intellectualProperty.p3")}</p>
                  </div>
                </section>

                {/* SECTION 10 */}
                <section id="termination" className="scroll-mt-28 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className={numberStyle}>10</span>
                    <h2 className={sectionHeading}>
                      {t("sections.termination.title")}
                    </h2>
                  </div>

                  <div className={`${sectionContent} pl-11`}>
                    <p>{t("sections.termination.p1")}</p>
                    <p>{t("sections.termination.p2")}</p>
                  </div>
                </section>

                {/* CONTACT */}
                <div className="border-t border-zinc-200 pt-8">
                  <h3 className="text-lg font-bold text-zinc-950">
                    {t("contactCard.title")}
                  </h3>

                  <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600">
                    {t("contactCard.body")}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href="mailto:support@frevia.com"
                      className="inline-flex items-center justify-center rounded-md bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                    >
                      {t("contactCard.contactSupport")}
                    </a>

                    <Link
                      href="/privacy-policy"
                      className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
                    >
                      {t("contactCard.viewPrivacyPolicy")}
                    </Link>
                  </div>
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