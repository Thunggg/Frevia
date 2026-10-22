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
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { SkillAdminDetailResponseType } from "@shared/types";
import { Loader2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UpdateSkillDialogProps {
  skill: Pick<
    SkillAdminDetailResponseType,
    "id" | "name" | "description"
  >;
  triggerClassName?: string;
}

export function UpdateSkillDialog({
  skill,
  triggerClassName,
}: UpdateSkillDialogProps) {
  const t = useTranslations("adminSkills");
  const tCommon = useTranslations("adminCommon");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(skill.name);
      setDescription(skill.description ?? "");
    }
  }, [open, skill]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await adminApiRequest.updateSkill(skill.id, {
        name: name.trim(),
        description:
          description.trim() === ""
            ? null
            : description.trim(),
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
          aria-label={t("updateTriggerOf", { name: skill.name })}
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
              <Label htmlFor="edit-name" className="text-sm font-medium">
                {tCommon("name")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
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