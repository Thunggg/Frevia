"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { accountProfileApi } from "@/apiRequests/account-profile";
import { LivenessChallenge } from "@/components/identity/liveness-challenge";
import { ApiFail } from "@/lib/http";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  DocumentType,
  VerificationStatus,
  type DocumentTypeType,
} from "@shared/types";
import { Loader2, Upload } from "lucide-react";

const DOCUMENT_TYPE_KEYS = [
  "ID_CARD",
  "PASSPORT",
  "DRIVER_LICENSE",
  "RESIDENCE_PERMIT",
  "OTHER",
] as const;

/**
 * Form xác minh danh tính bằng AI (pipeline IDVerification):
 * ảnh mặt trước + mặt sau CCCD → selfie (frame đầu) + frames liveness
 * (thử thách webcam) → POST /identity-verifications/ai-check.
 *
 * - AI VERIFIED  → document PENDING, chờ admin duyệt (toast tương ứng).
 * - AI REJECTED  → document REJECTED kèm lý do (toast lý do).
 */
export function IdentityVerificationForm({
  onSubmitted,
}: {
  onSubmitted: () => void;
}) {
  const t = useTranslations("accountProfile");
  const tDocument = useTranslations("documentType");
  const [documentType, setDocumentType] = useState<DocumentTypeType>(
    DocumentType.ID_CARD,
  );
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [frames, setFrames] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const documentTypeLabel = (value: string) =>
    (DOCUMENT_TYPE_KEYS as readonly string[]).includes(value)
      ? tDocument(value)
      : value;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!front) {
      toastError({ message: t("selectFrontFirst") });
      return;
    }
    if (!frames.length) {
      toastError({ message: t("livenessRequired") });
      return;
    }
    setSubmitting(true);
    try {
      const response = await accountProfileApi.verifyIdentityAi({
        documentType,
        front,
        back,
        selfie: frames[0],
        liveness: frames,
      });
      const document = response.data;
      if (document.status === VerificationStatus.REJECTED) {
        toastError({
          message: t("aiSubmissionRejected", {
            reason: document.reviewNotes || t("aiCheckFailed"),
          }),
        });
      } else {
        toastSuccess({ message: t("aiSubmittedPending") });
      }
      onSubmitted();
    } catch (error) {
      if (error instanceof ApiFail) {
        toastError({
          message:
            error.response.error.details?.[0]?.message ?? error.message,
        });
      } else {
        toastError({ message: t("aiCheckFailed") });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="mt-5 space-y-5" onSubmit={submit}>
      <div className="space-y-2">
        <Label>{t("documentTypeLabel")}</Label>
        <Select
          value={documentType}
          onValueChange={(value) => setDocumentType(value as DocumentTypeType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(DocumentType).map((value) => (
              <SelectItem key={value} value={value}>
                {documentTypeLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="identity-front">{t("frontImageLabel")}</Label>
          <Input
            id="identity-front"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setFront(event.target.files?.[0] ?? null)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="identity-back">{t("backImageLabel")}</Label>
          <Input
            id="identity-back"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setBack(event.target.files?.[0] ?? null)}
          />
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        {t("fileImageHint")}
      </p>

      <div className="space-y-2">
        <Label>{t("livenessTitle")}</Label>
        <p className="text-xs text-muted-foreground">{t("livenessHint")}</p>
        <LivenessChallenge onComplete={setFrames} />
      </div>

      <Button
        className="bg-[#4fae2e] text-white hover:bg-[#459928]"
        disabled={submitting}
      >
        {submitting ? <Loader2 className="animate-spin" /> : <Upload />}
        {submitting ? t("verifying") : t("startVerification")}
      </Button>
    </form>
  );
}
