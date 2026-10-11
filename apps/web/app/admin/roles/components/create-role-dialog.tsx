"use client";

import { useCreateRole } from "@/hooks/use-role";
import { ApiFail } from "@/lib/http";
import { handleErrorApi } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";

export function CreateRoleDialog() {
  const [open, setOpen] = useState(false);
  const createRole = useCreateRole();

  const form = useForm<CreateRoleBodyType>({
    resolver: zodResolver(CreateRoleBodySchema) as Resolver<CreateRoleBodyType>,
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
          toastSuccess({ message: `Role "${role.name}" created` });
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
            toastError({ message: "Failed to create role" });
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
          Create role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create new role</DialogTitle>
          <DialogDescription>
            Add a custom role with a name and optional description.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="role-name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="role-name"
                    placeholder="Moderator"
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
                  <FieldLabel htmlFor="role-description">Description</FieldLabel>
                  <Textarea
                    {...field}
                    id="role-description"
                    value={field.value ?? ""}
                    placeholder="What this role can do"
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
              Cancel
            </Button>
            <Button type="submit" disabled={createRole.isPending}>
              {createRole.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
