"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { recommendationApiRequest } from "@/apiRequests/recommendation";
import { useActionPermission } from "@/hooks/use-action-permission";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  Sparkles,
  Database,
  RefreshCw,
  Cpu,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export function AiOpsContent() {
  const t = useTranslations("adminAiOps");
  const { can } = useActionPermission();

  const canReindex = can("POST", "/api/recommendations/reindex");
  const canProcessOutbox = can("POST", "/api/recommendations/outbox/process");

  const [isReindexing, setIsReindexing] = useState(false);
  const [reindexResult, setReindexResult] = useState<{ indexed: number } | null>(
    null,
  );

  const [isProcessingOutbox, setIsProcessingOutbox] = useState(false);
  const [outboxResult, setOutboxResult] = useState<{
    processed: number;
    failed: number;
  } | null>(null);

  // Không có bất kỳ quyền nào trong module Vận hành gợi ý AI
  if (!canReindex && !canProcessOutbox) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          {t("accessDenied")}
        </div>
      </div>
    );
  }

  const handleReindex = async () => {
    if (!canReindex) {
      toastError({ message: t("noPermissionAction") });
      return;
    }

    setIsReindexing(true);
    try {
      const response = await recommendationApiRequest.reindex();
      setReindexResult(response.data);
      toastSuccess({
        message: `${t("reindexSuccess")} (${response.data.indexed} items)`,
      });
    } catch {
      toastError({ message: t("reindexFailed") });
    } finally {
      setIsReindexing(false);
    }
  };

  const handleProcessOutbox = async () => {
    if (!canProcessOutbox) {
      toastError({ message: t("noPermissionAction") });
      return;
    }

    setIsProcessingOutbox(true);
    try {
      const response = await recommendationApiRequest.processOutbox();
      setOutboxResult(response.data);
      toastSuccess({
        message: `${t("outboxSuccess")} (${response.data.processed} processed, ${response.data.failed} failed)`,
      });
    } catch {
      toastError({ message: t("outboxFailed") });
    } finally {
      setIsProcessingOutbox(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          </div>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Reindex Recommendations (#566) */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Database className="size-5" />
                  </div>
                  <CardTitle className="text-lg">{t("reindexTitle")}</CardTitle>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  POST /api/recommendations/reindex
                </Badge>
              </div>
              <CardDescription className="pt-2">{t("reindexDesc")}</CardDescription>
            </CardHeader>

            {reindexResult && (
              <CardContent>
                <div className="flex items-center gap-2 rounded-md bg-muted/60 p-3 text-sm">
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400 shrink-0" />
                  <span>
                    Indexed: <strong>{reindexResult.indexed}</strong> items
                  </span>
                </div>
              </CardContent>
            )}
          </div>

          <CardFooter className="border-t pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {!canReindex ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3.5" />
                <span>{t("noPermissionAction")}</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                Khuyến nghị: Chạy khi cập nhật hệ số hoặc nạp lại embeddings
              </span>
            )}
            <Button
              onClick={handleReindex}
              disabled={isReindexing || !canReindex}
              className="w-full sm:w-auto"
            >
              <RefreshCw
                className={`mr-2 size-4 ${isReindexing ? "animate-spin" : ""}`}
              />
              {t("reindexBtn")}
            </Button>
          </CardFooter>
        </Card>

        {/* Card 2: Process Outbox (#567) */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Cpu className="size-5" />
                  </div>
                  <CardTitle className="text-lg">{t("outboxTitle")}</CardTitle>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  POST /api/recommendations/outbox/process
                </Badge>
              </div>
              <CardDescription className="pt-2">{t("outboxDesc")}</CardDescription>
            </CardHeader>

            {outboxResult && (
              <CardContent>
                <div className="flex items-center gap-3 rounded-md bg-muted/60 p-3 text-sm">
                  <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>Processed: {outboxResult.processed}</span>
                  </div>
                  {outboxResult.failed > 0 && (
                    <div className="flex items-center gap-1.5 text-destructive">
                      <AlertTriangle className="size-4 shrink-0" />
                      <span>Failed: {outboxResult.failed}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </div>

          <CardFooter className="border-t pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {!canProcessOutbox ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3.5" />
                <span>{t("noPermissionAction")}</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                Đồng bộ sự kiện việc làm & hồ sơ chưa được cập nhật vào vector store
              </span>
            )}
            <Button
              onClick={handleProcessOutbox}
              disabled={isProcessingOutbox || !canProcessOutbox}
              className="w-full sm:w-auto"
            >
              <Cpu
                className={`mr-2 size-4 ${isProcessingOutbox ? "animate-spin" : ""}`}
              />
              {t("outboxBtn")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

