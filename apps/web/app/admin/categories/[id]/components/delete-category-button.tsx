"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/shadcn/button";
import { Trash2 } from "lucide-react";
import { DeleteCategoryDialog } from "../../components/delete-category-dialog";
import type { ForumCategoryType } from "@shared/types";

export function DeleteCategoryButton({
  category,
}: {
  category: ForumCategoryType;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Delete Category
      </Button>
      <DeleteCategoryDialog
        category={category}
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => router.push("/admin/categories")}
      />
    </>
  );
}
