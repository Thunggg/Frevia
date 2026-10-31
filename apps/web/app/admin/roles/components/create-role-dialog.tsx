"use client";

import { useCreateRole } from "@/hooks/use-role";
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
  type CreateRoleBodyType,
} from "@shared/types";
import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

export function CreateRoleDialog() {
  const t = useTranslations("adminRoles");
  const tCommon = useTranslations("adminCommon");
  const [open, setOpen] = useState(false);
  const createRole = useCreateRole();

  const form = useForm<CreateRoleBodyType>({
    resolver: useTranslatedResolver<CreateRoleBodyType>(CreateRoleBodySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
    }
  }

  function onSubmit(payload: CreateRoleBodyType) {
    createRole.mutate(
      {
        name: payload.name,
        description: payload.description?.trim() ? payload.description : null,
      },
      {
        onSuccess: (role) => {
          toastSuccess({ message: t("createdToast", { name: role.name }) });
          handleOpenChange(false);
        },
        onError: (error) => {
          if (error instanceof ApiFail) {
            handleErrorApi({
              error: error.response,
              setError: form.setError,
            });
            const hasFormFieldError = error.response.error.details?.some(
              (detail) => detail.path === "name" || detail.path === "description",
            );
            if (!hasFormFieldError) {
              toastError({ message: error.message });
            }
          } else {
            toastError({ message: t("createFailed") });
          }
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          {t("createRole")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("createTitle")}</DialogTitle>
          <DialogDescription>
            {t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="role-name">{t("fieldName")}</FieldLabel>
                  <Input
                    {...field}
                    id="role-name"
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
                  <FieldLabel htmlFor="role-description">
                    {t("fieldDescription")}
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="role-description"
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
            <Button type="submit" disabled={createRole.isPending}>
              {createRole.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {tCommon("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
