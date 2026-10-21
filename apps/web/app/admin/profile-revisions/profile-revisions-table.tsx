"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ProfileRevisionType } from "@shared/types";
import { adminApiRequest } from "@/apiRequests/admin";
import { ApiFail } from "@/lib/http";
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

const fieldLabels: Record<string, string> = {
  displayName: "Display name",
  title: "Professional title",
  bio: "Bio",
  availabilityStatus: "Availability",
  education: "Education",
  certifications: "Certifications",
  languages: "Languages",
  companyName: "Company name",
  companyDescription: "Company description",
  website: "Website",
  expertise: "Expertise",
  yearsOfExperience: "Years of experience",
};

function presentValue(value: unknown) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "None";
  if (value === null || value === undefined || value === "") return "Not set";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<ProfileRevisionType | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

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
      toastError({ message: "Enter a reason before rejecting this request." });
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
          nextAction === "approve"
            ? "Profile changes approved."
            : "Profile changes rejected.",
      });
      router.refresh();
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Unable to review this request.",
      });
    } finally {
      setAction(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Status
          <select
            className="block h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            value={currentStatus || "PENDING"}
            onChange={(event) => setFilter("status", event.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Profile type
          <select
            className="block h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            value={currentType || "ALL"}
            onChange={(event) => setFilter("profileType", event.target.value)}
          >
            <option value="ALL">All profiles</option>
            <option value="CLIENT">Client</option>
            <option value="FREELANCER">Freelancer</option>
            <option value="EXPERT">Expert</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Strength</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Action</TableHead>
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
                    ? "No profile update requests are awaiting review."
                    : "No profile review history matches these filters."}
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
                    {revision.profileType.toLowerCase()}
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    {revision.profileStrength}%
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusClass(revision.status)}
                    >
                      {revision.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(revision.updatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetail(revision)}
                    >
                      <Eye className="size-4" />
                      {revision.status === "PENDING" ? "Review" : "View"}
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
                ? "Review profile changes"
                : "Profile review detail"}
            </DialogTitle>
            <DialogDescription>
              Verify the account information. Changed fields are highlighted
              when the user submitted an update.
            </DialogDescription>
          </DialogHeader>

          {selected ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                {selected.profileType === "EXPERT"
                  ? "Expert profile updates require administrator approval before they become public."
                  : `This request requires manual review because the profile strength was ${selected.profileStrength}% at submission, below the 20% threshold.`}
              </div>
              <div className="hidden grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b pb-2 text-xs font-semibold text-muted-foreground sm:grid">
                <span>Field</span>
                <span>Published</span>
                <span>Submitted</span>
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
                        Published
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                        {presentValue(field.before)}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-medium text-muted-foreground sm:hidden">
                        Submitted
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {presentValue(field.after)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-review-notes">
                  {selected.status === "PENDING"
                    ? "Review notes"
                    : "Decision notes"}
                </Label>
                <Textarea
                  id="profile-review-notes"
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  disabled={selected.status !== "PENDING" || action !== null}
                  placeholder="Required when rejecting"
                  rows={3}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            {selected?.profileType === "EXPERT" ? (
              <Button variant="outline" asChild>
                <Link href={`/admin/users/${selected.userId}`}>
                  Edit expert profile
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
                  Reject
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
                  Approve
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
