import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, Briefcase, FolderTree, FolderX } from "lucide-react";
import adminServerRequest from "@/apiRequests/admin.server";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import { formatDate, formatDateTime } from "@/lib/format";
import { JobCategoryActions } from "../components/job-category-actions";

export const dynamic = "force-dynamic";

interface JobCategoryDetailPageProps {
  params: Promise<{ id: string }>;
}

// Trạng thái công việc do backend trả tự do (string) — chỉ dịch các giá trị đã biết
const JOB_STATUSES = [
  "DRAFT",
  "OPEN",
  "IN_PROGRESS",
  "COMPLETED",
  "CLOSED",
  "CANCELLED",
] as const;

type JobStatusKey = (typeof JOB_STATUSES)[number];

function isJobStatus(value: string): value is JobStatusKey {
  return (JOB_STATUSES as readonly string[]).includes(value);
}

export async function generateMetadata() {
  const t = await getTranslations("adminJobCategories");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AdminJobCategoryDetailPage({
  params,
}: JobCategoryDetailPageProps) {
  const { id } = await params;
  const jobCategoryId = Number(id);

  const t = await getTranslations("adminJobCategories");
  const tJobStatus = await getTranslations("jobStatus");
  const tCommon = await getTranslations("adminCommon");
  const locale = await getLocale();

  if (isNaN(jobCategoryId)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FolderX className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground">
          {t("detailInvalidId")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {t("detailInvalidIdDescription", { id })}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/admin/job-categories">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("detailBackToJobCategories")}
          </Link>
        </Button>
      </div>
    );
  }

  const jobCategory = await adminServerRequest.getJobCategoryById(jobCategoryId);

  if (!jobCategory) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FolderX className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground">
          {t("detailNotFound")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {t("detailNotFoundDescription", { id: jobCategoryId })}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/admin/job-categories">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("detailBackToJobCategories")}
          </Link>
        </Button>
      </div>
    );
  }

  const jobs = jobCategory.jobs;

  return (
    <div className="space-y-6 pb-12">
      <Button asChild variant="outline" size="sm">
        <Link href="/admin/job-categories">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("detailBackToJobCategories")}
        </Link>
      </Button>

      {/* Header */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-xl bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
              <FolderTree className="size-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {jobCategory.name}
              </h1>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                slug: {jobCategory.slug} · ID #{jobCategory.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {jobCategory.status === "ACTIVE" ? (
              <Badge className="border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                {t("statusActive")}
              </Badge>
            ) : (
              <Badge variant="outline">{t("statusInactive")}</Badge>
            )}
            {jobCategory.deletedAt !== null && (
              <Badge variant="destructive">{t("statusDeleted")}</Badge>
            )}
            <JobCategoryActions jobCategory={jobCategory} />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {tCommon("description")}
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {jobCategory.description || t("detailNoDescription")}
        </p>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Briefcase className="size-3.5" />
            {t("detailJobsUsing")}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {jobCategory.jobCount}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            {tCommon("created")}
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {formatDateTime(jobCategory.createdAt, locale)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            {t("detailLastUpdated")}
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {formatDateTime(jobCategory.updatedAt, locale)}
          </p>
        </div>
      </div>

      {/* Công việc liên quan */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {t("detailJobsHeading")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("detailJobsSubtitle")}
          </p>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">{tCommon("id")}</TableHead>
                <TableHead>{t("jobsColTitle")}</TableHead>
                <TableHead>{t("jobsColSlug")}</TableHead>
                <TableHead>{t("jobsColStatus")}</TableHead>
                <TableHead className="text-right">
                  {t("jobsColCreated")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {t("detailJobsEmpty")}
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {job.id}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {job.title}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {job.slug}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {isJobStatus(job.status)
                          ? tJobStatus(job.status)
                          : t("jobStatusUnknown")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(job.createdAt, locale)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
