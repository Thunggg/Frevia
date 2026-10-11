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
  const { categoryId } = await params;
  const { page, limit, search, myPosts } = await searchParams;

  const categoryIdNum = Number(categoryId);

  if (Number.isNaN(categoryIdNum) || categoryIdNum <= 0) {
    notFound();
  }

  const [category, user] = await Promise.all([
    forumServerRequest.getCategoryById(categoryIdNum),
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
    categoryId: categoryIdNum,
    userId: myPosts === "1" && currentUserId ? currentUserId : undefined,
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={role} />

      <main className="flex-1">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-[#4fae2e]/25 dark:bg-[#12331f]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="transition-colors hover:text-[#4fae2e]">
                Home
              </Link>
              <span className="mx-2 text-foreground/35">/</span>
              <Link
                href="/forum"
                className="transition-colors hover:text-[#4fae2e]"
              >
                Forum
              </Link>
              <span className="mx-2 text-foreground/35">/</span>
              <span className="max-w-[220px] truncate font-medium text-foreground">
                {category.name}
              </span>
            </nav>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {category.name}
            </h1>
            {category.description ? (
              <p className="mt-2 max-w-2xl text-base text-foreground/70 dark:text-foreground/75">
                {category.description}
              </p>
            ) : null}
            <p className="mt-3 text-sm text-foreground/65">
              <span className="font-semibold text-foreground">
                {category.postCount}
              </span>{" "}
              {category.postCount === 1 ? "post" : "posts"}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <ForumPostListWrapper
            filter={filter}
            categoryId={categoryIdNum}
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
