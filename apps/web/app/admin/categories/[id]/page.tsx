import adminServerRequest from "@/apiRequests/admin.server";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Separator } from "@repo/ui/components/shadcn/separator";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  FolderOpen,
  Hash,
  Tag,
} from "lucide-react";
import { EditCategoryButton } from "./components/edit-category-button";
import { DeleteCategoryButton } from "./components/delete-category-button";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminCategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categoryId = Number(id);

  if (isNaN(categoryId)) {
    notFound();
  }

  const category = await adminServerRequest.getAdminCategoryById(categoryId);

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header & Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-1 pl-0 text-muted-foreground hover:text-foreground"
            >
              <Link href="/admin/categories">
                <ArrowLeft className="h-4 w-4" />
                Back to Categories
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {category.name}
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              ID: #{category.id}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <EditCategoryButton category={category} />
          <DeleteCategoryButton category={category} />
        </div>
      </div>

      <Separator />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Detail Info Card */}
        <div className="space-y-6 md:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-[#4fae2e]" />
              Category Details
            </h2>

            <Separator />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  Category Name
                </p>
                <p className="text-sm font-medium text-foreground">
                  {category.name}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  Slug
                </p>
                <code className="inline-block rounded bg-muted px-2 py-0.5 text-xs text-foreground font-mono">
                  {category.slug}
                </code>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Created At
                </p>
                <p className="text-sm text-foreground">
                  {new Date(category.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Updated At
                </p>
                <p className="text-sm text-foreground">
                  {new Date(category.updatedAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Description
              </p>
              {category.description ? (
                <p className="rounded-lg bg-muted/50 p-3 text-sm leading-relaxed text-foreground">
                  {category.description}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  No description provided for this category.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / Stats Card */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Statistics</h2>
            <Separator />
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Total Posts
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {category.postCount}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/admin/posts?categoryId=${category.id}`}>
                  View Posts →
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
