import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  renderFindWorkPage,
  type FindWorkSearchParams,
} from "../load-find-work-page";
import type { HomeTab } from "../find-work-content";

const VALID_TABS: HomeTab[] = [
  "best-matches",
  "most-recent",
  "saved-searches",
  "saved-jobs",
  "invites",
];

type FreelancerFindWorkTabProps = {
  params: Promise<{ tab: string }>;
  searchParams: FindWorkSearchParams;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tab: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("findWork");
  const { tab } = await params;

  let titleSuffix = "Best Matches";
  try {
    if (tab === "most-recent") titleSuffix = t("mostRecent");
    else if (tab === "saved-jobs") titleSuffix = t("savedJobs");
    else if (tab === "saved-searches") titleSuffix = t("savedSearches");
    else if (tab === "invites") titleSuffix = t("invites");
    else titleSuffix = t("bestMatches");
  } catch {
    if (tab === "most-recent") titleSuffix = "Most Recent";
    else if (tab === "saved-jobs") titleSuffix = "Saved Jobs";
    else if (tab === "saved-searches") titleSuffix = "Saved Searches";
    else if (tab === "invites") titleSuffix = "Invites";
  }

  return {
    title: `${titleSuffix} | ${t("metaTitle")}`,
    description: t("subtitle"),
  };
}

export default async function FreelancerFindWorkTabPage({
  params,
  searchParams,
}: FreelancerFindWorkTabProps) {
  const { tab } = await params;

  if (!VALID_TABS.includes(tab as HomeTab)) {
    notFound();
  }

  return renderFindWorkPage({
    searchParams,
    tab: tab as HomeTab,
    basePath: `/freelancer/find-work/${tab}`,
  });
}
