"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Switch } from "@repo/ui/components/shadcn/switch";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  Bell,
  Calendar,
  Clock,
  DollarSign,
  Loader2,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
} from "@/components/icons";
import { getAlertBudgetLabel, JobAlertForm } from "./job-alert-form";
import {
  useDeleteJobAlert,
  useJobAlerts,
  useUpdateJobAlert,
} from "@/hooks/use-job-alerts";
import type { JobAlertType } from "@shared/types";

const CHANNEL_LABELS: Record<string, string> = {
  IN_APP: "In-app",
  EMAIL: "Email",
};

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function JobAlertsContent({ embedded = false }: { embedded?: boolean }) {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<JobAlertType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobAlertType | null>(null);

  const { data, isLoading, isError } = useJobAlerts({
    page,
    limit: 10,
    sortBy: "createdAt",
    order: "desc",
  });
  const updateAlert = useUpdateJobAlert();
  const deleteAlert = useDeleteJobAlert();

  const alerts = data?.data ?? [];
  const pagination = data?.pagination;

  const handleToggle = (alert: JobAlertType, nextValue: boolean) => {
    updateAlert.mutate(
      { id: alert.id, body: { isActive: nextValue } },
      {
        onError: () =>
          toastError({ message: "Unable to update job alert status." }),
      },
    );
  };

  const content = (
    <div className="w-full px-6 pt-8 pb-10 lg:px-8 max-w-6xl">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Job alerts
            </h1>
            {(pagination?.total ?? 0) > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-[#D0E1F8]/60 px-2.5 py-0.5 text-xs font-semibold text-[#0069D3] dark:bg-[#0069D3]/20 dark:text-blue-200">
                {pagination?.total} active
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Get notified when new jobs match your chosen criteria.
          </p>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          className="self-start sm:self-auto gap-2 rounded-full px-5 py-2.5 bg-[#0069D3] text-white hover:bg-blue-600 dark:bg-[#0069D3] dark:hover:bg-blue-500 text-xs sm:text-sm font-semibold shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="size-4" />
          New alert
        </Button>
      </div>

      {/* ── Content Body ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-3">
          <Loader2 className="size-8 animate-spin text-[#4fae2e]" />
          <p className="text-xs text-muted-foreground">Loading job alerts...</p>
        </div>
      ) : isError ? (
        <div className="mt-8 rounded-[24px] border border-destructive/20 bg-destructive/5 px-6 py-10 text-center">
          <Bell className="mx-auto size-8 text-destructive" />
          <p className="mt-3 font-medium text-foreground">
            Job alerts could not be loaded
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please refresh the page or try again later.
          </p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="mt-8 rounded-[28px] border border-dashed border-border bg-[#FBFBFC] dark:bg-zinc-900/40 px-6 py-20 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#D0E1F8] text-[#0069D3] dark:bg-[#0069D3]/20 dark:text-blue-200">
            <Bell className="size-7" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-foreground">
            No job alerts yet
          </h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Create an alert for skills, keywords, or a budget range and we will
            let you know when matching jobs appear.
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="mt-6 gap-2 rounded-full bg-[#0069D3] text-white hover:bg-blue-600 dark:bg-[#0069D3] dark:hover:bg-blue-500 text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="size-4" />
            Create your first alert
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {alerts.map((alert) => {
              const budgetLabel = getAlertBudgetLabel({
                name: alert.name,
                keywords: alert.keywords,
                budgetMin: alert.budgetMin,
                budgetMax: alert.budgetMax,
                budgetType: alert.budgetType,
                frequency: alert.frequency,
                channels: alert.channels,
                skills: alert.skills.map((skill) => skill.skillId),
              });
              return (
                <div
                  key={alert.id}
                  className={`group relative flex flex-col gap-4 rounded-[24px] border p-4 sm:p-5 transition-all duration-200 ${
                    alert.isActive
                      ? "border-[#0069D3]/20 bg-card hover:border-[#0069D3]/40 hover:shadow-xs"
                      : "border-black/[0.06] dark:border-white/[0.08] bg-card opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-full bg-[#D0E1F8] text-[#0069D3] dark:bg-[#0069D3]/20 dark:text-blue-200">
                        <Bell className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {alert.name}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {budgetLabel ? (
                            <span className="inline-flex items-center gap-1">
                              <DollarSign className="size-3.5" />
                              {budgetLabel}
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-1 capitalize">
                            <Calendar className="size-3.5" />
                            {alert.frequency.toLowerCase()}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3.5" />
                            Created {formatDate(alert.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!alert.isActive && (
                        <span className="rounded-full bg-[#F1F0F5] px-2 py-0.5 text-[10px] font-semibold text-muted-foreground dark:bg-zinc-800">
                          Paused
                        </span>
                      )}
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Switch
                          checked={alert.isActive}
                          onCheckedChange={(value) =>
                            handleToggle(alert, value)
                          }
                          disabled={updateAlert.isPending}
                        />
                        <span className="hidden sm:inline">
                          {alert.isActive ? "On" : "Off"}
                        </span>
                      </label>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit alert"
                        aria-label={`Edit alert ${alert.name}`}
                        onClick={() => setEditingAlert(alert)}
                        className="size-8 rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-zinc-800"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete alert"
                        aria-label={`Delete alert ${alert.name}`}
                        disabled={deleteAlert.isPending}
                        onClick={() => setDeleteTarget(alert)}
                        className="size-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {alert.skills.length > 0 ? (
                      alert.skills.map((skill) => (
                        <Badge
                          key={skill.skillId}
                          className="rounded-full border-0 bg-[#F1F0F5] px-3 py-1 text-xs font-medium text-foreground dark:bg-zinc-800"
                        >
                          <Tag className="mr-1 size-3" />
                          {skill.skill.name}
                        </Badge>
                      ))
                    ) : (
                      <Badge className="rounded-full border-0 bg-[#F1F0F5] px-3 py-1 text-xs font-medium text-muted-foreground dark:bg-zinc-800">
                        All skills
                      </Badge>
                    )}
                    {alert.channels.map((channel) => (
                      <Badge
                        key={channel}
                        variant="secondary"
                        className="rounded-full px-3 py-1 text-xs font-medium capitalize"
                      >
                        {CHANNEL_LABELS[channel] ?? channel.toLowerCase()}
                      </Badge>
                    ))}
                    {alert.keywords && (
                      <Badge
                        variant="outline"
                        className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground"
                      >
                        <Search className="mr-1 size-3" />
                        {alert.keywords}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {(pagination?.totalPages ?? 1) > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-full text-xs"
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {pagination?.page} of {pagination?.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (pagination?.totalPages ?? 1)}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-full text-xs"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── Create / Edit Sheet ── */}
      <JobAlertForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        alert={editingAlert ?? undefined}
        onSaved={() => {
          setEditingAlert(null);
        }}
      />

      {/* ── Delete Confirmation ── */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete job alert?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{deleteTarget?.name}&quot;. You
              cannot undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteAlert.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (!deleteTarget) return;
                deleteAlert.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    toastSuccess({ message: "Job alert deleted." });
                    setDeleteTarget(null);
                  },
                  onError: () =>
                    toastError({ message: "Unable to delete job alert." }),
                });
              }}
              className="rounded-full bg-destructive text-white hover:bg-destructive/90 text-xs"
            >
              {deleteAlert.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  if (embedded) {
    return <div className="min-h-full bg-background font-sans">{content}</div>;
  }

  return <div className="w-full bg-background font-sans">{content}</div>;
}
