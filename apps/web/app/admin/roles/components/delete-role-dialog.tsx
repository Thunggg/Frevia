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
        if (error instanceof ApiFail) {
          toastError({ message: error.message });
        } else {
          toastError({ message: "Failed to delete role" });
        }
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
          <AlertDialogTitle>Delete role</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{role.name}&quot;? This role
            will be removed from the list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRole.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteRole.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteRole.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
