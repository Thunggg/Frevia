"use client";

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
  const allTabs = [
    {
      key: "overview" as const,
      label: "Overview",
      icon: Layers,
      visible: true,
    },
    {
      key: "submissions" as const,
      label: "Submissions",
      icon: FolderGit2,
      count: submissionCount,
      visible: canViewSubmissions,
    },
    {
      key: "files" as const,
      label: "Files",
      icon: FileText,
      count: fileCount,
      visible: canViewFiles,
    },
    {
      key: "activity" as const,
      label: "Activity",
      icon: Activity,
      visible: true,
    },
  ];

  const tabs = allTabs.filter((t) => t.visible);

  return (
    <div className="flex h-9 items-center gap-1 overflow-x-auto rounded-full bg-[#F1F0F5] p-1 text-xs dark:bg-muted w-fit scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`
              inline-flex h-7 cursor-pointer items-center gap-1.5
              whitespace-nowrap rounded-full px-3.5
              font-medium transition-all
              ${
                isActive
                  ? "bg-background font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            <Icon className="size-3.5" />
            <span>{tab.label}</span>
            {typeof tab.count === "number" && tab.count > 0 && (
              <span
                className={`
                  rounded-full px-1.5 py-0.5 text-[10px] font-semibold
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
