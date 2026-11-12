import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import authServerRequest from "@/apiRequests/auth.server";
import forumServerRequest from "@/apiRequests/forum.server";
import { extractIdFromSlug } from "@/lib/slug-utils";

import { ForumPostListWrapper } from "./components/forum-post-list-wrapper";
import { LanguageSwitcher } from "@/components/language-switcher";

type ForumCategoryDetailPageProps = {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ page?: string; limit?: string; search?: string; myPosts?: string }>;
};

export default async function ForumCategoryDetailPage({
  params,
  searchParams,
}: ForumCategoryDetailPageProps) {
  const { categorySlug } = await params;
  const { page, limit, search, myPosts } = await searchParams;
  const tCommon = await getTranslations("common");
  const categoryId = extractIdFromSlug(categorySlug);

  if (!categoryId) {
    notFound();
  }

  const [category, user] = await Promise.all([
    forumServerRequest.getCategoryById(categoryId),
    authServerRequest.getMe(),
  ]);

  if (!category) {
    notFound();
  }

  const currentUserId = user?.id ?? null;

  const filter = {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    categoryId: category.id,
    userId: myPosts === "1" && currentUserId ? currentUserId : undefined,
  };

  return (
    <>
      <section className="border-b border-border/40 bg-background">
        <div className="w-full px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex items-center justify-between gap-4">
            <nav className="text-[13px] text-muted-foreground/60">
              <Link
                href="/forum"
                className="transition-colors hover:text-[#0069D3]"
              >
                {tCommon("forum")}
              </Link>
              <span className="mx-2 text-foreground/25">/</span>
              <span className="max-w-[220px] truncate font-medium text-foreground/80">
                {category.name}
              </span>
            </nav>
            <LanguageSwitcher />
          </div>

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
            {tCommon("posts", { count: category.postCount })}
          </p>
        </div>
      </section>

      <div className="w-full px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <ForumPostListWrapper
          filter={filter}
          categoryId={category.id}
          categorySlug={category.slug}
          categoryName={category.name}
          currentSearch={search}
          currentUserId={currentUserId}
          isMyPosts={myPosts === "1"}
        />
      </div>
    </>
  );
}
