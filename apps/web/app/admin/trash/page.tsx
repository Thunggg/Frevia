import Link from "next/link";
import { getTranslations } from "next-intl/server";
import adminServerRequest from "@/apiRequests/admin.server";
import authServerRequest from "@/apiRequests/auth.server";
import { hasActionPermission } from "@/lib/admin-access";
import { Button } from "@repo/ui/components/shadcn/button";
import { TrashPostsTable } from "./components/trash-posts-table";
import { TrashCommentsTable } from "./components/trash-comments-table";

type TrashType = "posts" | "comments";

export async function generateMetadata() {
  const t = await getTranslations("adminTrash");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AdminTrashPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("adminTrash");
  const currentUser = await authServerRequest.getMe();

  const canViewTrashPosts = hasActionPermission(
    currentUser,
    "GET",
    "/api/forums/admin/trash/posts",
  );
  const canViewTrashComments = hasActionPermission(
    currentUser,
    "GET",
    "/api/forums/admin/trash/comments",
  );

  if (!canViewTrashPosts && !canViewTrashComments) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("pageTitle")}
          </h1>
        </div>
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          {t("accessDenied")}
        </div>
      </div>
    );
  }

  const requestedType = params.type === "comments" ? "comments" : "posts";
  let activeType: TrashType = requestedType;
  if (requestedType === "posts" && !canViewTrashPosts) {
    activeType = "comments";
  } else if (requestedType === "comments" && !canViewTrashComments) {
    activeType = "posts";
  }

  const page = Number(params.page) || 1;
  const limit = 10;

  const postsData =
    activeType === "posts" && canViewTrashPosts
      ? await adminServerRequest.getTrashPosts(page, limit)
      : null;

  const commentsData =
    activeType === "comments" && canViewTrashComments
      ? await adminServerRequest.getTrashComments(page, limit)
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("pageTitle")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("pageSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {canViewTrashPosts && (
            <Button
              asChild
              variant={activeType === "posts" ? "default" : "outline"}
              size="sm"
            >
              <Link href="/admin/trash?type=posts">{t("tabPosts")}</Link>
            </Button>
          )}
          {canViewTrashComments && (
            <Button
              asChild
              variant={activeType === "comments" ? "default" : "outline"}
              size="sm"
            >
              <Link href="/admin/trash?type=comments">{t("tabComments")}</Link>
            </Button>
          )}
        </div>
      </div>
      {activeType === "posts" && postsData ? (
        <TrashPostsTable posts={postsData.posts} pagination={postsData.pagination} />
      ) : activeType === "comments" && commentsData ? (
        <TrashCommentsTable
          comments={commentsData.comments}
          pagination={commentsData.pagination}
        />
      ) : null}
    </div>
  );
}
