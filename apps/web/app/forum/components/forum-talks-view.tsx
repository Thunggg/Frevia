"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@repo/ui/components/shadcn/pagination";
import type {
  ForumCategoryListResponseType,
  ForumPostWithUserType,
  ForumTopActiveUserListResponseType,
  PaginationMeta,
} from "@shared/types";
import { buildSlugId } from "@/lib/slug-utils";
import { CreateTalkDialog } from "./create-talk-dialog";
import { MessageSquare, HelpCircle } from "lucide-react";

type FilterTab = "active" | "recent" | "unanswered" | "popular";

type ForumTalksViewProps = {
  posts: ForumPostWithUserType[];
  pagination: PaginationMeta | null;
  categories: ForumCategoryListResponseType;
  topUsers: ForumTopActiveUserListResponseType;
  currentUserId: number | null;
};

// Avatar mẫu hỗ trợ cho avatar stack của repliers nếu bài chưa có comment list chi tiết
const REPLIER_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80",
];

export function ForumTalksView({
  posts,
  pagination,
  categories,
  topUsers,
  currentUserId,
}: ForumTalksViewProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("active");

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Lọc bài theo tabs:
  // - active: tất cả bài
  // - recent: mới nhất
  // - unanswered: bài có 0 comment
  // - popular: bài có nhiều comment/like nhất
  let displayedPosts = [...posts];
  if (activeTab === "recent") {
    displayedPosts.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } else if (activeTab === "unanswered") {
    displayedPosts = displayedPosts.filter((p) => p.commentCount === 0);
  } else if (activeTab === "popular") {
    displayedPosts.sort(
      (a, b) => b.commentCount + b.likeCount - (a.commentCount + a.likeCount),
    );
  }

  // Danh sách thảo luận chưa có comment cho mục "Unanswered Talks" ở sidebar
  const unansweredPosts = posts.filter((p) => p.commentCount === 0).slice(0, 5);

  const formatDate = (dateString: string | Date) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPostLink = (post: ForumPostWithUserType) => {
    const cat = post.categoryId ? categoryMap.get(post.categoryId) : categories[0];
    const catSlug = cat ? buildSlugId(cat.slug, cat.id) : "general-1";
    return `/forum/${catSlug}/${buildSlugId(post.slug, post.id)}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Top Header (Matching Image 1: Talks + Create new talk button) ── */}
      <div className="flex items-center justify-between gap-4 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Talks
        </h1>

        <CreateTalkDialog
          categories={categories}
          currentUserId={currentUserId}
        />
      </div>

      {/* ── Filter Pills (Active, Recent, Unanswered, Popular, ...) ── */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-5">
        <button
          onClick={() => setActiveTab("active")}
          className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "active"
              ? "bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-white"
              : "text-zinc-500 hover:text-foreground dark:text-zinc-400"
          }`}
        >
          Active
        </button>

        <button
          onClick={() => setActiveTab("recent")}
          className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "recent"
              ? "bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-white"
              : "text-zinc-500 hover:text-foreground dark:text-zinc-400"
          }`}
        >
          Recent
        </button>

        <button
          onClick={() => setActiveTab("unanswered")}
          className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "unanswered"
              ? "bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-white"
              : "text-zinc-500 hover:text-foreground dark:text-zinc-400"
          }`}
        >
          Unanswered
        </button>

        <button
          onClick={() => setActiveTab("popular")}
          className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "popular"
              ? "bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-white"
              : "text-zinc-500 hover:text-foreground dark:text-zinc-400"
          }`}
        >
          Popular
        </button>

        <span className="text-xs text-zinc-400 pl-1">•••</span>
      </div>

      {/* ── Main 2-column Grid (Image 1 Layout) ── */}
      <div className="grid grid-cols-1 gap-12 pt-8 lg:grid-cols-12 lg:gap-16">
        {/* ── Left Column: Talks List ── */}
        <div className="lg:col-span-8">
          {displayedPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <MessageSquare className="mx-auto size-10 text-muted-foreground/60 mb-3" />
              <p className="text-sm font-medium text-foreground">
                Chưa có bài thảo luận nào trong mục này.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Hãy là người đầu tiên tạo thảo luận để kết nối cùng mọi người!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {displayedPosts.map((post) => {
                const category = post.categoryId
                  ? categoryMap.get(post.categoryId)
                  : null;
                const authorName =
                  post.user?.profile?.displayName || `User #${post.userId}`;

                return (
                  <div
                    key={post.id}
                    className="flex items-center justify-between gap-4 py-4 sm:py-5 transition-colors hover:bg-black/[0.01] dark:hover:bg-white/[0.01]"
                  >
                    {/* Left: Author Avatar */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      <Avatar className="size-10 shrink-0 ring-1 ring-border/80">
                        <AvatarImage
                          src={post.user?.profile?.avatarUrl ?? undefined}
                          alt={authorName}
                        />
                        <AvatarFallback className="text-xs font-semibold bg-zinc-100 dark:bg-zinc-800">
                          {authorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Main Title & Subtitle */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="size-2 shrink-0 rounded-full bg-[#0069D3]" />
                          <Link
                            href={getPostLink(post)}
                            className="font-bold text-sm sm:text-base text-zinc-900 transition-colors hover:text-[#0069D3] line-clamp-1 dark:text-zinc-100"
                          >
                            {post.title}
                          </Link>
                        </div>

                        {/* Subline */}
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            {authorName}
                          </span>
                          <span>{formatDate(post.createdAt)}</span>
                          <span>{post.commentCount} replies</span>
                          {category ? (
                            <>
                              <Link
                                href={`/forum/${buildSlugId(category.slug, category.id)}`}
                                className="text-[#0069D3] hover:underline"
                              >
                                {category.name}
                              </Link>
                            </>
                          ) : null}
                          <span className="text-zinc-400">Mute</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Repliers Avatar Stack (Image 1 style) */}
                    <div className="shrink-0 pl-2">
                      {post.commentCount > 0 ? (
                        <div className="flex -space-x-2 overflow-hidden">
                          {REPLIER_AVATARS.slice(
                            0,
                            Math.min(3, Math.max(1, post.commentCount)),
                          ).map((avatar, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={avatar}
                              alt="Replier"
                              className="inline-block size-6 sm:size-7 rounded-full ring-2 ring-white dark:ring-zinc-950 object-cover"
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-400 hidden sm:inline">
                          0 comments
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 ? (
            <div className="pt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={`/forum?page=${Math.max(1, pagination.page - 1)}`}
                      className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>
                      {pagination.page}
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href={`/forum?page=${Math.min(pagination.totalPages, pagination.page + 1)}`}
                      className={pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </div>

        {/* ── Right Column: Sidebar (Top Contributors & Unanswered Talks) ── */}
        <aside className="space-y-10 lg:col-span-4">
          {/* 1. Top Contributors (Image 1 style) */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Top Contributors
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                People who started the most discussions on Talks.
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              {topUsers.map((user) => {
                const displayName =
                  user.displayName || `User #${user.id}`;

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="size-6 shrink-0 ring-1 ring-border/80">
                        <AvatarImage
                          src={user.avatarUrl ?? undefined}
                          alt={displayName}
                        />
                        <AvatarFallback className="text-[10px] bg-zinc-100 dark:bg-zinc-800">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate font-medium text-foreground">
                        {displayName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
                      <MessageSquare className="size-3 text-zinc-500" />
                      <span>{user.postCount + (user.commentCount || 0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Unanswered Talks (Image 1 style) */}
          <div className="space-y-4 border-t border-border/50 pt-8">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Unanswered Talks
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Discussions with no comments. Be first to post a comment.
              </p>
            </div>

            <div className="space-y-4 pt-1">
              {unansweredPosts.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Hiện tất cả thảo luận đều đã có câu trả lời!
                </p>
              ) : (
                unansweredPosts.map((post) => {
                  const authorName =
                    post.user?.profile?.displayName || `User #${post.userId}`;

                  return (
                    <div key={post.id} className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Avatar className="size-4 shrink-0">
                          <AvatarImage
                            src={post.user?.profile?.avatarUrl ?? undefined}
                            alt={authorName}
                          />
                          <AvatarFallback className="text-[9px]">
                            {authorName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          <strong className="text-foreground">{authorName}</strong> posted
                        </span>
                      </div>

                      <Link
                        href={getPostLink(post)}
                        className="block text-xs font-semibold text-zinc-900 transition-colors hover:text-[#0069D3] line-clamp-2 dark:text-zinc-100"
                      >
                        {post.title}
                      </Link>

                      <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <MessageSquare className="size-2.5" />
                        <span>0 comments</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. Need Help Pill / Button (Image 1 bottom-right style) */}
          <div className="pt-4 flex justify-end">
            <Link
              href="/privacy-policy"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0069D3] px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-600 transition-colors"
            >
              <HelpCircle className="size-3.5" />
              <span>Need Help?</span>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
