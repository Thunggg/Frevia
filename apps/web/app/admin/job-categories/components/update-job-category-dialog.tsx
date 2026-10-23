"use client";

import { adminApiRequest } from "@/apiRequests/admin";
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
import type {
  JobCategoryAdminItemType,
  JobCategoryStatusType,
} from "@shared/types";
import { Loader2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UpdateJobCategoryDialogProps {
  jobCategory: Pick<
    JobCategoryAdminItemType,
    "id" | "name" | "description" | "status"
  >;
  triggerClassName?: string;
}

export function UpdateJobCategoryDialog({
  jobCategory,
  triggerClassName,
}: UpdateJobCategoryDialogProps) {
  const t = useTranslations("adminJobCategories");
  const tCommon = useTranslations("adminCommon");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<JobCategoryStatusType>("ACTIVE");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(jobCategory.name);
      setDescription(jobCategory.description ?? "");
      setStatus(jobCategory.status);
    }
  }, [open, jobCategory]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await adminApiRequest.updateJobCategory(jobCategory.id, {
        name: name.trim(),
        description: description.trim() === "" ? null : description.trim(),
        status,
      });

      toastSuccess({ message: t("updatedToast") });
      handleOpenChange(false);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiFail) {
        const detailMessage = err.response?.error?.details?.[0]?.message;
        const message = detailMessage || err.message || t("updateFailed");
        toastError({ message });
      } else {
        toastError({ message: t("updateFailed") });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={
            triggerClassName ??
            "h-8 w-8 text-muted-foreground hover:bg-[#4fae2e]/10 hover:text-[#4fae2e] transition-colors"
          }
          title={t("updateTrigger")}
          aria-label={t("updateTriggerOf", { name: jobCategory.name })}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[485px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("updateTitle")}</DialogTitle>
            <DialogDescription>{t("updateDescription")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label
                htmlFor="edit-job-category-name"
                className="text-sm font-medium"
              >
                {tCommon("name")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-job-category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="edit-job-category-description"
                className="text-sm font-medium"
              >
                {tCommon("description")}
              </Label>
              <Textarea
                id="edit-job-category-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="edit-job-category-status"
                className="text-sm font-medium"
              >
                {t("statusFieldLabel")}
              </Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as JobCategoryStatusType)
                }
                disabled={loading}
              >
                <SelectTrigger id="edit-job-category-status" className="w-full">
                  <SelectValue placeholder={t("statusPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{t("statusActive")}</SelectItem>
                  <SelectItem value="INACTIVE">{t("statusInactive")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("statusHint")}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-[#4fae2e] text-white hover:bg-[#3f9225]"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
