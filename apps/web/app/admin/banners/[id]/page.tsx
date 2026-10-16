import Link from "next/link";
import { ArrowLeft, CalendarClock, ExternalLink, Link2, Megaphone } from "lucide-react";
import adminServerRequest from "@/apiRequests/admin.server";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { BannerFormDialog } from "../components/banner-form-dialog";
import { bannerPositionLabel } from "../constants";

export const dynamic = "force-dynamic";

interface BannerDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatDateTime(value: Date | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default async function AdminBannerDetailPage({
  params,
}: BannerDetailPageProps) {
  const { id } = await params;
  const bannerId = Number(id);

  const notFound = (message: string) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-xl font-bold text-foreground">{message}</h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        The requested banner ID &quot;{id}&quot; is not valid.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/admin/banners">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Banner Management
        </Link>
      </Button>
    </div>
  );

  if (isNaN(bannerId)) {
    return notFound("Invalid Banner ID");
  }

  const banner = await adminServerRequest.getBannerById(bannerId);

  if (!banner) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground">Banner Not Found</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          No banner exists with ID #{bannerId}.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/admin/banners">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Banner Management
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <Button asChild variant="outline" size="sm">
        <Link href="/admin/banners">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Banner Management
        </Link>
      </Button>

      {/* Header */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-xl bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
              <Megaphone className="size-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {banner.title}
              </h1>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                ID #{banner.id} · {bannerPositionLabel(banner.position)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {banner.deletedAt !== null ? (
              <Badge variant="destructive">Deleted</Badge>
            ) : banner.isActive ? (
              <Badge className="border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                Active
              </Badge>
            ) : (
              <Badge variant="outline">Inactive</Badge>
            )}
            {banner.deletedAt === null && <BannerFormDialog banner={banner} />}
          </div>
        </div>
      </div>

      {/* Image preview */}
      {banner.imageUrl && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Image Preview
          </h2>
          <div className="mt-3 flex justify-center rounded-lg border bg-muted/30 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- banner preview */}
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="max-h-64 max-w-full rounded-md border object-contain"
            />
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <CalendarClock className="size-3.5" />
            Schedule
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {formatDateTime(banner.startDate)} → {formatDateTime(banner.endDate)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <ExternalLink className="size-3.5" />
            Link URL
          </p>
          {banner.linkUrl ? (
            <a
              href={banner.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block max-w-full truncate text-sm font-semibold text-[#4fae2e] hover:underline"
            >
              {banner.linkUrl}
            </a>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No link set.</p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Link2 className="size-3.5" />
            Image URL
          </p>
          {banner.imageUrl ? (
            <p className="mt-2 truncate text-sm text-muted-foreground">
              {banner.imageUrl}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No image set.</p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Created</p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {new Date(banner.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Last updated
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {new Date(banner.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}