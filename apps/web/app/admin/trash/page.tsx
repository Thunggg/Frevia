import Link from "next/link";
import adminServerRequest from "@/apiRequests/admin.server";
import { Button } from "@repo/ui/components/shadcn/button";
import { TrashPostsTable } from "./components/trash-posts-table";
import { TrashCommentsTable } from "./components/trash-comments-table";

type TrashType = "posts" | "comments";

export default async function AdminTrashPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const params = await searchParams;
  const type: TrashType = params.type === "comments" ? "comments" : "posts";
  const page = Number(params.page) || 1;
  const limit = 10;

  const [postsData, commentsData] = await Promise.all([
    adminServerRequest.getTrashPosts(page, limit),
    adminServerRequest.getTrashComments(page, limit),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trash</h1>
          <p className="text-muted-foreground mt-1">
            Deleted posts &amp; comments — including posts rejected in Moderation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant={type === "posts" ? "default" : "outline"}
            size="sm"
          >
            <Link href="/admin/trash?type=posts">Posts</Link>
          </Button>
          <Button
            asChild
            variant={type === "comments" ? "default" : "outline"}
            size="sm"
          >
            <Link href="/admin/trash?type=comments">Comments</Link>
          </Button>
        </div>
      </div>
      {type === "posts" ? (
        <TrashPostsTable posts={postsData.posts} pagination={postsData.pagination} />
      ) : (
        <TrashCommentsTable
          comments={commentsData.comments}
          pagination={commentsData.pagination}
        />
      )}
    </div>
  );
}