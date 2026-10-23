"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { ProfileRevisionType } from "@shared/types";
import { adminApiRequest } from "@/apiRequests/admin";
import { ApiFail } from "@/lib/http";
import { formatDateTime, formatNumber } from "@/lib/format";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Label } from "@repo/ui/components/shadcn/label";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import { Check, Eye, Loader2, X } from "lucide-react";
import { NumberedPagination } from "../components/numbered-pagination";

const fieldKeys = [
  "displayName",
  "title",
  "bio",
  "availabilityStatus",
  "education",
  "certifications",
  "languages",
  "companyName",
  "companyDescription",
  "website",
  "expertise",
  "yearsOfExperience",
] as const;

function presentValue(
  value: unknown,
  labels: { none: string; notSet: string },
) {
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : labels.none;
  }
  if (value === null || value === undefined || value === "") {
    return labels.notSet;
  }
  return String(value);
}

function statusClass(status: string) {
  if (status === "APPROVED") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300";
  }
  if (status === "REJECTED") {
    return "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300";
  }
  return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300";
}

export function ProfileRevisionsTable({
  revisions,
  pagination,
  currentStatus,
  currentType,
}: {
  revisions: ProfileRevisionType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  currentStatus?: string;
  currentType?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("adminProfileRevisions");
  const tCommon = useTranslations("adminCommon");
  const tRoleName = useTranslations("roleName");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<ProfileRevisionType | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const valueLabels = {
    none: t("valueNone"),
    notSet: t("valueNotSet"),
  };

  const fieldLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const key of fieldKeys) {
      labels[key] = t(`fields.${key}`);
    }
    return labels;
  }, [t]);

  const fields = useMemo(() => {
    if (!selected) return [];
    const keys = new Set([
      ...Object.keys(selected.currentData),
      ...Object.keys(selected.proposedData),
    ]);
    return [...keys].map((key) => ({
      key,
      before: selected.currentData[key],
      after: selected.proposedData[key],
      changed:
        JSON.stringify(selected.currentData[key]) !==
        JSON.stringify(selected.proposedData[key]),
    }));
  }, [selected]);

  const setFilter = (key: "status" | "profileType", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL" && key === "profileType") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const openDetail = (revision: ProfileRevisionType) => {
    setSelected(revision);
    setReviewNotes(revision.reviewNotes ?? "");
  };

  const review = async (nextAction: "approve" | "reject") => {
    if (!selected) return;
    if (nextAction === "reject" && !reviewNotes.trim()) {
      toastError({ message: t("reviewNotesRequired") });
      return;
    }
    setAction(nextAction);
    try {
      const response =
        nextAction === "approve"
          ? await adminApiRequest.approveProfileRevision(
              selected.id,
              reviewNotes.trim() || null,
            )
          : await adminApiRequest.rejectProfileRevision(
              selected.id,
              reviewNotes.trim(),
            );
      setSelected(response.data);
      toastSuccess({
        message:
          nextAction === "approve" ? t("approvedToast") : t("rejectedToast"),
      });
      router.refresh();
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("reviewFailed"),
      });
    } finally {
      setAction(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          {t("filterStatusLabel")}
          <select
            className="block h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            value={currentStatus || "PENDING"}
            onChange={(event) => setFilter("status", event.target.value)}
          >
            <option value="ALL">{tCommon("all")}</option>
            <option value="PENDING">{tCommon("pending")}</option>
            <option value="APPROVED">{tCommon("approved")}</option>
            <option value="REJECTED">{tCommon("rejected")}</option>
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          {t("filterProfileTypeLabel")}
          <select
            className="block h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            value={currentType || "ALL"}
            onChange={(event) => setFilter("profileType", event.target.value)}
          >
            <option value="ALL">{t("filterAllProfiles")}</option>
            <option value="CLIENT">{tRoleName("CLIENT")}</option>
            <option value="FREELANCER">{tRoleName("FREELANCER")}</option>
            <option value="EXPERT">{tRoleName("EXPERT")}</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("colUser")}</TableHead>
              <TableHead>{t("colType")}</TableHead>
              <TableHead>{t("colStrength")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              <TableHead>{t("colSubmitted")}</TableHead>
              <TableHead className="text-right">{t("colAction")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revisions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  {currentStatus === "PENDING"
                    ? t("emptyPending")
                    : t("emptyFiltered")}
                </TableCell>
              </TableRow>
            ) : (
              revisions.map((revision) => (
                <TableRow key={revision.id}>
                  <TableCell>
                    <p className="font-medium">
                      {revision.user?.profile?.displayName ||
                        `User #${revision.userId}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {revision.user?.email}
                    </p>
                  </TableCell>
                  <TableCell className="capitalize">
                    {tRoleName(revision.profileType)}
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    {formatNumber(revision.profileStrength, locale)}%
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusClass(revision.status)}
                    >
                      {revision.status === "PENDING"
                        ? tCommon("pending")
                        : revision.status === "APPROVED"
                          ? tCommon("approved")
                          : tCommon("rejected")}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTime(revision.updatedAt, locale)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetail(revision)}
                    >
                      <Eye className="size-4" />
                      {revision.status === "PENDING"
                        ? t("actionReview")
                        : t("actionView")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 ? (
        <NumberedPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
        />
      ) : null}

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[90dvh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selected?.status === "PENDING"
                ? t("dialogTitlePending")
                : t("dialogTitleDetail")}
            </DialogTitle>
            <DialogDescription>{t("dialogDescription")}</DialogDescription>
          </DialogHeader>

          {selected ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                {selected.profileType === "EXPERT"
                  ? t("expertNotice")
                  : t("lowStrengthNotice", {
                      strength: formatNumber(selected.profileStrength, locale),
                    })}
              </div>
              <div className="hidden grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b pb-2 text-xs font-semibold text-muted-foreground sm:grid">
                <span>{t("colField")}</span>
                <span>{t("colPublished")}</span>
                <span>{t("colSubmittedValue")}</span>
              </div>
              <div className="space-y-2">
                {fields.map((field) => (
                  <div
                    key={field.key}
                    className={`grid grid-cols-1 gap-2 rounded-lg px-3 py-3 sm:grid-cols-[145px_minmax(0,1fr)_minmax(0,1fr)] ${
                      field.changed
                        ? "bg-amber-50 dark:bg-amber-950/20"
                        : "bg-muted/40"
                    }`}
                  >
                    <p className="text-xs font-semibold">
                      {fieldLabels[field.key] || field.key}
                    </p>
                    <div>
                      <p className="mb-1 text-[11px] font-medium text-muted-foreground sm:hidden">
                        {t("colPublished")}
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                        {presentValue(field.before, valueLabels)}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-medium text-muted-foreground sm:hidden">
                        {t("colSubmittedValue")}
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {presentValue(field.after, valueLabels)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-review-notes">
                  {selected.status === "PENDING"
                    ? t("notesLabelPending")
                    : t("notesLabelDecision")}
                </Label>
                <Textarea
                  id="profile-review-notes"
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  disabled={selected.status !== "PENDING" || action !== null}
                  placeholder={t("notesPlaceholder")}
                  rows={3}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            {selected?.profileType === "EXPERT" ? (
              <Button variant="outline" asChild>
                <Link href={`/admin/users/${selected.userId}`}>
                  {t("editExpertProfile")}
                </Link>
              </Button>
            ) : null}
            {selected?.status === "PENDING" ? (
              <>
                <Button
                  variant="destructive"
                  disabled={action !== null}
                  onClick={() => void review("reject")}
                >
                  {action === "reject" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <X className="size-4" />
                  )}
                  {t("rejectAction")}
                </Button>
                <Button
                  disabled={action !== null}
                  onClick={() => void review("approve")}
                >
                  {action === "approve" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  {t("approveAction")}
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
