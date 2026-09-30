"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@repo/ui/components/shadcn/avatar";
import type {
  ForumCategoryListResponseType,
  ForumCategoryTopListResponseType,
  ForumTopActiveUserListResponseType,
} from "@shared/types";
import {
  Folder,
  ArrowRight,
  Trophy,
  FileText,
  Home,
  MessageSquare,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

type ForumCategoryViewProps = {
  categories: ForumCategoryListResponseType;
  topCategories: ForumCategoryTopListResponseType;
  topUsers: ForumTopActiveUserListResponseType;
};

const rankColors = [
  "text-yellow-600 dark:text-yellow-400",
  "text-gray-500 dark:text-gray-400",
  "text-amber-700 dark:text-amber-500",
];
const rankBgColors = [
  "bg-yellow-100 dark:bg-yellow-500/15",
  "bg-gray-100 dark:bg-gray-500/15",
  "bg-amber-100 dark:bg-amber-500/15",
];

export function ForumCategoryView({
  categories,
  topCategories,
  topUsers,
}: ForumCategoryViewProps) {
  const hasTopCategories = topCategories.length > 0;
  const hasTopUsers = topUsers.length > 0;

  const totalPosts = categories.reduce((sum, c) => sum + c.postCount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link
              href="/"
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-medium text-foreground">Community Forum</span>
          </nav>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Community Forum
              </h1>
              <p className="mt-2 text-muted-foreground">
                Browse categories, join discussions, and connect with the
                community.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Folder className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-lg font-semibold leading-none text-foreground">
                    {categories.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Categories</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-lg font-semibold leading-none text-foreground">
                    {totalPosts}
                  </p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left: All Categories */}
          <div className="flex-1 min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                All Categories
              </h2>
              <Badge variant="secondary" className="text-xs">
                {categories.length} total
              </Badge>
            </div>

            {categories.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                    <Folder className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No categories yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Categories will appear here once they are created.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/forum/${category.id}`}
                    className="group block"
                  >
                    <Card className="h-full transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                          <span className="group-hover:text-primary transition-colors">
                            {category.name}
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {category.description ?? "No description provided."}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="secondary"
                            className="gap-1 text-xs font-normal"
                          >
                            <FileText className="h-3 w-3" />
                            {category.postCount}{" "}
                            {category.postCount === 1 ? "post" : "posts"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(category.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="w-full shrink-0 space-y-6 lg:w-80">
            {/* Top Categories */}
            {hasTopCategories && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-500/10">
                      <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    Top Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topCategories.map((category, index) => (
                    <Link
                      key={category.id}
                      href={`/forum/${category.id}`}
                      className="group block"
                    >
                      <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${rankBgColors[index] ?? "bg-muted"} ${rankColors[index] ?? "text-muted-foreground"}`}
                        >
                          {index === 0 ? (
                            <Trophy className="h-3.5 w-3.5" />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {category.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {category.postCount}{" "}
                            {category.postCount === 1 ? "post" : "posts"}
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Top Active Users */}
            {hasTopUsers && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                      <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Most Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {topUsers.map((user, index) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                    >
                      <div className="relative">
                        <Avatar size="sm">
                          <AvatarImage
                            src={user.avatarUrl ?? undefined}
                            alt={user.displayName ?? "User"}
                          />
                          <AvatarFallback>
                            {user.displayName?.charAt(0)?.toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        {index < 3 && (
                          <span
                            className={`absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold ring-2 ring-background ${rankBgColors[index]} ${rankColors[index]}`}
                          >
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {user.displayName ?? "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.postCount}{" "}
                          {user.postCount === 1 ? "post" : "posts"} &middot;{" "}
                          {user.commentCount}{" "}
                          {user.commentCount === 1 ? "comment" : "comments"}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick Stats Card */}
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                <Sparkles className="mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Join the conversation
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pick a category and start posting
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
