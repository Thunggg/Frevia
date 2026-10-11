"use client";

import { useSession } from "@/hooks/use-session";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { Eye } from "lucide-react";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type SessionDetailDialogProps = {
  sessionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SessionDetailDialog({
  sessionId,
  open,
  onOpenChange,
}: SessionDetailDialogProps) {
  const id = sessionId ?? 0;
  const { data: session, isLoading, isError } = useSession(id, open && id > 0);

  const expired =
    session != null && new Date(session.expiresAt).getTime() < Date.now();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {session ? `Session #${session.id}` : "Session detail"}
          </DialogTitle>
          <DialogDescription>
            Device session information for your account
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : isError || !session ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Failed to load session detail. The session may not exist.
          </p>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={expired ? "destructive" : "secondary"}>
                {expired ? "Expired" : "Active"}
              </Badge>
            </div>
            <DetailRow label="ID" value={String(session.id)} mono />
            <DetailRow label="User ID" value={String(session.userId)} mono />
            <DetailRow
              label="Device"
              value={session.deviceInfo || "—"}
            />
            <DetailRow
              label="IP Address"
              value={session.ipAddress || "—"}
              mono
            />
            <DetailRow
              label="Created"
              value={formatDate(session.createdAt)}
            />
            <DetailRow
              label="Expires"
              value={formatDate(session.expiresAt)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm break-all ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

type ViewSessionButtonProps = {
  sessionId: number;
  onView: (sessionId: number) => void;
};

export function ViewSessionButton({
  sessionId,
  onView,
}: ViewSessionButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`View session ${sessionId}`}
      onClick={() => onView(sessionId)}
    >
      <Eye className="size-4" />
    </Button>
  );
}
