import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getForumCategoryDetailServer,
  getForumPostsServer,
  getTopInteractedPostsServer,
} from "@/lib/get-forum-posts";
import { getMeServer } from "@/lib/get-me";
import { ForumPostList } from "./components/forum-post-list";
import type { ForumPostFilterType } from "@shared/types";
import Link from "next/link";
import { Home, ArrowLeft, FileText, Calendar } from "lucide-react";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Card, CardContent } from "@repo/ui/components/shadcn/card";

type ForumCategoryDetailPageProps = {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    myPosts?: string;
  }>;
};

function PostListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-10 w-full max-w-md rounded-lg bg-muted animate-pulse" />
        <div className="h-10 w-[100px] rounded-lg bg-muted animate-pulse" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-3/5 rounded bg-muted animate-pulse" />
                  <div className="h-5 w-12 rounded-full bg-muted animate-pulse" />
                </div>
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                <div className="flex items-center gap-3">
                  <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

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

  const [category, user, topPosts] = await Promise.all([
    getForumCategoryDetailServer(categoryIdNum),
    getMeServer(),
    getTopInteractedPostsServer(3),
  ]);

  if (!category) {
    notFound();
  }

  const currentUserId = user?.id ?? null;

  const filter: ForumPostFilterType = {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    categoryId: categoryIdNum,
    userId: myPosts === "1" && currentUserId ? currentUserId : undefined,
  };

  const { posts, pagination } = await getForumPostsServer(filter);

  const filteredPosts = search
    ? posts.filter((post) =>
        post.title.toLowerCase().includes(search.toLowerCase()),
      )
    : posts;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {/* Breadcrumb */}
          <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link
              href="/"
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <Home className="h-3.5 w-3.5" />
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
                className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to categories
              </Link>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {category.name}
              </h1>
              {category.description && (
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  {category.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                <FileText className="h-3.5 w-3.5" />
                {pagination.total}{" "}
                {pagination.total === 1 ? "post" : "posts"}
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(category.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Suspense fallback={<PostListSkeleton />}>
          <ForumPostList
            posts={filteredPosts}
            pagination={pagination}
            categoryId={categoryIdNum}
            categoryName={category.name}
            currentSearch={search}
            currentUserId={currentUserId}
            isMyPosts={myPosts === "1"}
            topPosts={topPosts}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default ForumCategoryDetailPage;
