"use client";

import { useRouter } from "next/navigation";
import { useUpdateUser } from "@/hooks/use-admin-user";
import { ApiFail } from "@/lib/http";
import { handleErrorApi } from "@/lib/utils";
import { useTranslatedResolver } from "@/lib/form-resolver";
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
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useBackendMessage } from "@/hooks/use-backend-message";

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

// ====== Dialog "Edit User" (Admin) ======
// Chỉnh sửa thông tin chung account: email / display name / trạng thái Banned.
// - Dialog được điều khiển từ bảng danh sách (mở khi chọn 1 user, đóng qua onClose).
// - Khi submit chỉ gửi những trường THAY ĐỔI so với dữ liệu gốc.
export function EditUserDialog({ user, onClose }: EditUserDialogProps) {
  const router = useRouter();
  const t = useTranslations("adminUsers");
  const tCommon = useTranslations("adminCommon");
  const translateMessage = useBackendMessage();
  const updateUser = useUpdateUser();

  const form = useForm<EditUserFormValues>({
    resolver: useTranslatedResolver<EditUserFormValues>(EditUserFormSchema),
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

  // So sánh giá trị form (đã chuẩn hoá rỗng → null) với dữ liệu gốc để:
  // - disable nút Save khi chưa có gì thay đổi
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

  // Xây payload dạng "chỉ gửi trường đổi":
  // - tên để trống → null (xoá displayName)
  // - email/trạng thái ban chỉ gửi khi khác giá trị hiện tại
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
            message: updated.isBanned
              ? t("updatedBannedToast", { email: updated.email })
              : t("updatedToast", { email: updated.email }),
          });
          onClose();
          router.refresh();
        },
        onError: (error) => {
          if (error instanceof ApiFail) {
            const details = error.response.error.details ?? [];

            // Checkbox "Banned" không có chỗ hiển thị FieldError → toast thẳng message
            // (backend trả về key i18n nên phải dịch trước khi hiển thị)
            const banSelfDetail = details.find(
              (detail) =>
                detail.path === "isBanned" &&
                detail.message === ManageUserMessage.CANNOT_BAN_SELF,
            );
            if (banSelfDetail) {
              toastError({ message: translateMessage(banSelfDetail.message) });
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
            toastError({ message: t("updateFailed") });
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
            {t("editTitle")}
          </DialogTitle>
          <DialogDescription>
            {t.rich("editDescription", {
              b: (chunks) => (
                <span className="font-medium text-foreground">{chunks}</span>
              ),
              userName:
                user?.displayName || user?.email || t("thisUser"),
            })}
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
                    {t("fieldFullName")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-user-fullName"
                    placeholder={t("fullNamePlaceholder")}
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
                  <FieldLabel htmlFor="edit-user-email">
                    {tCommon("email")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-user-email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
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
                    {t("fieldBanned")}
                  </FieldLabel>
                </Field>
              )}
            />
            <p className="text-xs text-muted-foreground -mt-4 pl-6">
              {watched.isBanned ? t("bannedHint") : t("activeHint")}
            </p>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges || updateUser.isPending}
            >
              {updateUser.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {t("saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
