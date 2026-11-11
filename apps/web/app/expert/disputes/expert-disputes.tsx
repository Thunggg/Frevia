"use client";

import { expertProfileApi } from "@/apiRequests/expert-profile";
import { ApiFail, http } from "@/lib/http";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  AdminDisputeDecisionBodySchema,
  type DisputeDetailType,
  type DisputeListResponseType,
} from "@shared/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, ArrowLeft, Loader2, Scale } from "lucide-react";
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

const statuses = [
  "OPEN",
  "WAITING_RESPONSE",
  "UNDER_REVIEW",
  "DECISION_MADE",
  "REVIEW_REQUESTED",
  "FINALIZED",
  "CANCELLED",
];

export function ExpertDisputes() {
  const t = useTranslations("expertDisputes");
  const format = useFormatter();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    freelancerAmount: number;
    clientAmount: number;
    decisionReason: string;
  } | null>(null);
  const profile = useQuery({
    queryKey: ["expert-profile"],
    queryFn: () => expertProfileApi.getMine().then((res) => res.data),
    retry: false,
  });
  const active = profile.data?.isActive === true;
  useEffect(() => {
    if (profile.data && !profile.data.isActive)
      router.replace("/expert/profile");
  }, [profile.data, router]);
  const list = useQuery({
    queryKey: ["expert-disputes", status, page],
    enabled: active,
    queryFn: () =>
      http
        .get<DisputeListResponseType>(
          `/expert/disputes?page=${page}&limit=10${status ? `&status=${status}` : ""}`,
        )
        .then((res) => res.data),
  });
  const detail = useQuery({
    queryKey: ["expert-dispute", selectedId],
    enabled: active && selectedId !== null,
    queryFn: () =>
      http
        .get<DisputeDetailType>(`/expert/disputes/${selectedId}`)
        .then((res) => res.data),
  });
  const dispute = detail.data;
  const finalDecision =
    dispute?.status === "REVIEW_REQUESTED" ||
    dispute?.status === "DECISION_MADE";
  const canDecide = dispute && statuses.slice(0, 5).includes(dispute.status);
  const error = profile.error || (selectedId ? detail.error : list.error);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = AdminDisputeDecisionBodySchema.safeParse({
      freelancerAmount: data.get("freelancerAmount"),
      clientAmount: data.get("clientAmount"),
      decisionReason: data.get("decisionReason"),
    });
    if (
      !parsed.success ||
      !dispute?.milestone ||
      !Number.isFinite(parsed.data.freelancerAmount) ||
      !Number.isFinite(parsed.data.clientAmount) ||
      Math.round(
        (parsed.data.freelancerAmount + parsed.data.clientAmount) * 100,
      ) !== Math.round(dispute.milestone.amount * 100)
    ) {
      toastError({ message: t("invalidDecision") });
      return;
    }
    setConfirmation(parsed.data);
  };
  const decide = async () => {
    if (!confirmation || !dispute) return;
    setPending(true);
    try {
      await http.post<DisputeDetailType>(
        `/expert/disputes/${dispute.id}/${finalDecision ? "final-decision" : "decision"}`,
        confirmation,
      );
      setConfirmation(null);
      toastSuccess({ message: t("saved") });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["expert-disputes"] }),
        queryClient.invalidateQueries({
          queryKey: ["expert-dispute", dispute.id],
        }),
      ]);
    } catch (error) {
      toastError({
        message: error instanceof ApiFail ? error.message : t("loadFailed"),
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <Scale
          className="mt-1 size-7 shrink-0 text-[#0069D3] dark:text-blue-300"
          aria-hidden="true"
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
      </header>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 p-5"
        >
          <p className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            {t("loadFailed")}
          </p>
          <Button
            className="mt-3"
            variant="outline"
            onClick={() =>
              void (profile.error
                ? profile.refetch()
                : selectedId
                  ? detail.refetch()
                  : list.refetch())
            }
          >
            {t("retry")}
          </Button>
        </div>
      ) : null}
      {!profile.data || !active ? (
        !error && (
          <div role="status" className="flex justify-center p-12">
            <Loader2
              className="size-6 animate-spin"
              aria-label={t("loading")}
            />
          </div>
        )
      ) : selectedId ? (
        <>
          <Button variant="ghost" onClick={() => setSelectedId(null)}>
            <ArrowLeft className="size-4" />
            {t("back")}
          </Button>
          {detail.isFetching ? (
            <p role="status">{t("loading")}</p>
          ) : dispute ? (
            <div className="space-y-5">
              <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">
                    #{dispute.id} · {dispute.reason}
                  </h2>
                  <Badge variant="secondary">
                    {t(`statuses.${dispute.status}`)}
                  </Badge>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-6">
                  {dispute.description}
                </p>
                <dl className="grid gap-4 border-t pt-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">{t("milestone")}</dt>
                    <dd className="mt-1 font-medium">
                      {dispute.milestone?.title} ·{" "}
                      {format.number(dispute.milestone?.amount ?? 0)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("parties")}</dt>
                    <dd className="mt-1 break-words">
                      {dispute.openedBy?.email} / {dispute.respondent?.email}
                    </dd>
                  </div>
                </dl>
                {dispute.decisionReason && (
                  <div className="space-y-2 border-t pt-4">
                    <h3 className="font-medium">{t("currentDecision")}</h3>
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {dispute.decisionReason}
                    </p>
                    <p className="text-sm">
                      {t("freelancerAmount")}:{" "}
                      {format.number(dispute.freelancerAmount ?? 0)} ·{" "}
                      {t("clientAmount")}:{" "}
                      {format.number(dispute.clientAmount ?? 0)}
                    </p>
                  </div>
                )}
              </section>
              <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
                <h2 className="text-lg font-semibold">{t("evidence")}</h2>
                {dispute.evidences?.length ? (
                  dispute.evidences.map((evidence) => (
                    <div
                      key={evidence.id}
                      className="space-y-2 rounded-lg border p-4"
                    >
                      <p className="text-xs text-muted-foreground">
                        {t("submittedBy", { id: evidence.submittedById })} ·{" "}
                        {evidence.type}
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {evidence.description}
                      </p>
                      {evidence.file &&
                        /^https?:\/\//i.test(evidence.file.fileUrl) && (
                          <a
                            className="break-all text-sm text-[#0069D3] underline dark:text-blue-300"
                            href={evidence.file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {evidence.file.fileName || t("openFile")}
                          </a>
                        )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("noEvidence")}
                  </p>
                )}
                {dispute.decisionReviews?.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-lg border p-4 text-sm"
                  >
                    <p className="font-medium">
                      {t("submittedBy", { id: review.userId })} ·{" "}
                      {review.response}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap break-words">
                      {review.reason}
                    </p>
                  </div>
                ))}
              </section>
              {canDecide && (
                <form
                  key={`${dispute.id}-${dispute.status}`}
                  onSubmit={submit}
                  className="space-y-5 rounded-xl border bg-card p-5 sm:p-6"
                >
                  <h2 className="text-lg font-semibold">
                    {t(finalDecision ? "finalDecision" : "decision")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("splitHint")}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="freelancerAmount">
                        {t("freelancerAmount")}
                      </Label>
                      <Input
                        id="freelancerAmount"
                        name="freelancerAmount"
                        type="number"
                        min="0"
                        max={dispute.milestone?.amount}
                        step="0.01"
                        required
                        defaultValue={dispute.freelancerAmount ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientAmount">{t("clientAmount")}</Label>
                      <Input
                        id="clientAmount"
                        name="clientAmount"
                        type="number"
                        min="0"
                        max={dispute.milestone?.amount}
                        step="0.01"
                        required
                        defaultValue={dispute.clientAmount ?? ""}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="decisionReason">{t("reason")}</Label>
                    <Textarea
                      id="decisionReason"
                      name="decisionReason"
                      minLength={5}
                      maxLength={3000}
                      required
                      defaultValue={dispute.decisionReason ?? ""}
                    />
                  </div>
                  <Button type="submit" disabled={pending}>
                    {t(finalDecision ? "finalDecision" : "decision")}
                  </Button>
                </form>
              )}
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Label htmlFor="dispute-status">{t("filter")}</Label>
            <select
              id="dispute-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">{t("all")}</option>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {t(`statuses.${value}`)}
                </option>
              ))}
            </select>
          </div>
          {list.isFetching ? (
            <p role="status">{t("loading")}</p>
          ) : list.data?.data.length ? (
            <div className="divide-y rounded-xl border bg-card">
              {list.data.data.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className="flex w-full flex-col gap-3 p-5 text-left hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="break-words font-medium">
                      #{item.id} · {item.reason}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.milestone?.title}
                    </p>
                  </div>
                  <Badge variant="secondary" className="w-fit shrink-0">
                    {t(`statuses.${item.status}`)}
                  </Badge>
                </button>
              ))}
            </div>
          ) : (
            !error && (
              <div className="rounded-xl border border-dashed px-5 py-14 text-center text-muted-foreground">
                {t("empty")}
              </div>
            )
          )}
          {list.data && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                disabled={page <= 1 || list.isFetching}
                onClick={() => setPage((value) => value - 1)}
              >
                {t("previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("page", {
                  page,
                  total: Math.max(1, list.data.pagination.totalPages),
                })}
              </span>
              <Button
                variant="outline"
                disabled={
                  page >= list.data.pagination.totalPages || list.isFetching
                }
                onClick={() => setPage((value) => value + 1)}
              >
                {t("next")}
              </Button>
            </div>
          )}
        </>
      )}
      <AlertDialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && !pending) setConfirmation(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(finalDecision ? "finalDecision" : "decision")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(finalDecision ? "confirmFinal" : "confirmDecision")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                void decide();
              }}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t("confirm")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
