"use client";

import type {
  ForumCategoryListResponseType,
  ForumCategoryTopListResponseType,
  ForumTopActiveUserListResponseType,
  ForumTopPostType,
} from "@shared/types";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@repo/ui/components/shadcn/avatar";
import { ArrowUpRight, FolderOpen, MessageSquare } from "lucide-react";
import Link from "next/link";

type ForumCategoryViewProps = {
  categories: ForumCategoryListResponseType;
  topCategories: ForumCategoryTopListResponseType;
  topUsers: ForumTopActiveUserListResponseType;
  topPosts: ForumTopPostType[];
};

const monograms = [
  "bg-primary/10 text-primary",
  "bg-emerald-500/10 text-emerald-700",
  "bg-teal-500/10 text-teal-700",
  "bg-lime-600/10 text-lime-700",
];

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeTime(date: string | Date): string {
  const then = new Date(date).getTime();
  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

export function ForumCategoryView({
  categories,
  topCategories,
  topUsers,
  topPosts,
}: ForumCategoryViewProps) {
  const hasTopCategories = topCategories.length > 0;
  const hasTopUsers = topUsers.length > 0;
  const hasTopPosts = topPosts.length > 0;

  const totalPosts = categories.reduce((sum, c) => sum + c.postCount, 0);

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Page header */}
      <div className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <nav className="mb-6 flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-medium text-foreground">Community Forum</span>
          </nav>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Community Forum
              </h1>
              <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
                Browse categories, join discussions, and connect with the
                community.
              </p>
            </div>

            <dl className="flex items-center gap-8">
              <div>
                <dd className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                  {categories.length}
                </dd>
                <dt className="mt-0.5 text-[11px] text-muted-foreground">
                  Categories
                </dt>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <dd className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                  {totalPosts}
                </dd>
                <dt className="mt-0.5 text-[11px] text-muted-foreground">
                  Posts
                </dt>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Left: All Categories */}
          <div className="min-w-0 flex-1">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              All categories
            </h2>

            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-16">
                <FolderOpen className="mb-3 h-7 w-7 text-muted-foreground/60" />
                <p className="text-sm font-medium text-foreground">
                  No categories yet
                </p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Categories will appear here once they are created.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {categories.map((category, index) => (
                  <Link
                    key={category.id}
                    href={`/forum/${category.id}`}
                    className="group block"
                  >
                    <article className="flex h-full flex-col rounded-lg border bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-sm">
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${monograms[index % monograms.length]}`}
                          aria-hidden="true"
                        >
                          {category.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                            {category.name}
                          </h3>
                          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {category.description ?? "No description provided."}
                          </p>
                        </div>
                        <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium tabular-nums text-primary">
                          {category.postCount}{" "}
                          {category.postCount === 1 ? "discussion" : "discussions"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(category.createdAt)}
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <aside className="w-full shrink-0 space-y-5 lg:w-72">
            {hasTopPosts && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Top Discussions
                </h2>
                <ol className="divide-y divide-border rounded-lg border bg-card">
                  {topPosts.map((post, index) => (
                    <li key={post.id}>
                      <Link
                        href={`/forum/${post.category?.id ?? ""}/${post.id}`}
                        className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                      >
                        <span className="w-4 shrink-0 pt-0.5 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                            {post.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2.5 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {post.commentCount}
                            </span>
                            <span>{formatRelativeTime(post.createdAt)}</span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {hasTopCategories && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Popular Topics
                </h2>
                <ol className="divide-y divide-border rounded-lg border bg-card">
                  {topCategories.map((category, index) => (
                    <li key={category.id}>
                      <Link
                        href={`/forum/${category.id}`}
                        className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50"
                      >
                        <span className="w-4 shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground transition-colors group-hover:text-primary">
                          {category.name}
                        </span>
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                          {category.postCount}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {hasTopUsers && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Active Users
                </h2>
                <ul className="divide-y divide-border rounded-lg border bg-card">
                  {topUsers.map((user) => (
                    <li
                      key={user.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <Avatar size="sm">
                        <AvatarImage
                          src={user.avatarUrl ?? undefined}
                          alt={user.displayName ?? "User"}
                        />
                        <AvatarFallback>
                          {user.displayName?.charAt(0)?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-foreground">
                          {user.displayName ?? "Anonymous"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {user.postCount} posts &middot; {user.commentCount}{" "}
                          comments
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
