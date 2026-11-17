"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { JobCategoryAdminDetailResponseType } from "@shared/types";
import { useActionPermission } from "@/hooks/use-action-permission";
import { DeleteJobCategoryDialog } from "./delete-job-category-dialog";
import { RestoreJobCategoryDialog } from "./restore-job-category-dialog";
import { UpdateJobCategoryDialog } from "./update-job-category-dialog";

interface JobCategoryActionsProps {
  jobCategory: Pick<
    JobCategoryAdminDetailResponseType,
    "id" | "name" | "description" | "status" | "deletedAt" | "jobCount"
  >;
}

export function JobCategoryActions({ jobCategory }: JobCategoryActionsProps) {
  const t = useTranslations("adminJobCategories");
  const tCommon = useTranslations("adminCommon");
  const [deleting, setDeleting] = useState(false);
  const { can } = useActionPermission();

  const canUpdate = can("PATCH", `/api/admin/job-categories/${jobCategory.id}`);
  const canDelete = can("DELETE", `/api/admin/job-categories/${jobCategory.id}`);
  const canRestore = can(
    "PATCH",
    `/api/admin/job-categories/${jobCategory.id}/restore`,
  );

  if (jobCategory.deletedAt !== null) {
    if (!canRestore) return null;
    return (
      <RestoreJobCategoryDialog
        jobCategory={jobCategory}
        triggerClassName="h-9 w-9 text-[#4fae2e] hover:bg-[#4fae2e]/10 hover:text-[#4fae2e]"
      />
    );
  }

  if (!canUpdate && !canDelete) {
    return null;
  }

  return (
    <>
      {canUpdate && (
        <UpdateJobCategoryDialog
          jobCategory={jobCategory}
          triggerClassName="h-9 w-9 text-[#4fae2e] hover:bg-[#4fae2e]/10 hover:text-[#4fae2e]"
        />
      )}
      {canDelete && (
        <>
          <button
            type="button"
            onClick={() => setDeleting(true)}
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 cursor-pointer"
            aria-label={t("deleteTriggerOf", { name: jobCategory.name })}
          >
            {tCommon("delete")}
          </button>
          <DeleteJobCategoryDialog
            jobCategory={jobCategory}
            open={deleting}
            onOpenChange={(open) => !open && setDeleting(false)}
          />
        </>
      )}
    </>
  );
}
