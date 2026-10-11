import Link from "next/link";
import { notFound } from "next/navigation";

import authServerRequest from "@/apiRequests/auth.server";
import forumServerRequest from "@/apiRequests/forum.server";
import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import { RoleName } from "@shared/types";

import { ForumPostListWrapper } from "./components/forum-post-list-wrapper";

type ForumCategoryDetailPageProps = {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    myPosts?: string;
  }>;
};

function resolveHeaderRole(
  user: Awaited<ReturnType<typeof authServerRequest.getMe>>,
): UserRole {
  if (!user) return "GUEST";

  const primaryRole =
    user.roles.find((role) => role.isPrimary) ?? user.roles[0];

  if (primaryRole?.name === RoleName.CLIENT) return "CLIENT";
  if (primaryRole?.name === RoleName.FREELANCER) return "FREELANCER";

  return "FREELANCER";
}

export default async function ForumCategoryDetailPage({
  params,
  searchParams,
}: ForumCategoryDetailPageProps) {
  const { categoryId: categoryIdParam } = await params;
  const { page, limit, search, myPosts } = await searchParams;
  const categoryId = Number(categoryIdParam);

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    notFound();
  }

  const [category, user] = await Promise.all([
    forumServerRequest.getCategoryById(categoryId),
    authServerRequest.getMe(),
  ]);

  if (!category) {
    notFound();
  }

  const role = resolveHeaderRole(user);
  const currentUserId = user?.id ?? null;

  const filter = {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    categoryId: category.id,
    userId: myPosts === "1" && currentUserId ? currentUserId : undefined,
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={role} />

      <main className="flex-1">
        <section className="border-b border-border/40 bg-background">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <nav className="text-[13px] text-muted-foreground/60">
              <Link href="/" className="transition-colors hover:text-[#4fae2e]">
                Home
              </Link>
              <span className="mx-2 text-foreground/25">/</span>
              <Link
                href="/forum"
                className="transition-colors hover:text-[#4fae2e]"
              >
                Forum
              </Link>
              <span className="mx-2 text-foreground/25">/</span>
              <span className="max-w-[220px] truncate font-medium text-foreground/80">
                {category.name}
              </span>
            </nav>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {category.name}
            </h1>
            {category.description ? (
              <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-foreground/50 dark:text-foreground/60">
                {category.description}
              </p>
            ) : null}
            <p className="mt-3 text-sm text-foreground/50">
              <span className="font-semibold text-foreground/70">
                {category.postCount}
              </span>{" "}
              {category.postCount === 1 ? "post" : "posts"}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <ForumPostListWrapper
            filter={filter}
            categoryId={category.id}
            categoryName={category.name}
            currentSearch={search}
            currentUserId={currentUserId}
            isMyPosts={myPosts === "1"}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
