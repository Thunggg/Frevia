"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { SkillAdminDetailResponseType } from "@shared/types";
import { useActionPermission } from "@/hooks/use-action-permission";
import { DeleteSkillDialog } from "./delete-skill-dialog";
import { RestoreSkillDialog } from "./restore-skill-dialog";
import { UpdateSkillDialog } from "./update-skill-dialog";

interface SkillActionsProps {
  skill: Pick<
    SkillAdminDetailResponseType,
    "id" | "name" | "description" | "deletedAt" | "jobCount"
  >;
}

export function SkillActions({ skill }: SkillActionsProps) {
  const t = useTranslations("adminSkills");
  const tCommon = useTranslations("adminCommon");
  const [deleting, setDeleting] = useState(false);
  const { can } = useActionPermission();

  const canUpdate = can("PATCH", `/api/admin/skills/${skill.id}`);
  const canDelete = can("DELETE", `/api/admin/skills/${skill.id}`);
  const canRestore = can("PATCH", `/api/admin/skills/${skill.id}/restore`);

  if (skill.deletedAt !== null) {
    if (!canRestore) return null;
    return (
      <RestoreSkillDialog
        skill={skill}
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
        <UpdateSkillDialog
          skill={skill}
          triggerClassName="h-9 w-9 text-[#4fae2e] hover:bg-[#4fae2e]/10 hover:text-[#4fae2e]"
        />
      )}
      {canDelete && (
        <>
          <button
            type="button"
            onClick={() => setDeleting(true)}
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 cursor-pointer"
            aria-label={t("deleteSkillOf", { name: skill.name })}
          >
            {tCommon("delete")}
          </button>
          <DeleteSkillDialog
            skill={skill}
            open={deleting}
            onOpenChange={(open) => !open && setDeleting(false)}
          />
        </>
      )}
    </>
  );
}
