import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
  const totalPosts = categories.reduce((sum, c) => sum + c.postCount, 0);

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={role} />

      <main className="flex-1">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="transition-colors hover:text-[#4fae2e]">
                Home
              </Link>
              <span className="mx-2 text-foreground/35">/</span>
              <span className="font-medium text-foreground">Forum</span>
            </nav>

            <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Community Forum
                </h1>
                <p className="mt-2 text-base text-foreground/70 dark:text-foreground/75">
                  Ask questions, share tips, and learn from freelancers and
                  clients on Frevia.
                </p>
              </div>

              <p className="text-sm text-foreground/65 dark:text-foreground/70">
                <span className="font-semibold text-foreground">
                  {categories.length}
                </span>{" "}
                {categories.length === 1 ? "category" : "categories"}
                <span className="mx-2 text-foreground/35">·</span>
                <span className="font-semibold text-foreground">
                  {totalPosts}
                </span>{" "}
                {totalPosts === 1 ? "post" : "posts"}
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-10">
          <section className="lg:col-span-8">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Categories
            </h2>

            {categories.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-border px-6 py-16 text-center">
                <p className="text-lg font-medium text-foreground">
                  No categories yet
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Categories will show up here once they are created.
                </p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-border border-y border-border">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/forum/${category.id}`}
                      className="group flex flex-col gap-3 px-3 py-6 transition-colors hover:bg-[#eaf8df]/35 sm:flex-row sm:items-start sm:justify-between sm:px-5 sm:py-7 dark:hover:bg-white/5/35"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-[#4fae2e]">
                            {category.name}
                          </h3>
                          <ArrowRight className="size-4 shrink-0 text-[#4fae2e] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                        </div>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground line-clamp-2">
                          {category.description ?? "No description provided."}
                        </p>
                      </div>

                      <div className="shrink-0 text-sm text-muted-foreground sm:text-right">
                        <p className="font-medium text-foreground">
                          {category.postCount}{" "}
                          {category.postCount === 1 ? "post" : "posts"}
                        </p>
                        <p className="mt-1 text-xs">
                          Added {formatDate(category.createdAt)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="space-y-8 lg:col-span-4">
            {hasTopCategories ? (
              <section className="rounded-xl border border-border p-5 sm:p-6">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Active categories
                </h2>
                <ul className="mt-4 divide-y divide-border">
                  {topCategories.map((category, index) => (
                    <li key={category.id}>
                      <Link
                        href={`/forum/${category.id}`}
                        className="group flex items-center gap-3 py-3"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#eaf8df] text-xs font-semibold text-[#4fae2e] dark:bg-[#4fae2e]/15">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-[#4fae2e]">
                            {category.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {category.postCount}{" "}
                            {category.postCount === 1 ? "post" : "posts"}
                          </p>
                        </div>
                        <ArrowRight className="size-3.5 shrink-0 text-[#4fae2e] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {hasTopUsers ? (
              <section className="rounded-xl border border-border p-5 sm:p-6">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Active members
                </h2>
                <ul className="mt-4 space-y-1">
                  {topUsers.map((user) => (
                    <li
                      key={user.id}
                      className="flex items-center gap-3 rounded-lg px-1 py-2"
                    >
                      <Avatar size="sm">
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
                          <span className="mx-1.5 text-foreground/30">·</span>
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
