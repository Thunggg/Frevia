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
  const [activeSection, setActiveSection] = useState("collection");

  const sections = [
    {
      id: "principles",
      title: t("sections.principles.toc"),
      icon: ShieldCheck,
    },
    {
      id: "collection",
      title: t("sections.collection.toc"),
      icon: FileText,
    },
    {
      id: "usage",
      title: t("sections.usage.toc"),
      icon: CheckCircle2,
    },
    {
      id: "third-parties",
      title: t("sections.thirdParties.toc"),
      icon: Shield,
    },
    {
      id: "security",
      title: t("sections.security.toc"),
      icon: Lock,
    },
    {
      id: "user-rights",
      title: t("sections.userRights.toc"),
      icon: Gavel,
    },
    {
      id: "cookies",
      title: t("sections.cookies.toc"),
      icon: Eye,
    },
    {
      id: "contact",
      title: t("sections.contact.toc"),
      icon: AlertTriangle,
    },
  ];

  const sectionHeading =
    "text-xl sm:text-2xl font-bold tracking-tight text-zinc-900";

  const sectionContent =
    "space-y-3 text-sm sm:text-base leading-7 text-zinc-600";

  const numberStyle =
    "flex size-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-sm font-semibold text-zinc-900";

  const handleSectionClick = (id: string) => {
    setActiveSection(id);
  };

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
                        onClick={() => handleSectionClick(section.id)}
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
                      href="mailto:privacy@frevia.com"
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      privacy@frevia.com
                    </a>
                  </p>
                </div>
              </div>
            </aside>

            {/* DOCUMENT BODY */}
            <div className="lg:col-span-9">
              <div className="space-y-14">
                {/* INTRODUCTION */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-950">
                    {t("commitmentTitle")}
                  </h2>

                  <p className="text-sm leading-7 text-zinc-600 sm:text-base">
                    {t("commitmentBody")}
                  </p>
                </div>

                {/* SECTION 1 */}
                <section
                  id="principles"
                  className="scroll-mt-28 space-y-5"
                >
                  <div className="flex items-center gap-3">
                    <span className={numberStyle}>01</span>
                    <h2 className={sectionHeading}>
                      {t("sections.principles.title")}
                    </h2>
                  </div>

                  <div className={`${sectionContent} pl-11`}>
                    <p>{t("sections.principles.p1")}</p>
                    <p>{t("sections.principles.p2")}</p>
                  </div>
                </section>

                {/* SECTION 2 */}
                <section
                  id="collection"
                  className="scroll-mt-28 space-y-5"
                >
                  <div className="flex items-center gap-3">
                    <span className={numberStyle}>02</span>
                    <h2 className={sectionHeading}>
                      {t("sections.collection.title")}
                    </h2>
                  </div>

                  <div className={`${sectionContent} pl-11 space-y-6`}>
                    {[
                      {
                        title: t("sections.collection.card1Title"),
                        body: t("sections.collection.card1Body"),
                      },
                      {
                        title: t("sections.collection.card2Title"),
                        body: t("sections.collection.card2Body"),
                      },
                      {
                        title: t("sections.collection.card3Title"),
                        body: t("sections.collection.card3Body"),
                      },
                      {
                        title: t("sections.collection.card4Title"),
                        body: t("sections.collection.card4Body"),
                      },
                      {
                        title: t("sections.collection.card5Title"),
                        body: t("sections.collection.card5Body"),
                      },
                      {
                        title: t("sections.collection.card6Title"),
                        body: t("sections.collection.card6Body"),
                      },
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <h3 className="font-semibold text-zinc-900">
                          {index + 1}. {item.title}
                        </h3>

                        <p>{item.body}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* SECTION 3 */}
                <section id="usage" className="scroll-mt-28 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className={numberStyle}>03</span>
                    <h2 className={sectionHeading}>
                      {t("sections.usage.title")}
                    </h2>
                  </div>

                  <ul
                    className={`${sectionContent} list-disc space-y-3 pl-16`}
                  >
                    <li>
                      <strong className="font-semibold text-zinc-900">
                        {t("sections.usage.item1Label")}
                      </strong>{" "}
                      {t("sections.usage.item1Body")}
                    </li>

                    <li>
                      <strong className="font-semibold text-zinc-900">
                        {t("sections.usage.item2Label")}
                      </strong>{" "}
                      {t("sections.usage.item2Body")}
                    </li>

                    <li>
                      <strong className="font-semibold text-zinc-900">
                        {t("sections.usage.item3Label")}
                      </strong>{" "}
                      {t("sections.usage.item3Body")}
                    </li>

                    <li>
                      <strong className="font-semibold text-zinc-900">
                        {t("sections.usage.item4Label")}
                      </strong>{" "}
                      {t("sections.usage.item4Body")}
                    </li>

                    <li>
                      <strong className="font-semibold text-zinc-900">
                        {t("sections.usage.item5Label")}
                      </strong>{" "}
                      {t("sections.usage.item5Body")}
                    </li>
                  </ul>
                </section>

                {/* SECTION 4 */}
                <section
                  id="third-parties"
                  className="scroll-mt-28 space-y-5"
                >
                  <div className="flex items-center gap-3">
                    <span className={numberStyle}>04</span>
                    <h2 className={sectionHeading}>
                      {t("sections.thirdParties.title")}
                    </h2>
                  </div>

                  <div className={`${sectionContent} pl-11`}>
                    <p>{t("sections.thirdParties.intro")}</p>

                    <ul className="list-disc space-y-3 pl-5">
                      <li>
                        <strong className="font-semibold text-zinc-900">
                          Stripe:
                        </strong>{" "}
                        {t("sections.thirdParties.stripeBody")}
                      </li>

                      <li>
                        <strong className="font-semibold text-zinc-900">
                          Cloudinary:
                        </strong>{" "}
                        {t("sections.thirdParties.cloudinaryBody")}
                      </li>

                      <li>
                        <strong className="font-semibold text-zinc-900">
                          Google OAuth:
                        </strong>{" "}
                        {t("sections.thirdParties.googleBody")}
                      </li>
                    </ul>
                  </div>
                </section>

                {/* SECTION 5 */}
                <section id="security" className="scroll-mt-28 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className={numberStyle}>05</span>
                    <h2 className={sectionHeading}>
                      {t("sections.security.title")}
                    </h2>
                  </div>

                  <div className={`${sectionContent} pl-11`}>
                    <p>{t("sections.security.p1")}</p>
                    <p>{t("sections.security.p2")}</p>
                  </div>
                </section>

                {/* SECTION 6 */}
                <section
                  id="user-rights"
                  className="scroll-mt-28 space-y-5"
                >
                  <div className="flex items-center gap-3">
                    <span className={numberStyle}>06</span>
                    <h2 className={sectionHeading}>
                      {t("sections.userRights.title")}
                    </h2>
                  </div>

                  <ul
                    className={`${sectionContent} list-disc space-y-3 pl-16`}
                  >
                    <li>
                      <strong className="font-semibold text-zinc-900">
                        {t("sections.userRights.item1Label")}
                      </strong>{" "}
                      {t("sections.userRights.item1Body")}
                    </li>

                    <li>
                      <strong className="font-semibold text-zinc-900">
                        {t("sections.userRights.item2Label")}
                      </strong>{" "}
                      {t("sections.userRights.item2Body")}
                    </li>

                    <li>
                      <strong className="font-semibold text-zinc-900">
                        {t("sections.userRights.item3Label")}
                      </strong>{" "}
                      {t("sections.userRights.item3Body")}
                    </li>
                  </ul>
                </section>

                {/* SECTION 7 */}
                <section id="cookies" className="scroll-mt-28 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className={numberStyle}>07</span>
                    <h2 className={sectionHeading}>
                      {t("sections.cookies.title")}
                    </h2>
                  </div>

                  <div className={`${sectionContent} pl-11`}>
                    <p>{t("sections.cookies.intro")}</p>

                    <ul className="list-disc space-y-3 pl-5">
                      <li>
                        <strong className="font-semibold text-zinc-900">
                          accessToken:
                        </strong>{" "}
                        {t("sections.cookies.accessTokenBody")}
                      </li>

                      <li>
                        <strong className="font-semibold text-zinc-900">
                          locale / theme:
                        </strong>{" "}
                        {t("sections.cookies.localeThemeBody")}
                      </li>
                    </ul>
                  </div>
                </section>

                {/* SECTION 8 */}
                <section id="contact" className="scroll-mt-28 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className={numberStyle}>08</span>
                    <h2 className={sectionHeading}>
                      {t("sections.contact.title")}
                    </h2>
                  </div>

                  <div className={`${sectionContent} pl-11`}>
                    <p>{t("sections.contact.intro")}</p>

                    <p className="font-medium text-zinc-900">
                      {t("sections.contact.emailLabel")}{" "}
                      <a
                        href="mailto:privacy@frevia.com"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        privacy@frevia.com
                      </a>
                    </p>
                  </div>
                </section>

                {/* BOTTOM ACTION */}
                <div className="border-t border-zinc-200 pt-8">
                  <h3 className="text-lg font-bold text-zinc-950">
                    {t("actionCard.title")}
                  </h3>

                  <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600">
                    {t("actionCard.body")}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href="/user-agreement"
                      className="inline-flex items-center justify-center rounded-md bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                    >
                      {t("actionCard.viewAgreement")}
                    </Link>

                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
                    >
                      {t("actionCard.backToRegister")}
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