import { Suspense } from "react";
import adminServerRequest from "@/apiRequests/admin.server";
import { ModerationTable } from "./components/moderation-table";

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = 10;

  const data = await adminServerRequest.getPendingPosts(page, limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Moderation</h1>
        <p className="text-muted-foreground mt-1">
          Review posts pending AI moderation ({data.pagination.total} pending)
        </p>
      </div>
      <Suspense>
        <ModerationTable posts={data.posts} pagination={data.pagination} />
      </Suspense>
    </div>
  );
}