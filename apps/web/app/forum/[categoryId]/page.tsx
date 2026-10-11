import { notFound } from "next/navigation";
import { envConfig } from "@/configs/validate-env";
import type {
  ApiResponse,
  ForumCategoryDetailResponseType,
} from "@shared/types";
import { cookies } from "next/headers";
import { getMeServer } from "@/lib/get-me";
import { ForumPostListWrapper } from "./components/forum-post-list-wrapper";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type ForumCategoryDetailPageProps = {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    myPosts?: string;
  }>;
};

const ForumCategoryDetailPage = async ({
  params,
  searchParams,
}: ForumCategoryDetailPageProps) => {
  const { categoryId } = await params;
  const { page, limit, search, myPosts } = await searchParams;

  const categoryIdNum = Number(categoryId);

  if (isNaN(categoryIdNum) || categoryIdNum <= 0) {
    notFound();
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken || !envConfig?.NESTJS_API_URL) {
    notFound();
  }

  const [category, user] = await Promise.all([
    (async (): Promise<ForumCategoryDetailResponseType | null> => {
      const res = await fetch(
        `${envConfig.NESTJS_API_URL}/api/forums/categories/${categoryIdNum}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        },
      );
      const data = (await res.json()) as ApiResponse<ForumCategoryDetailResponseType>;
      if (!res.ok || !data.success) return null;
      return data.data;
    })(),
    getMeServer(),
  ]);

  if (!category) {
    notFound();
  }

  const currentUserId = user?.id ?? null;

  const filter = {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    categoryId: categoryIdNum,
    userId: myPosts === "1" && currentUserId ? currentUserId : undefined,
  };

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header Section */}
      <div className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link
              href="/"
              className="transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <Link
              href="/forum"
              className="transition-colors hover:text-foreground"
            >
              Community Forum
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="max-w-[200px] truncate font-medium text-foreground">
              {category.name}
            </span>
          </nav>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link
                href="/forum"
                className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to categories
              </Link>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {category.name}
              </h1>
              {category.description && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                  {category.description}
                </p>
              )}
            </div>

            <dl>
              <dd className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                {category.postCount}
              </dd>
              <dt className="mt-0.5 text-xs text-muted-foreground">Posts</dt>
            </dl>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <ForumPostListWrapper
          filter={filter}
          categoryId={categoryIdNum}
          categoryName={category.name}
          currentSearch={search}
          currentUserId={currentUserId}
          isMyPosts={myPosts === "1"}
        />
      </div>
    </div>
  );
};

export default ForumCategoryDetailPage;
