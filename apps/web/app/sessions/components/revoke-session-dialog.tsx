"use client";

import { useRevokeSession } from "@/hooks/use-session";
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
import { Loader2, ShieldOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { type MouseEvent } from "react";

function getRevokeSessionErrorMessage(error: unknown): string {
  if (!(error instanceof ApiFail)) {
    return "Couldn't revoke session. Try again.";
  }

  return error.response.error.details?.[0]?.message || error.message;
}

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
  const revokeSession = useRevokeSession();

  if (isExpired) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled
        title="Expired sessions can't be revoked"
        aria-label="Expired sessions can't be revoked"
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

  const deviceLabel = deviceInfo?.trim() || `Session #${sessionId}`;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Revoke ${deviceLabel}`}
        >
          <ShieldOff className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCurrent ? "Sign out this device?" : "Revoke this session?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isCurrent
              ? `You'll be signed out of ${deviceLabel} right away and need to log in again.`
              : `${deviceLabel} will be signed out and must log in again to continue.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={revokeSession.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRevoke}
            disabled={revokeSession.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {revokeSession.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            {isCurrent ? "Sign out" : "Revoke"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
