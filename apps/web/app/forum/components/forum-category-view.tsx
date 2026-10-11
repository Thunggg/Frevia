import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import type {
  ForumCategoryListResponseType,
  ForumCategoryTopListResponseType,
  ForumTopActiveUserListResponseType,
} from "@shared/types";

type ForumCategoryViewProps = {
  role: UserRole;
  categories: ForumCategoryListResponseType;
  topCategories: ForumCategoryTopListResponseType;
  topUsers: ForumTopActiveUserListResponseType;
};

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ForumCategoryView({
  role,
  categories,
  topCategories,
  topUsers,
}: ForumCategoryViewProps) {
  const hasTopCategories = topCategories.length > 0;
  const hasTopUsers = topUsers.length > 0;

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={role} />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="transition-colors hover:text-[#4fae2e]">
                Home
              </Link>
              <span className="mx-2 text-foreground/35">/</span>
              <span className="font-medium text-foreground">Forum</span>
            </nav>

            <div className="mt-6 max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Community Forum
              </h1>
              <p className="mt-2.5 text-sm leading-relaxed text-foreground/65">
                Ask questions, share tips, and learn from freelancers and
                clients on Frevia.
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-10">
          <section className="lg:col-span-8">
            {categories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
                  <MessageSquare className="size-7" />
                </div>
                <p className="text-lg font-medium text-foreground">
                  No categories yet
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Categories will show up here once they are created.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border border-y border-border">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/forum/${category.id}`}
                    className="group flex items-start gap-4 px-1 py-5 transition-colors hover:bg-[#f9fcf7]/60 sm:items-center sm:py-6 dark:hover:bg-white/[0.02]"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
                      <MessageSquare className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-[#4fae2e]">
                          {category.name}
                        </h3>
                      </div>
                      <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground line-clamp-2">
                        {category.description ?? "No description provided."}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-foreground/70">
                        {category.postCount}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {category.postCount === 1 ? "post" : "posts"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6 lg:col-span-4">
            {hasTopCategories ? (
              <section className="rounded-xl border border-border p-5 sm:p-6">
                <h2 className="text-sm font-semibold text-foreground">
                  Most Active
                </h2>
                <ul className="mt-4 divide-y divide-border">
                  {topCategories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/forum/${category.id}`}
                        className="group flex items-center justify-between py-3 transition-colors hover:text-[#4fae2e]"
                      >
                        <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-[#4fae2e]">
                          {category.name}
                        </p>
                        <span className="ml-4 shrink-0 text-xs tabular-nums text-muted-foreground">
                          {category.postCount}{" "}
                          {category.postCount === 1 ? "post" : "posts"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {hasTopUsers ? (
              <section className="rounded-xl border border-border p-5 sm:p-6">
                <h2 className="text-sm font-semibold text-foreground">
                  Top Contributors
                </h2>
                <ul className="mt-4 space-y-4">
                  {topUsers.map((user) => (
                    <li key={user.id} className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={user.avatarUrl ?? undefined}
                          alt={user.displayName ?? "Member"}
                        />
                        <AvatarFallback>
                          {user.displayName?.charAt(0)?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {user.displayName ?? "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.postCount}{" "}
                          {user.postCount === 1 ? "post" : "posts"}
                          <span className="mx-1">·</span>
                          {user.commentCount}{" "}
                          {user.commentCount === 1 ? "comment" : "comments"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
