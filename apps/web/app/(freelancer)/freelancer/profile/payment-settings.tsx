"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useActionPermission } from "@/hooks/use-action-permission";
import { paymentApiRequest } from "@/apiRequests/payment";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  History,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wallet,
  XCircle,
} from "@/components/icons";
import type {
  GetTransactionListQueryType,
  StripeConnectStatusResponseType,
  TransactionType,
} from "@shared/types";

function money(amount: number | string, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(Number(amount));
}

function formatDate(date: string | Date | null | undefined, locale: string) {
  if (!date) return "—";
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

interface PaymentSettingsProps {
  userRole?: string;
}

export function PaymentSettings({ userRole }: PaymentSettingsProps) {
  const t = useTranslations("payments");
  const locale = useLocale();
  const { can } = useActionPermission();
  const canGetPaymentMethods = can("GET", "/api/payments/payment-methods");
  const canGetConnectStatus = can("GET", "/api/payments/connect/status");
  const canCreateOnboardingLink = can(
    "POST",
    "/api/payments/connect/onboarding-link",
  );
  const canGetTransactions = can("GET", "/api/payments/transactions");

  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const isFreelancerOrExpert =
    userRole === "FREELANCER" || userRole === "EXPERT";

  // Query Saved Payment Methods (Cards) for Client
  const {
    data: paymentMethodsData,
    isLoading: paymentMethodsLoading,
  } = useQuery({
    queryKey: ["saved-payment-methods"],
    queryFn: async () => {
      const res = await paymentApiRequest.getSavedPaymentMethods();
      return res.data;
    },
    enabled: !isFreelancerOrExpert && canGetPaymentMethods,
  });

  // Query Connect Status (only relevant for recipients)
  const {
    data: connectStatus,
    isLoading: connectLoading,
    refetch: refetchConnect,
  } = useQuery<StripeConnectStatusResponseType>({
    queryKey: ["stripe-connect-status"],
    queryFn: async () => {
      const res = await paymentApiRequest.getConnectStatus();
      return res.data;
    },
    enabled: isFreelancerOrExpert && canGetConnectStatus,
  });

  // Query Transaction History
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["transactions", page, selectedType],
    queryFn: async () => {
      const query: Partial<GetTransactionListQueryType> = {
        page,
        limit: 10,
        ...(selectedType !== "ALL" && {
          type: selectedType as TransactionType["type"],
        }),
      };
      const res = await paymentApiRequest.getTransactions(query);
      return res.data;
    },
    enabled: canGetTransactions,
  });

  const handleStartOnboarding = async () => {
    setOnboardingLoading(true);
    try {
      const res = await paymentApiRequest.getOnboardingLink();
      if (res.data?.onboardingUrl) {
        toastSuccess({ message: t("settings.redirectingToast") });
        window.location.href = res.data.onboardingUrl;
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "response" in err
            ? (err as { response?: { error?: { message?: string } } }).response
                ?.error?.message || t("settings.accountCreationFailed")
            : t("settings.onboardingLinkFailed");
      toastError({
        message: errorMsg,
      });
    } finally {
      setOnboardingLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "ESCROW_DEPOSIT":
        return {
          label: t("types.ESCROW_DEPOSIT"),
          className: "bg-blue-50 text-[#0069D3] border-blue-200 dark:bg-blue-950/40 dark:text-blue-400",
        };
      case "MILESTONE_PAYOUT":
        return {
          label: t("types.PAYOUT_SHORT"),
          className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
        };
      case "PLATFORM_FEE":
        return {
          label: t("types.PLATFORM_FEE"),
          className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400",
        };
      case "REFUND":
        return {
          label: t("types.REFUND"),
          className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400",
        };
      default:
        return {
          label: type,
          className: "bg-zinc-100 text-zinc-700 border-zinc-200",
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" /> {t("statuses.SUCCEEDED")}
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <Clock className="size-3" /> {t("statuses.PENDING")}
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
            <XCircle className="size-3" /> {t("statuses.FAILED")}
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400">
            <RefreshCw className="size-3" /> {t("statuses.REFUNDED")}
          </span>
        );
      default:
        return <span className="text-[11px] text-muted-foreground">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Stripe Connect Card (For Freelancer & Expert) */}
      {isFreelancerOrExpert && canGetConnectStatus && (
        <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#0069D3]">
                  <Wallet className="size-4" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {t("connect.title")}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl pt-1">
                {t("settings.connectSubtitle")}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetchConnect()}
              disabled={connectLoading}
              className="rounded-full text-xs h-8 px-3 shrink-0 self-start sm:self-center"
            >
              <RefreshCw
                className={`mr-1.5 size-3.5 ${connectLoading ? "animate-spin" : ""}`}
              />
              {t("settings.refreshStatus")}
            </Button>
          </div>

          <div className="pt-5">
            {connectLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                <Loader2 className="size-4 animate-spin text-[#0069D3]" />
                <span>{t("settings.checkingVerification")}</span>
              </div>
            ) : connectStatus?.isConnected && connectStatus.payoutsEnabled ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {t("settings.connectedActive")}
                      </span>
                      <Badge className="bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5">
                        {t("connect.verified")}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono mt-0.5 block">
                      {t("settings.accountId", {
                        id: connectStatus.stripeAccountId ?? "",
                      })}
                    </span>
                  </div>
                </div>

                {canCreateOnboardingLink && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleStartOnboarding}
                    disabled={onboardingLoading}
                    className="rounded-full bg-foreground hover:bg-foreground/90 text-background text-xs font-semibold h-8 px-4 shrink-0"
                  >
                    {onboardingLoading ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <ExternalLink className="mr-1.5 size-3.5" />
                    )}
                    {t("settings.expressDashboard")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {t("settings.noPayoutAccount")}
                    </span>
                    <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px]">
                      {t("settings.actionRequired")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("settings.noPayoutDesc")}
                  </p>
                </div>

                {canCreateOnboardingLink && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleStartOnboarding}
                    disabled={onboardingLoading}
                    className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold h-9 px-5 shrink-0 shadow-sm"
                  >
                    {onboardingLoading ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <Building2 className="mr-1.5 size-3.5" />
                    )}
                    {t("settings.connectBankBtn")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Client Saved Payment Methods Card */}
      {!isFreelancerOrExpert && canGetPaymentMethods && (
        <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#0069D3]">
                <CreditCard className="size-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {t("settings.savedMethodsTitle")}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("settings.savedMethodsSubtitle")}
                </p>
              </div>
            </div>
          </div>

          {paymentMethodsLoading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="size-5 animate-spin mr-2" />
              <span className="text-xs">{t("settings.loadingSavedCards")}</span>
            </div>
          ) : paymentMethodsData?.paymentMethods &&
            paymentMethodsData.paymentMethods.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {paymentMethodsData.paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="rounded-xl border border-border/80 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {pm.brand}
                    </span>
                    {pm.isDefault && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-2 py-0.5">
                        {t("settings.defaultBadge")}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm font-mono tracking-widest text-foreground font-semibold">
                    •••• •••• •••• {pm.last4}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                    <span>{t("settings.expires")}</span>
                    <span>
                      {String(pm.expMonth).padStart(2, "0")}/{pm.expYear}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/80 bg-zinc-50/50 dark:bg-zinc-900/20 p-5 text-center space-y-2">
              <CreditCard className="size-6 text-muted-foreground mx-auto stroke-1" />
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {t("settings.noCardsSavedDesc")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. Client Escrow Info Card */}
      {!isFreelancerOrExpert && (
        <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950 p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {t("settings.escrowInfoTitle")}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("settings.escrowInfoSubtitle")}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs text-muted-foreground">
            <div className="rounded-xl border border-border/60 bg-zinc-50 dark:bg-zinc-900/40 p-4 space-y-1">
              <span className="font-semibold text-foreground block">
                {t("settings.escrowStep1Title")}
              </span>
              <p>{t("settings.escrowStep1Desc")}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-zinc-50 dark:bg-zinc-900/40 p-4 space-y-1">
              <span className="font-semibold text-foreground block">
                {t("settings.escrowStep2Title")}
              </span>
              <p>{t("settings.escrowStep2Desc")}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-zinc-50 dark:bg-zinc-900/40 p-4 space-y-1">
              <span className="font-semibold text-foreground block">
                {t("settings.escrowStep3Title")}
              </span>
              <p>{t("settings.escrowStep3Desc")}</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Transaction History Table */}
      {canGetTransactions && (
        <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900 text-foreground">
              <History className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {t("settings.historyTitle")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("settings.historySubtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-full border border-border bg-transparent px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0069D3]"
            >
              <option value="ALL">{t("settings.allTransactionTypes")}</option>
              <option value="ESCROW_DEPOSIT">
                {t("types.ESCROW_DEPOSIT")}
              </option>
              <option value="MILESTONE_PAYOUT">
                {t("types.PAYOUT_SHORT")}
              </option>
              <option value="PLATFORM_FEE">{t("types.PLATFORM_FEE")}</option>
              <option value="REFUND">{t("types.REFUND")}</option>
            </select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetchTransactions()}
              disabled={transactionsLoading}
              className="rounded-full text-xs h-8 px-3"
            >
              <RefreshCw
                className={`size-3.5 ${transactionsLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto rounded-xl border border-border/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/60 text-muted-foreground border-b border-border/80">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("detail.date")}</th>
                <th className="px-4 py-3 font-semibold">{t("detail.type")}</th>
                <th className="px-4 py-3 font-semibold text-right">
                  {t("billing.colAmount")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {t("billing.colStatus")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {t("detail.referenceId")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {transactionsLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-[#0069D3]" />
                    <span>{t("settings.loadingTransactions")}</span>
                  </td>
                </tr>
              ) : transactionsData?.data && transactionsData.data.length > 0 ? (
                transactionsData.data.map((tx: TransactionType) => {
                  const typeBadge = getTypeBadge(tx.type);
                  const isDebit =
                    tx.type === "MILESTONE_PAYOUT" ||
                    tx.type === "ARBITRATOR_PAYOUT";

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(tx.createdAt, locale)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${typeBadge.className}`}
                        >
                          {typeBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold whitespace-nowrap">
                        <span
                          className={
                            isDebit
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground"
                          }
                        >
                          {isDebit ? "+" : ""}
                          {money(tx.amount, tx.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(tx.status)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {tx.stripePaymentIntentId ||
                          tx.stripeTransferId ||
                          tx.stripeRefundId ||
                          `#${tx.id}`}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    <CreditCard className="size-6 mx-auto mb-2 text-muted-foreground/40" />
                    <span>{t("settings.noTransactionsRecorded")}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {transactionsData && transactionsData.totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <span>
              {t("settings.pageSummary", {
                page: transactionsData.page,
                totalPages: transactionsData.totalPages,
                totalItems: transactionsData.totalItems,
              })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-full text-xs h-8 px-3"
              >
                {t("billing.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((p) => Math.min(transactionsData.totalPages, p + 1))
                }
                disabled={page >= transactionsData.totalPages}
                className="rounded-full text-xs h-8 px-3"
              >
                {t("billing.next")}
              </Button>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
