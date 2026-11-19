"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Landmark,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError } from "@repo/ui/components/shadcn/toast";
import { useActionPermission } from "@/hooks/use-action-permission";
import { paymentApiRequest } from "@/apiRequests/payment";
import { ApiFail } from "@/lib/http";
import type { StripeConnectStatusResponseType } from "@shared/types";

interface StripeConnectCardProps {
  returnPath: string;
}

/**
 * Stripe Express Connect status and onboarding card for Freelancer payouts.
 */
export function StripeConnectCard({ returnPath }: StripeConnectCardProps) {
  const t = useTranslations("payments.connect");
  const { can } = useActionPermission();
  const canGetConnectStatus = can("GET", "/api/payments/connect/status");
  const canCreateOnboardingLink = can(
    "POST",
    "/api/payments/connect/onboarding-link",
  );

  const [onboardingLoading, setOnboardingLoading] = useState(false);

  const {
    data: connectStatus,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<StripeConnectStatusResponseType>({
    queryKey: ["stripe-connect-status"],
    queryFn: async () => {
      const res = await paymentApiRequest.getConnectStatus();
      return res.data;
    },
    enabled: canGetConnectStatus,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Giới hạn tối đa 20 lần poll (khoảng 1 phút) để tránh gọi liên tục vô hạn
      if (query.state.dataUpdateCount >= 20) return false;
      return data?.isConnected && !data?.payoutsEnabled ? 3000 : false;
    },
  });

  const handleStartOnboarding = async () => {
    setOnboardingLoading(true);
    try {
      const returnUrl = `${window.location.origin}${returnPath}`;
      const res = await paymentApiRequest.getOnboardingLink(returnUrl);
      if (res.data?.onboardingUrl) {
        window.location.href = res.data.onboardingUrl;
      }
    } catch (err: unknown) {
      toastError({
        message:
          err instanceof ApiFail
            ? err.response.error.message
            : t("initFailed"),
      });
    } finally {
      setOnboardingLoading(false);
    }
  };

  const isVerified = Boolean(
    connectStatus?.isConnected && connectStatus?.payoutsEnabled,
  );
  const isPartiallyConnected = Boolean(
    connectStatus?.isConnected && !connectStatus?.payoutsEnabled,
  );

  if (!canGetConnectStatus) {
    return null;
  }

  return (
    <div className="h-full flex flex-col gap-3.5 rounded-sm border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
            {t("title")}
          </h3>
          {!isLoading && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold ${isVerified
                ? "text-blue-500 dark:bg-emerald-950/60 dark:text-emerald-300"
                : isPartiallyConnected
                  ? "text-amber-500 dark:bg-amber-950/60 dark:text-amber-300"
                  : "text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {isVerified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span>{t("verified")}</span>
                  </>
                ) : isPartiallyConnected ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span>{t("incomplete")}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>{t("notConnected")}</span>
                  </>
                )}
              </span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isLoading || isRefetching}
          aria-label={t("refreshAria")}
          className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <RefreshCw
            className={`size-3.5 ${isLoading || isRefetching ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-sm border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 px-3.5 py-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-[#0069D3]" />
          <span>{t("checkingStatus")}</span>
        </div>
      ) : (
        <div className="rounded-sm border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-3.5 space-y-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${isVerified
                ? "bg-blue-50 text-blue-500 dark:bg-emerald-950/60 dark:text-emerald-400"
                : "bg-[#635BFF]/10 text-[#635BFF] dark:text-indigo-300"
                }`}
            >
              {isVerified ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <Landmark className="size-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-foreground">
                {isVerified
                  ? t("activeTitle")
                  : isPartiallyConnected
                    ? t("finishVerificationTitle")
                    : t("connectBankTitle")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {isVerified && connectStatus?.stripeAccountId
                  ? t("activeDesc")
                  : isPartiallyConnected
                    ? t("incompleteDesc")
                    : t("notConnectedDesc")}
              </p>
            </div>
          </div>

          {canCreateOnboardingLink && (
            <Button
              type="button"
              size="sm"
              variant={isVerified ? "outline" : "default"}
              onClick={() => void handleStartOnboarding()}
              disabled={onboardingLoading}
              className={`w-full rounded-sm text-xs h-8.5 cursor-pointer ${isVerified
                ? "border-zinc-200/90 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                : "bg-[#0069D3] hover:bg-blue-400 text-white"
                }`}
            >
              {onboardingLoading ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  {t("redirecting")}
                </>
              ) : isVerified ? (
                <>
                  <ExternalLink className="mr-1.5 size-3.5" />
                  {t("updateDetails")}
                </>
              ) : isPartiallyConnected ? (
                <>
                  <ExternalLink className="mr-1.5 size-3.5" />
                  {t("continueOnboarding")}
                </>
              ) : (
                <>
                  <Landmark className="mr-1.5 size-3.5" />
                  {t("connectAccount")}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

