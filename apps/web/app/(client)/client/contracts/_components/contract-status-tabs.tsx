"use client";

import type { ContractStatus } from "./contract-status-badge";

export interface StatusTabItem {
  label: string;
  value: ContractStatus | "ALL";
}

interface ContractStatusTabsProps {
  tabs: StatusTabItem[];
  selectedTab: ContractStatus | "ALL";
  onSelectTab: (tab: ContractStatus | "ALL") => void;
  counts: Record<string, number>;
}

export function ContractStatusTabs({
  tabs,
  selectedTab,
  onSelectTab,
  counts,
}: ContractStatusTabsProps) {
  return (
    <div className="
      flex items-center gap-1
      overflow-x-auto rounded-full
      bg-[#F1F0F5] p-1 text-xs
      dark:bg-muted
    ">
      {tabs.map((tab) => {
        const isActive = selectedTab === tab.value;
        const count = counts[tab.value as keyof typeof counts] ?? 0;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onSelectTab(tab.value)}
            className={`
              inline-flex cursor-pointer
              items-center gap-1.5
              whitespace-nowrap rounded-full
              px-3.5 py-1.5
              font-medium transition-all
              ${
                isActive
                  ? "bg-background font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            <span>{tab.label}</span>

            {count > 0 && (
              <span
                className={`
                  rounded-full px-1.5
                  py-0.5 text-[10px]
                  font-semibold
                  ${
                    isActive
                      ? "bg-[#0069D3]/10 text-[#0069D3]"
                      : "bg-muted-foreground/15 text-muted-foreground"
                  }
                `}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

