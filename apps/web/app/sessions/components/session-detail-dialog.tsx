"use client";

import { useSession } from "@/hooks/use-session";
import { useFormatter, useTranslations } from "next-intl";
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
import { Eye } from "@/components/icons";

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
  const t = useTranslations("sessions");
  const format = useFormatter();
  const { data: session, isLoading, isError } = useSession(id, open && id > 0);

  const formatDate = (value: Date | string) =>
    format.dateTime(new Date(value), {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const expired =
    session != null && new Date(session.expiresAt).getTime() < Date.now();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {session
              ? t("sessionFallback", { id: session.id })
              : t("detailTitle")}
          </DialogTitle>
          <DialogDescription>{t("detailDescription")}</DialogDescription>
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
            {t("detailLoadFailed")}
          </p>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">
                {t("colStatus")}
              </span>
              <div className="flex items-center gap-2">
                {session.isCurrent && (
                  <Badge variant="default">{t("current")}</Badge>
                )}
                <Badge variant={expired ? "destructive" : "secondary"}>
                  {expired ? t("expired") : t("active")}
                </Badge>
              </div>
            </div>
            <DetailRow label={t("detailId")} value={String(session.id)} mono />
            <DetailRow
              label={t("detailUserId")}
              value={String(session.userId)}
              mono
            />
            <DetailRow
              label={t("detailDevice")}
              value={session.deviceInfo || "—"}
            />
            <DetailRow
              label={t("detailIp")}
              value={session.ipAddress || "—"}
              mono
            />
            <DetailRow
              label={t("detailCreated")}
              value={formatDate(session.createdAt)}
            />
            <DetailRow
              label={t("detailExpires")}
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
  const t = useTranslations("sessions");

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t("viewAria", { id: sessionId })}
      onClick={() => onView(sessionId)}
    >
      <Eye className="size-4" />
    </Button>
  );
}
