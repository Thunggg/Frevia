"use client";

import { useDeleteRole } from "@/hooks/use-role";
import { ApiFail } from "@/lib/http";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/shadcn/alert-dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { RoleName, type RoleListItemType } from "@shared/types";
import { Loader2, Trash2 } from "lucide-react";
import { type MouseEvent, type ReactNode } from "react";

const SYSTEM_ROLE_NAMES = new Set(
  Object.values(RoleName).map((name) => name.toLowerCase()),
);

function isSystemRole(name: string) {
  return SYSTEM_ROLE_NAMES.has(name.trim().toLowerCase());
}

function getDeleteRoleErrorMessage(error: unknown): string {
  if (!(error instanceof ApiFail)) {
    return "Couldn't delete role. Try again.";
  }

  return error.response.error.details?.[0]?.message || error.message;
}

type DeleteRoleDialogProps = {
  role: RoleListItemType;
  trigger?: ReactNode;
  onDeleted?: () => void;
};

export function DeleteRoleDialog({
  role,
  trigger,
  onDeleted,
}: DeleteRoleDialogProps) {
  const deleteRole = useDeleteRole();

  function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    deleteRole.mutate(role.id, {
      onSuccess: () => {
        toastSuccess({ message: `Role "${role.name}" deleted` });
        onDeleted?.();
      },
      onError: (error) => {
        toastError({ message: getDeleteRoleErrorMessage(error) });
      },
    });
  }

  if (isSystemRole(role.name)) {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete role?</AlertDialogTitle>
          <AlertDialogDescription>
            Delete &quot;{role.name}&quot; permanently. If anyone still has this
            role, reassign them first.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRole.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteRole.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteRole.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Delete role
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
