"use client";

import { useState } from "react";
import type { SkillAdminDetailResponseType } from "@shared/types";
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
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      {skill.deletedAt !== null ? (
        <RestoreSkillDialog
          skill={skill}
          triggerClassName="h-9 w-9 text-[#4fae2e] hover:bg-[#4fae2e]/10 hover:text-[#4fae2e]"
        />
      ) : (
        <>
          <UpdateSkillDialog
            skill={skill}
            triggerClassName="h-9 w-9 text-[#4fae2e] hover:bg-[#4fae2e]/10 hover:text-[#4fae2e]"
          />
          <button
            type="button"
            onClick={() => setDeleting(true)}
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            aria-label={`Delete skill ${skill.name}`}
          >
            Delete
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