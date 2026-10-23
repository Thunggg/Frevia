"use client";

import { expertConsultationApi } from "@/apiRequests/expert-consultation";
import { ApiFail } from "@/lib/http";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  ExpertConsultationType,
  type ExpertConsultationTypeType,
} from "@shared/types";
import { Loader2, MessageSquare } from "@/components/icons";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

const CONSULTATION_TYPES = Object.values(ExpertConsultationType);

export function ConsultationRequestButton({
  expertId,
  expertName,
}: {
  expertId: number;
  expertName: string;
}) {
  const t = useTranslations("expertConsultations");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<ExpertConsultationTypeType>(
    ExpertConsultationType.PROFILE_REVIEW,
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await expertConsultationApi.create({
        expertId,
        type,
        title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
      });
      toastSuccess({ message: t("requestCreated") });
      setOpen(false);
    } catch (error) {
      toastError({
        message: error instanceof ApiFail ? error.message : t("actionFailed"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-[#4fae2e] text-white hover:bg-[#459928]">
          <MessageSquare className="size-4" />
          {t("requestAction")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("requestTitle", { name: expertName })}</DialogTitle>
          <DialogDescription>{t("requestDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="consultation-type">{t("typeLabel")}</Label>
            <Select
              value={type}
              onValueChange={(value) =>
                setType(value as ExpertConsultationTypeType)
              }
            >
              <SelectTrigger id="consultation-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONSULTATION_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {t(`types.${item}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="consultation-title">{t("subjectLabel")}</Label>
            <Input
              id="consultation-title"
              name="title"
              minLength={5}
              maxLength={255}
              required
              placeholder={t("subjectPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consultation-description">
              {t("detailsLabel")}
            </Label>
            <Textarea
              id="consultation-description"
              name="description"
              rows={6}
              minLength={20}
              maxLength={5000}
              required
              placeholder={t("detailsPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">{t("detailsHint")}</p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              {t("close")}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#4fae2e] text-white hover:bg-[#459928]"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("sendRequest")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
