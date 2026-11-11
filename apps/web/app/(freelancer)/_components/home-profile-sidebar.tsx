"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  HelpCircle,
  Pencil,
  ShieldCheck,
} from "@/components/icons";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import type { GetMeResType } from "@shared/types";

type HomeProfileSidebarProps = {
  user: GetMeResType | null;
  profileCompletionPercentage?: number;
};

export function HomeProfileSidebar({
  user,
  profileCompletionPercentage = 40,
}: HomeProfileSidebarProps) {
  const [reachMoreOpen, setReachMoreOpen] = useState(true);

  const displayName = user?.profile?.displayName || "Tai T.";
  const avatarUrl = user?.profile?.avatarUrl;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-4 font-sans">
      {/* 1. Profile Summary Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-14 border border-border/80 shadow-xs">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-lg dark:bg-emerald-950 dark:text-emerald-200">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <Link
              href="/freelancer/profile"
              className="text-base font-bold text-foreground hover:text-emerald-600 transition-colors truncate block"
            >
              {displayName}
            </Link>
            <p className="text-xs text-muted-foreground font-medium">IT II</p>
          </div>
        </div>

        {/* Profile Visibility */}
        <div className="space-y-1.5 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-normal">
              Profile Visibility
            </span>
            <Link
              href="/freelancer/profile"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Edit visibility"
            >
              <Pencil className="size-3.5" />
            </Link>
          </div>
          <p className="text-xs font-semibold text-foreground">Public</p>
        </div>

        {/* Complete your profile */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between text-xs">
            <Link
              href="/freelancer/profile"
              className="font-medium text-foreground hover:underline text-xs"
            >
              Complete your profile
            </Link>
            <span className="text-xs font-bold text-foreground">
              {profileCompletionPercentage}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-500"
              style={{ width: `${profileCompletionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Identity Verification Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-foreground font-bold text-sm">
          <ShieldCheck className="size-5 text-foreground" />
          <span>Identity verification</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Increase your profile visibility in search results and win more work
          with an IDV Badge.
        </p>
        <Link
          href="/freelancer/profile?tab=identity"
          className="inline-block text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
        >
          Get an IDV Badge
        </Link>
      </div>

      {/* 3. Reach More Clients Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
        <button
          type="button"
          onClick={() => setReachMoreOpen(!reachMoreOpen)}
          className="flex w-full items-center justify-between text-left text-sm font-bold text-foreground cursor-pointer"
        >
          <span>Reach more clients</span>
          {reachMoreOpen ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>

        {reachMoreOpen && (
          <div className="space-y-3 pt-2 text-xs">
            {/* Work Now */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-muted-foreground" />
                <span className="font-normal text-foreground">Work Now</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Off
                </span>
                <Link
                  href="/freelancer/profile"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Open for work */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-1.5">
                <span className="font-normal text-foreground">
                  Open for work
                </span>
                <HelpCircle className="size-3 text-muted-foreground/70" />
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Off
                </span>
                <Link
                  href="/freelancer/profile"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Boost your profile */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-1.5">
                <span className="font-normal text-foreground">
                  Boost your profile
                </span>
                <HelpCircle className="size-3 text-muted-foreground/70" />
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Off
                </span>
                <Link
                  href="/freelancer/profile"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

