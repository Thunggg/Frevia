"use client";

import { useRevokeSession } from "@/hooks/use-session";
import { useTranslations } from "next-intl";
import { ApiFail } from "@/lib/http";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/shadcn/alert-dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { Loader2, ShieldOff } from "@/components/icons";
import { useRouter } from "next/navigation";
import { type MouseEvent } from "react";

type RevokeSessionDialogProps = {
  sessionId: number;
  deviceInfo?: string | null;
  isCurrent?: boolean;
  isExpired?: boolean;
  onRevoked?: () => void;
};

export function RevokeSessionDialog({
  sessionId,
  deviceInfo,
  isCurrent = false,
  isExpired = false,
  onRevoked,
}: RevokeSessionDialogProps) {
  const router = useRouter();
  const t = useTranslations("sessions");
  const revokeSession = useRevokeSession();

  function getRevokeSessionErrorMessage(error: unknown): string {
    if (!(error instanceof ApiFail)) {
      return t("revokeFailed");
    }

    return error.response.error.details?.[0]?.message || error.message;
  }

  if (isExpired) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled
        title={t("expiredCannotRevoke")}
        aria-label={t("expiredCannotRevoke")}
      >
        <ShieldOff className="size-4 opacity-40" />
      </Button>
    );
  }

  async function handleRevoke(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    revokeSession.mutate(sessionId, {
      onSuccess: async (data) => {
        toastSuccess({ message: data.message });
        onRevoked?.();

        if (data.loggedOut) {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/login");
          router.refresh();
        }
      },
      onError: (error) => {
        toastError({ message: getRevokeSessionErrorMessage(error) });
      },
    });
  }

  const deviceLabel = deviceInfo?.trim() || t("sessionFallback", { id: sessionId });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={t("revokeAria", { device: deviceLabel })}
        >
          <ShieldOff className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCurrent ? t("signOutTitle") : t("revokeTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isCurrent
              ? t("signOutDescription", { device: deviceLabel })
              : t("revokeDescription", { device: deviceLabel })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={revokeSession.isPending}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRevoke}
            disabled={revokeSession.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {revokeSession.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            {isCurrent ? t("signOut") : t("revoke")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
