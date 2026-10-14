"use client";

import Link from "next/link";
import { ArrowLeft, Shield, User, Calendar } from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import type { AdminUserDetailResponseType } from "@shared/types";

interface UserDetailHeaderProps {
  user: AdminUserDetailResponseType;
}

export function UserDetailHeader({ user }: UserDetailHeaderProps) {
  const renderRoleBadge = (roleName: string, isPrimary?: boolean) => {
    const nameLower = roleName.toLowerCase();
    if (nameLower === "client") {
      return (
        <Badge
          key={roleName}
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
        >
          Client {isPrimary && "★ (Primary)"}
        </Badge>
      );
    }
    if (nameLower === "freelancer") {
      return (
        <Badge
          key={roleName}
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800"
        >
          Freelancer {isPrimary && "★ (Primary)"}
        </Badge>
      );
    }
    if (nameLower === "admin") {
      return (
        <Badge
          key={roleName}
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
        >
          <Shield className="mr-1 h-3 w-3" /> Admin {isPrimary && "★"}
        </Badge>
      );
    }
    return (
      <Badge
        key={roleName}
        variant="outline"
        className="bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700"
      >
        {roleName} {isPrimary && "★"}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb & Back action */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
        >
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium text-foreground">
          {user.displayName || user.email}
        </span>
      </div>

      {/* Main Profile Header Card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-border shadow-sm">
              <AvatarImage
                src={user.avatarUrl || undefined}
                alt={user.displayName || user.email}
              />
              <AvatarFallback className="bg-muted text-base font-semibold">
                {user.displayName ? (
                  user.displayName.slice(0, 2).toUpperCase()
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {user.displayName || "No Display Name"}
                </h1>
                <Badge variant="outline" className="font-mono text-xs">
                  ID: #{user.id}
                </Badge>
                {user.isBanned ? (
                  <Badge variant="destructive" className="text-xs">
                    Banned
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 border text-xs"
                  >
                    Active Account
                  </Badge>
                )}
              </div>

              <p className="font-mono text-sm text-muted-foreground">
                {user.email}
              </p>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {user.roles.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No roles assigned</span>
                ) : (
                  user.roles.map((r) => renderRoleBadge(r.name, r.isPrimary))
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-right sm:items-end text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span>Updated: {new Date(user.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
