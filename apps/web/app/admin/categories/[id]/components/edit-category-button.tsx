"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/shadcn/button";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { UpdateCategoryDialog } from "../../components/update-category-dialog";
import type { ForumCategoryType } from "@shared/types";

export function EditCategoryButton({
  category,
}: {
  category: ForumCategoryType;
}) {
  const t = useTranslations("adminCategories");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Pencil className="h-4 w-4" />
        {t("editTrigger")}
      </Button>
      <UpdateCategoryDialog
        category={category}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
