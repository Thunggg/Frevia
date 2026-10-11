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
    return "Failed to revoke session";
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

  // BR-02: session hết hạn không revoke lại
  if (isExpired) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled
        title="Expired session cannot be revoked"
        aria-label="Expired session cannot be revoked"
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

        // BR-04: revoke session hiện tại → logout ngay
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

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          aria-label={`Revoke session ${sessionId}`}
        >
          <ShieldOff className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke session</AlertDialogTitle>
          <AlertDialogDescription>
            Revoke session #{sessionId}
            {deviceInfo ? ` (${deviceInfo})` : ""}
            {isCurrent ? " (this device)" : ""}? That device will be signed out
            and must log in again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={revokeSession.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRevoke}
            disabled={revokeSession.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {revokeSession.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Revoke
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
