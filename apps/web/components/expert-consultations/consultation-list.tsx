"use client";

import { expertConsultationApi } from "@/apiRequests/expert-consultation";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  XCircle,
} from "@/components/icons";
import { ApiFail } from "@/lib/http";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  ExpertConsultationStatus,
  type ExpertConsultationStatusType,
  type ExpertConsultationType,
} from "@shared/types";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

const STATUSES = Object.values(ExpertConsultationStatus);
const PAGE_SIZE = 8;

type ConsultationMode = "REQUESTER" | "EXPERT";
type TextAction = {
  kind: "REJECT" | "COMPLETE";
  consultation: ExpertConsultationType;
};

const statusClass: Record<ExpertConsultationStatusType, string> = {
  PENDING:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  ACCEPTED:
    "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
  IN_PROGRESS:
    "border-[#4fae2e]/40 bg-[#eaf8df] text-[#377d25] dark:bg-[#4fae2e]/15 dark:text-[#8ee36f]",
  COMPLETED:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  REJECTED:
    "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
  CANCELLED: "border-border bg-muted text-muted-foreground",
};

export function ConsultationList({ mode }: { mode: ConsultationMode }) {
  const t = useTranslations("expertConsultations");
  const format = useFormatter();
  const [consultations, setConsultations] = useState<ExpertConsultationType[]>(
    [],
  );
  const [status, setStatus] = useState<"ALL" | ExpertConsultationStatusType>(
    "ALL",
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [textAction, setTextAction] = useState<TextAction | null>(null);
  const [actionText, setActionText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = {
        page,
        limit: PAGE_SIZE,
        status: status === "ALL" ? undefined : status,
      };
      const response =
        mode === "EXPERT"
          ? await expertConsultationApi.listAssigned(query)
          : await expertConsultationApi.listMine(query);
      setConsultations(response.data.consultations);
      setTotalPages(Math.max(1, response.data.pagination.totalPages));
    } catch (cause) {
      setError(cause instanceof ApiFail ? cause.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [mode, page, status, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const replace = (updated: ExpertConsultationType) =>
    setConsultations((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );

  const run = async (
    consultation: ExpertConsultationType,
    action: "ACCEPT" | "START" | "CANCEL",
  ) => {
    const key = `${consultation.id}:${action}`;
    setPendingAction(key);
    try {
      const response =
        action === "ACCEPT"
          ? await expertConsultationApi.accept(consultation.id)
          : action === "START"
            ? await expertConsultationApi.start(consultation.id)
            : await expertConsultationApi.cancel(consultation.id);
      replace(response.data);
      toastSuccess({ message: t(`actionSuccess.${action}`) });
    } catch (cause) {
      toastError({
        message: cause instanceof ApiFail ? cause.message : t("actionFailed"),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const submitTextAction = async () => {
    if (!textAction) return;
    const value = actionText.trim();
    const minimum = textAction.kind === "REJECT" ? 3 : 10;
    if (value.length < minimum) return;
    const key = `${textAction.consultation.id}:${textAction.kind}`;
    setPendingAction(key);
    try {
      const response =
        textAction.kind === "REJECT"
          ? await expertConsultationApi.reject(textAction.consultation.id, {
              reason: value,
            })
          : await expertConsultationApi.complete(textAction.consultation.id, {
              response: value,
            });
      replace(response.data);
      toastSuccess({ message: t(`actionSuccess.${textAction.kind}`) });
      setTextAction(null);
      setActionText("");
    } catch (cause) {
      toastError({
        message: cause instanceof ApiFail ? cause.message : t("actionFailed"),
      });
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <section className="w-full px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {mode === "EXPERT" ? t("expertPageTitle") : t("myPageTitle")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {mode === "EXPERT"
                ? t("expertPageDescription")
                : t("myPageDescription")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as "ALL" | ExpertConsultationStatusType);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48" aria-label={t("statusFilter")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
                {STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {t(`statuses.${item}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => void load()}
              disabled={loading}
              aria-label={t("refresh")}
            >
              <RefreshCw
                className={loading ? "size-4 animate-spin" : "size-4"}
              />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="rounded-xl border p-5">
                <div className="flex justify-between gap-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="mt-4 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-7 rounded-xl border border-destructive/30 p-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void load()}
            >
              {t("tryAgain")}
            </Button>
          </div>
        ) : consultations.length === 0 ? (
          <div className="mt-7 rounded-xl border border-dashed px-6 py-16 text-center">
            <MessageSquare className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">{t("emptyTitle")}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {mode === "EXPERT" ? t("emptyExpert") : t("emptyRequester")}
            </p>
          </div>
        ) : (
          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            {consultations.map((consultation) => {
              const counterpart =
                mode === "EXPERT"
                  ? consultation.requester.profile
                  : consultation.expert.profile;
              const fallback = (counterpart?.displayName ?? "U")
                .charAt(0)
                .toUpperCase();
              return (
                <article
                  key={consultation.id}
                  className="flex flex-col rounded-xl border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-10 border">
                        <AvatarImage
                          src={counterpart?.avatarUrl ?? undefined}
                        />
                        <AvatarFallback>{fallback}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {counterpart?.displayName ?? t("unknownUser")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t(`types.${consultation.type}`)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={statusClass[consultation.status]}
                    >
                      {t(`statuses.${consultation.status}`)}
                    </Badge>
                  </div>

                  <h2 className="mt-5 text-lg font-semibold leading-6">
                    {consultation.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {consultation.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      {format.dateTime(new Date(consultation.createdAt), {
                        dateStyle: "medium",
                      })}
                    </span>
                    {consultation.startedAt ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {t("started")}
                      </span>
                    ) : null}
                  </div>

                  {consultation.expertResponse ? (
                    <div className="mt-5 rounded-lg bg-[#eaf8df] p-4 dark:bg-[#4fae2e]/10">
                      <p className="flex items-center gap-2 text-sm font-semibold text-[#377d25] dark:text-[#8ee36f]">
                        <CheckCircle2 className="size-4" />{" "}
                        {t("expertResponse")}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6">
                        {consultation.expertResponse}
                      </p>
                    </div>
                  ) : null}
                  {consultation.rejectionReason ? (
                    <div className="mt-5 rounded-lg bg-rose-50 p-4 dark:bg-rose-950/20">
                      <p className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-300">
                        <XCircle className="size-4" /> {t("rejectionReason")}
                      </p>
                      <p className="mt-2 text-sm leading-6">
                        {consultation.rejectionReason}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-auto flex flex-wrap justify-end gap-2 pt-5">
                    {mode === "EXPERT" && consultation.status === "PENDING" ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setActionText("");
                            setTextAction({ kind: "REJECT", consultation });
                          }}
                        >
                          {t("reject")}
                        </Button>
                        <Button
                          className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                          disabled={pendingAction !== null}
                          onClick={() => void run(consultation, "ACCEPT")}
                        >
                          {pendingAction === `${consultation.id}:ACCEPT` ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : null}
                          {t("accept")}
                        </Button>
                      </>
                    ) : null}
                    {mode === "EXPERT" && consultation.status === "ACCEPTED" ? (
                      <Button
                        className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                        disabled={pendingAction !== null}
                        onClick={() => void run(consultation, "START")}
                      >
                        {t("startConsultation")}
                      </Button>
                    ) : null}
                    {mode === "EXPERT" &&
                    consultation.status === "IN_PROGRESS" ? (
                      <Button
                        className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                        onClick={() => {
                          setActionText("");
                          setTextAction({ kind: "COMPLETE", consultation });
                        }}
                      >
                        <FileText className="size-4" /> {t("complete")}
                      </Button>
                    ) : null}
                    {mode === "REQUESTER" &&
                    (consultation.status === "PENDING" ||
                      consultation.status === "ACCEPTED") ? (
                      <Button
                        variant="outline"
                        disabled={pendingAction !== null}
                        onClick={() => void run(consultation, "CANCEL")}
                      >
                        {t("cancelRequest")}
                      </Button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !error && totalPages > 1 ? (
          <div className="mt-7 flex items-center justify-between border-t pt-5">
            <p className="text-sm text-muted-foreground">
              {t("page", { page, totalPages })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                {t("previous")}
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              >
                {t("next")}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog
        open={textAction !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !pendingAction) {
            setTextAction(null);
            setActionText("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {textAction?.kind === "REJECT"
                ? t("rejectTitle")
                : t("completeTitle")}
            </DialogTitle>
            <DialogDescription>
              {textAction?.kind === "REJECT"
                ? t("rejectDescription")
                : t("completeDescription")}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={actionText}
            onChange={(event) => setActionText(event.target.value)}
            rows={6}
            maxLength={5000}
            placeholder={
              textAction?.kind === "REJECT"
                ? t("rejectPlaceholder")
                : t("completePlaceholder")
            }
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTextAction(null)}
              disabled={pendingAction !== null}
            >
              {t("close")}
            </Button>
            <Button
              className="bg-[#4fae2e] text-white hover:bg-[#459928]"
              disabled={
                pendingAction !== null ||
                actionText.trim().length <
                  (textAction?.kind === "REJECT" ? 3 : 10)
              }
              onClick={() => void submitTextAction()}
            >
              {pendingAction ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {textAction?.kind === "REJECT" ? t("reject") : t("complete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
