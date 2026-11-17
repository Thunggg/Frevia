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
    <div className="border-b border-border/40">
      <nav className="flex space-x-4 overflow-x-auto scrollbar-none" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`inline-flex items-center gap-1.5 border-b-2 py-2 px-1 text-xs transition-colors cursor-pointer shrink-0 ${
                isActive
                  ? "border-[#0069D3] text-[#0069D3] font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
