"use client";

import { useTranslations } from "next-intl";
import { Activity, FileText, FolderGit2, Layers } from "lucide-react";

export type MilestoneTabKey = "overview" | "submissions" | "files" | "activity";

interface MilestoneDetailTabsProps {
  activeTab: MilestoneTabKey;
  onTabChange: (tab: MilestoneTabKey) => void;
  submissionCount?: number;
  fileCount?: number;
  canViewSubmissions?: boolean;
  canViewFiles?: boolean;
}

export function MilestoneDetailTabs({
  activeTab,
  onTabChange,
  submissionCount = 0,
  fileCount = 0,
  canViewSubmissions = true,
  canViewFiles = true,
}: MilestoneDetailTabsProps) {
  const t = useTranslations("milestoneWorkspace.tabs");
  const allTabs = [
    {
      key: "overview" as const,
      label: t("overview"),
      icon: Layers,
      visible: true,
    },
    {
      key: "submissions" as const,
      label: t("submissions"),
      icon: FolderGit2,
      count: submissionCount,
      visible: canViewSubmissions,
    },
    {
      key: "files" as const,
      label: t("files"),
      icon: FileText,
      count: fileCount,
      visible: canViewFiles,
    },
    {
      key: "activity" as const,
      label: t("activity"),
      icon: Activity,
      visible: true,
    },
  ];

  const tabs = allTabs.filter((t) => t.visible);

  return (
    <div className="flex h-8 items-center gap-1 overflow-x-auto rounded-full bg-[#F1F0F5] p-1 text-xs dark:bg-muted w-fit scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`
              inline-flex h-6 cursor-pointer items-center gap-1.5
              whitespace-nowrap rounded-full px-3
              font-medium transition-all text-xs
              ${
                isActive
                  ? "bg-background font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            <Icon className="size-3" />
            <span>{tab.label}</span>
            {typeof tab.count === "number" && tab.count > 0 && (
              <span
                className={`
                  rounded-full px-1.5 py-0 text-[10px] font-semibold leading-tight
                  ${
                    isActive
                      ? "bg-[#0069D3]/10 text-[#0069D3]"
                      : "bg-muted-foreground/15 text-muted-foreground"
                  }
                `}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
