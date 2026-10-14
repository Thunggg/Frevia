"use client";

import { useRouter } from "next/navigation";
import { useUpdateUser } from "@/hooks/use-admin-user";
import { ApiFail } from "@/lib/http";
import { handleErrorApi } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/shadcn/button";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/shadcn/field";
import { Input } from "@repo/ui/components/shadcn/input";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  AuthMessage,
  ManageUserMessage,
  type AdminUpdateUserBodyType,
  type AdminUserItemType,
} from "@shared/types";
import { Loader2, Pencil } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { z } from "zod";

const EditUserFormSchema = z.object({
  email: z
    .email(AuthMessage.INVALID_EMAIL)
    .trim()
    .toLowerCase()
    .max(254, AuthMessage.INVALID_EMAIL),
  fullName: z.string().trim().max(100, AuthMessage.FULLNAME_TOO_LONG),
  isBanned: z.boolean(),
});

type EditUserFormValues = z.infer<typeof EditUserFormSchema>;

interface EditUserDialogProps {
  user: AdminUserItemType | null;
  onClose: () => void;
}

export function EditUserDialog({ user, onClose }: EditUserDialogProps) {
  const router = useRouter();
  const updateUser = useUpdateUser();

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(EditUserFormSchema) as Resolver<EditUserFormValues>,
    defaultValues: {
      email: "",
      fullName: "",
      isBanned: false,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        fullName: user.displayName ?? "",
        isBanned: user.isBanned,
      });
    }
  }, [user, form]);

  const watched = form.watch();

  const hasChanges = useMemo(() => {
    if (!user) return false;
    const nextName = watched.fullName.trim();
    const targetName = nextName === "" ? null : nextName;
    return (
      watched.email.trim().toLowerCase() !== user.email.toLowerCase() ||
      targetName !== (user.displayName ?? null) ||
      watched.isBanned !== user.isBanned
    );
  }, [user, watched]);

  function onSubmit(values: EditUserFormValues) {
    if (!user || !hasChanges) return;

    const nextName = values.fullName.trim();
    const targetName = nextName === "" ? null : nextName;

    const payload: AdminUpdateUserBodyType = {};
    if (values.email.trim().toLowerCase() !== user.email.toLowerCase()) {
      payload.email = values.email;
    }
    if (targetName !== (user.displayName ?? null)) {
      payload.fullName = targetName;
    }
    if (values.isBanned !== user.isBanned) {
      payload.isBanned = values.isBanned;
    }

    updateUser.mutate(
      { id: user.id, body: payload },
      {
        onSuccess: (updated) => {
          toastSuccess({
            message: `User "${updated.email}" updated${
              updated.isBanned ? " · account banned" : ""
            }`,
          });
          onClose();
          router.refresh();
        },
        onError: (error) => {
          if (error instanceof ApiFail) {
            const details = error.response.error.details ?? [];

            // Checkbox "Banned" không có chỗ hiển thị FieldError → toast thẳng message code
            // (code dạng "Error.Xxx" để sau này dùng làm key cho i18n)
            const banSelfDetail = details.find(
              (detail) =>
                detail.path === "isBanned" &&
                detail.message === ManageUserMessage.CANNOT_BAN_SELF,
            );
            if (banSelfDetail) {
              toastError({ message: banSelfDetail.message });
              return;
            }

            handleErrorApi({
              error: error.response,
              setError: form.setError,
            });
            const hasFieldError = details.some((detail) =>
              ["email", "fullName"].includes(detail.path),
            );
            if (!hasFieldError) {
              toastError({ message: error.message });
            }
          } else {
            toastError({ message: "Failed to update user" });
          }
        },
      },
    );
  }

  return (
    <Dialog open={user !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-[#4fae2e]" />
            Edit user
          </DialogTitle>
          <DialogDescription>
            Update general account information for{" "}
            <span className="font-medium text-foreground">
              {user?.displayName || user?.email || "this user"}
            </span>
            .
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Controller
              name="fullName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-user-fullName">
                    Full name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-user-fullName"
                    placeholder="Jane Doe"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-user-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="edit-user-email"
                    type="email"
                    placeholder="jane@example.com"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="isBanned"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="edit-user-isBanned"
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                  <FieldLabel htmlFor="edit-user-isBanned">
                    Banned account
                  </FieldLabel>
                </Field>
              )}
            />
            <p className="text-xs text-muted-foreground -mt-4 pl-6">
              {watched.isBanned
                ? "Banned users cannot sign in or refresh their session."
                : "Leave unchecked to keep the account active."}
            </p>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges || updateUser.isPending}
            >
              {updateUser.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
