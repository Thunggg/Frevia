"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApiRequest } from "@/apiRequests/admin";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { Label } from "@repo/ui/components/shadcn/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { ApiFail } from "@/lib/http";
import { toastSuccess, toastError } from "@repo/ui/components/shadcn/toast";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ForumCategoryType } from "@shared/types";

interface UpdateCategoryDialogProps {
  category: ForumCategoryType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateCategoryDialog({
  category,
  open,
  onOpenChange,
}: UpdateCategoryDialogProps) {
  const t = useTranslations("adminCategories");
  const tCommon = useTranslations("adminCommon");
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name ?? "");
      setDescription(category.description ?? "");
    }
  }, [category]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName(category?.name ?? "");
      setDescription(category?.description ?? "");
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !name.trim()) return;

    setLoading(true);
    try {
      await adminApiRequest.updateCategory(category.id, {
        name: name.trim(),
        description: description.trim() || undefined,
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
      <DialogContent className="sm:max-w-[485px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("updateTitle")}</DialogTitle>
            <DialogDescription>{t("updateDescription")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">
                {t("detailFieldName")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("updateNamePlaceholder")}
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description" className="text-sm font-medium">
                {tCommon("description")}
              </Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                rows={3}
                disabled={loading}
              />
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
