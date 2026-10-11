"use client";

import Link from "next/link";
import { Calendar, MessageSquare } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";

import { useForumPosts } from "@/hooks/use-forum";

type RelatedPostsSidebarProps = {
  categoryId: number;
  currentPostId: number;
};

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function RelatedPostsSidebar({
  categoryId,
  currentPostId,
}: RelatedPostsSidebarProps) {
  const { data, isLoading } = useForumPosts({
    categoryId,
    page: 1,
    limit: 4,
  });

  const posts = (data?.posts ?? []).filter((p) => p.id !== currentPostId).slice(0, 3);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/40 bg-background p-4">
        <div className="mb-4 h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/40 bg-background p-4">
      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-foreground/60">
        Related Posts
      </h3>
      <div className="space-y-1">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/forum/${categoryId}/${post.id}`}
            className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-[#4fae2e]/5"
          >
            <Avatar size="sm" className="mt-0.5">
              <AvatarImage
                src={post.user?.profile?.avatarUrl ?? undefined}
                alt={post.user?.profile?.displayName ?? "User"}
              />
              <AvatarFallback className="text-[10px]">
                {post.user?.profile?.displayName?.charAt(0)?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground/80">
                {post.title}
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground/50">
                <span className="truncate">
                  {post.user?.profile?.displayName ?? `User #${post.userId}`}
                </span>
                <span className="text-foreground/20">·</span>
                <span className="inline-flex items-center gap-0.5">
                  <Calendar className="size-2.5" />
                  {formatDate(post.createdAt)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link
        href={`/forum/${categoryId}`}
        className="mt-3 block rounded-lg py-2 text-center text-[12px] font-medium text-[#4fae2e] transition-colors hover:bg-[#4fae2e]/5 hover:text-[#3f9225]"
      >
        View all posts →
      </Link>
    </div>
  );
}
