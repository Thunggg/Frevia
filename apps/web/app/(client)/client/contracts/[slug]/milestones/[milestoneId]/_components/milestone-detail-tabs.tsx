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
      label: "Deliverables & Submissions",
      icon: FolderGit2,
      count: submissionCount,
      visible: canViewSubmissions,
    },
    {
      key: "files" as const,
      label: "Milestone Files",
      icon: FileText,
      count: fileCount,
      visible: canViewFiles,
    },
    {
      key: "activity" as const,
      label: "Activity & History",
      icon: Activity,
      visible: true,
    },
  ];

  const tabs = allTabs.filter((t) => t.visible);

  return (
    <div className="border-b border-zinc-200/80 dark:border-zinc-800">
      <nav className="flex space-x-6 overflow-x-auto scrollbar-none" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`inline-flex items-center gap-2 border-b-2 py-3 px-1 text-xs sm:text-sm transition-colors cursor-pointer shrink-0 ${isActive
                ? "border-[#0069D3] text-[#0069D3]"
                : "border-transparent text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${isActive
                    ? "bg-[#0069D3]/10 text-[#0069D3]"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                    }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

