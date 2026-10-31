"use client";

import { useUpdateRole } from "@/hooks/use-role";
import { ApiFail } from "@/lib/http";
import { handleErrorApi } from "@/lib/utils";
import { useTranslatedResolver } from "@/lib/form-resolver";
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/shadcn/field";
import { Input } from "@repo/ui/components/shadcn/input";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  CreateRoleBodySchema,
  RoleName,
  type CreateRoleBodyType,
  type RoleListItemType,
} from "@shared/types";
import { Loader2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { Controller, useForm } from "react-hook-form";

const SYSTEM_ROLE_NAMES = new Set(
  Object.values(RoleName).map((name) => name.toLowerCase()),
);

function isSystemRole(name: string) {
  return SYSTEM_ROLE_NAMES.has(name.trim().toLowerCase());
}

type UpdateRoleDialogProps = {
  role: RoleListItemType;
  trigger?: ReactNode;
};

export function UpdateRoleDialog({ role, trigger }: UpdateRoleDialogProps) {
  const t = useTranslations("adminRoles");
  const tCommon = useTranslations("adminCommon");
  const [open, setOpen] = useState(false);
  const updateRole = useUpdateRole();

  const form = useForm<CreateRoleBodyType>({
    resolver: useTranslatedResolver<CreateRoleBodyType>(CreateRoleBodySchema),
    defaultValues: {
      name: role.name,
      description: role.description ?? "",
    },
  });

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      form.reset({
        name: role.name,
        description: role.description ?? "",
      });
    }
  }

  function onSubmit(payload: CreateRoleBodyType) {
    if (isSystemRole(payload.name)) {
      form.setError("name", {
        type: "manual",
        message: t("systemRoleNameError"),
      });
      return;
    }

    updateRole.mutate(
      {
        id: role.id,
        body: {
          name: payload.name,
          description: payload.description?.trim() ? payload.description : null,
        },
      },
      {
        onSuccess: (updated) => {
          toastSuccess({ message: t("updatedToast", { name: updated.name }) });
          setOpen(false);
        },
        onError: (error) => {
          if (error instanceof ApiFail) {
            handleErrorApi({
              error: error.response,
              setError: form.setError,
            });
            const hasFormFieldError = error.response.error.details?.some(
              (detail) =>
                detail.path === "name" || detail.path === "description",
            );
            if (!hasFormFieldError) {
              toastError({ message: error.message });
            }
          } else {
            toastError({ message: tCommon("updateFailed") });
          }
        },
      },
    );
  }

  if (isSystemRole(role.name)) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("updateTitle")}</DialogTitle>
          <DialogDescription>
            {t("updateDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`update-role-name-${role.id}`}>
                    {t("fieldName")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`update-role-name-${role.id}`}
                    placeholder={t("namePlaceholder")}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`update-role-description-${role.id}`}>
                    {t("fieldDescription")}
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id={`update-role-description-${role.id}`}
                    value={field.value ?? ""}
                    placeholder={t("descriptionPlaceholder")}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={updateRole.isPending}>
              {updateRole.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
