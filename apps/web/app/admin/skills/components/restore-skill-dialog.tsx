"use client";

import { adminApiRequest } from "@/apiRequests/admin";
import { ApiFail } from "@/lib/http";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/shadcn/alert-dialog";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { SkillAdminItemType } from "@shared/types";
import { Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface RestoreSkillDialogProps {
  skill: Pick<SkillAdminItemType, "id" | "name">;
  triggerClassName?: string;
}

export function RestoreSkillDialog({
  skill,
  triggerClassName,
}: RestoreSkillDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRestore = async () => {
    setLoading(true);
    try {
      await adminApiRequest.restoreSkill(skill.id);
      toastSuccess({ message: "Skill restored successfully." });
      setOpen(false);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiFail) {
        const errorDetail = err.response?.error?.details?.[0]?.message;
        toastError({ message: errorDetail ?? "Failed to restore skill." });
      } else {
        toastError({ message: "An unexpected error occurred." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={
            triggerClassName ??
            "h-8 w-8 text-muted-foreground hover:bg-[#4fae2e]/10 hover:text-[#4fae2e] transition-colors"
          }
          title="Restore skill"
          aria-label={`Restore skill ${skill.name}`}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            Restore Skill
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to restore skill{" "}
              <span className="font-semibold text-foreground">
                &quot;{skill.name}&quot;
              </span>
              ? It will become active again in the skills catalog.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button
            onClick={(e) => {
              e.preventDefault();
              void handleRestore();
            }}
            disabled={loading}
            className="bg-[#4fae2e] text-white hover:bg-[#3f9225]"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Restore Skill
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}