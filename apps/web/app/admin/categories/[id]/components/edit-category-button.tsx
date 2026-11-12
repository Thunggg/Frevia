"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/shadcn/button";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { UpdateCategoryDialog } from "../../components/update-category-dialog";
import type { ForumCategoryType } from "@shared/types";
import { useActionPermission } from "@/hooks/use-action-permission";

export function EditCategoryButton({
  category,
}: {
  category: ForumCategoryType;
}) {
  const t = useTranslations("adminCategories");
  const [open, setOpen] = useState(false);
  const { can } = useActionPermission();

  if (
    !can("PATCH", "/api/forums/admin/categories/:id") &&
    !can("PATCH", `/api/forums/admin/categories/${category.id}`)
  ) {
    return null;
  }

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
