"use client";

import {
  Briefcase,
  FileCheck,
  FileText,
  Send,
  Star,
  FileBadge,
  Globe,
  ExternalLink,
  Activity,
} from "lucide-react";
import { Badge } from "@repo/ui/components/shadcn/badge";
import type { AdminUserDetailResponseType } from "@shared/types";

interface UserGeneralInfoProps {
  user: AdminUserDetailResponseType;
}

export function UserGeneralInfo({ user }: UserGeneralInfoProps) {
  const statCards = [
    {
      label: "Jobs Posted",
      value: user.stats.jobsPosted,
      icon: Briefcase,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900",
    },
    {
      label: "Client Contracts",
      value: user.stats.contractsAsClient,
      icon: FileCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900",
    },
    {
      label: "Freelancer Contracts",
      value: user.stats.contractsAsFreelancer,
      icon: FileText,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900",
    },
    {
      label: "Proposals Submitted",
      value: user.stats.proposals,
      icon: Send,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900",
    },
    {
      label: "Reviews Received",
      value: user.stats.reviewsReceived,
      icon: Star,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-900",
    },
    {
      label: "ID Verification Docs",
      value: user.stats.idVerificationDocuments,
      icon: FileBadge,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Platform Activity Statistics
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`rounded-lg border p-3.5 shadow-sm transition-all hover:shadow-md ${stat.bg}`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-xl font-bold tracking-tight text-foreground">
                    {stat.value}
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* General Account Overview & Profile Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Bio & Profile Details */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#4fae2e]" />
              Account Overview & Biography
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    user.onlineStatus ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                  }`}
                />
                {user.onlineStatus ? "Online" : "Offline"}
              </div>
              <Badge variant="outline" className="text-xs">
                Availability: {user.availabilityStatus || "OFFLINE"}
              </Badge>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Bio / Introduction
            </h4>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {user.bio ? (
                user.bio
              ) : (
                <span className="italic text-muted-foreground">
                  No personal biography provided yet.
                </span>
              )}
            </p>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="font-medium text-muted-foreground">
                Profile Completion Progress
              </span>
              <span className="font-semibold text-foreground">
                {user.profileCompletionPercent ?? 0}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-[#4fae2e] transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(user.profileCompletionPercent ?? 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right 1 Col: Social Links & Meta */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-foreground border-b pb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#4fae2e]" />
            Social Profiles & Links
          </h3>

          {user.socialLinks.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">
              No social links connected.
            </p>
          ) : (
            <div className="space-y-2">
              {user.socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-md border p-2 text-xs font-medium text-foreground hover:bg-muted/50 hover:border-[#4fae2e]/50 transition-colors group"
                >
                  <span className="font-semibold uppercase text-xs text-muted-foreground group-hover:text-foreground">
                    {link.platform}
                  </span>
                  <div className="flex items-center gap-1 text-muted-foreground group-hover:text-[#4fae2e]">
                    <span className="truncate max-w-[150px]">{link.url}</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </div>
                </a>
              ))}
            </div>
          )}

          <div className="border-t pt-3 space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Account Status:</span>
              <span className="font-medium text-foreground">
                {user.isBanned ? "Banned" : "Good Standing"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
