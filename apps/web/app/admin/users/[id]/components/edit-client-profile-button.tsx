"use client";

import { useRouter } from "next/navigation";
import { useUpdateClientProfile } from "@/hooks/use-admin-user";
import { ApiFail } from "@/lib/http";
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
  ManageUserMessage,
  type AdminUpdateClientProfileBodyType,
  type AdminUserDetailResponseType,
} from "@shared/types";
import { Building2, Loader2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const FIELD_PATHS = new Set(["companyName", "companyDescription", "website"]);

const ClientProfileFormSchema = z.object({
  companyName: z
    .string()
    .trim()
    .max(255, ManageUserMessage.COMPANY_NAME_TOO_LONG),
  companyDescription: z
    .string()
    .trim()
    .max(5000, ManageUserMessage.COMPANY_DESCRIPTION_TOO_LONG),
  website: z.union([
    z.string().trim().url(ManageUserMessage.INVALID_WEBSITE),
    z.literal(""),
  ]),
});

type ClientProfileFormValues = z.infer<typeof ClientProfileFormSchema>;

interface EditClientProfileButtonProps {
  user: AdminUserDetailResponseType;
}

// ====== Nút "Edit profile / Complete profile" trong tab CLIENT (User Detail) ======
// Mở dialog sửa hồ sơ công ty của user: companyName / description / website.
// - Nếu user chưa có client profile → nút hiện "Complete profile" (server upsert tạo mới).
// - Bỏ trống 1 trường = xoá nội dung trường đó (gửi null).
export function EditClientProfileButton({
  user,
}: EditClientProfileButtonProps) {
  const router = useRouter();
  const t = useTranslations("adminUserProfileEdit");
  const [open, setOpen] = useState(false);
  const updateClientProfile = useUpdateClientProfile();
  const clientProfile = user.clientProfile;

  const form = useForm<ClientProfileFormValues>({
    resolver: useTranslatedResolver<ClientProfileFormValues>(
      ClientProfileFormSchema,
    ),
    defaultValues: {
      companyName: "",
      companyDescription: "",
      website: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        companyName: clientProfile?.companyName ?? "",
        companyDescription: clientProfile?.companyDescription ?? "",
        website: clientProfile?.website ?? "",
      });
    }
  }, [open, clientProfile, form]);

  const watched = form.watch();

  // So sánh form (chuẩn hoá rỗng → null) với dữ liệu hiện tại → disable Save nếu không đổi
  const hasChanges = useMemo(() => {
    const current = {
      companyName: clientProfile?.companyName ?? null,
      companyDescription: clientProfile?.companyDescription ?? null,
      website: clientProfile?.website ?? null,
    };
    const next = {
      companyName:
        watched.companyName.trim() === "" ? null : watched.companyName.trim(),
      companyDescription:
        watched.companyDescription.trim() === ""
          ? null
          : watched.companyDescription.trim(),
      website:
        watched.website.trim() === "" ? null : watched.website.trim(),
    };
    return (
      next.companyName !== current.companyName ||
      next.companyDescription !== current.companyDescription ||
      next.website !== current.website
    );
  }, [clientProfile, watched]);

  // Chỉ gửi lên các trường thay đổi (payload tối thiểu cho PATCH)
  function onSubmit(values: ClientProfileFormValues) {
    const current = {
      companyName: clientProfile?.companyName ?? null,
      companyDescription: clientProfile?.companyDescription ?? null,
      website: clientProfile?.website ?? null,
    };
    const next = {
      companyName:
        values.companyName.trim() === "" ? null : values.companyName.trim(),
      companyDescription:
        values.companyDescription.trim() === ""
          ? null
          : values.companyDescription.trim(),
      website: values.website.trim() === "" ? null : values.website.trim(),
    };

    const payload: AdminUpdateClientProfileBodyType = {};
    if (next.companyName !== current.companyName) {
      payload.companyName = next.companyName;
    }
    if (next.companyDescription !== current.companyDescription) {
      payload.companyDescription = next.companyDescription;
    }
    if (next.website !== current.website) {
      payload.website = next.website;
    }

    if (Object.keys(payload).length === 0) {
      setOpen(false);
      return;
    }

    updateClientProfile.mutate(
      { id: user.id, body: payload },
      {
        onSuccess: () => {
          toastSuccess({
            message: t("clientUpdated", { email: user.email }),
          });
          setOpen(false);
          router.refresh();
        },
        onError: (error) => {
          if (error instanceof ApiFail) {
            const details = error.response.error.details ?? [];
            if (details.length === 0) {
              toastError({ message: error.message });
              return;
            }
            for (const detail of details) {
              if (FIELD_PATHS.has(detail.path)) {
                form.setError(
                  detail.path as
                    | "companyName"
                    | "companyDescription"
                    | "website",
                  { type: "server", message: detail.message },
                );
              } else {
                toastError({ message: detail.message });
              }
            }
          } else {
            toastError({ message: t("clientUpdateFailed") });
          }
        },
      },
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 hover:bg-[#4fae2e]/10 hover:text-[#4fae2e] hover:border-[#4fae2e]/40 transition-colors"
          >
            {clientProfile ? (
              <Pencil className="h-3.5 w-3.5" />
            ) : (
              <Building2 className="h-3.5 w-3.5" />
            )}
            {clientProfile ? t("triggerEdit") : t("triggerComplete")}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#4fae2e]" />
              {clientProfile
                ? t("clientTitleEdit")
                : t("clientTitleComplete")}
            </DialogTitle>
            <DialogDescription>
              {t.rich("clientDescription", {
                b: (chunks) => (
                  <span className="font-medium text-foreground">{chunks}</span>
                ),
                email: user.email,
              })}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <Controller
                name="companyName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-client-companyName">
                      {t("clientFieldCompanyName")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="edit-client-companyName"
                      placeholder={t("clientCompanyNamePlaceholder")}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="companyDescription"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-client-companyDescription">
                      {t("clientFieldCompanyDescription")}
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="edit-client-companyDescription"
                      placeholder={t("clientCompanyDescriptionPlaceholder")}
                      rows={4}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="website"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-client-website">
                      {t("clientFieldWebsite")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="edit-client-website"
                      type="url"
                      placeholder={t("clientWebsitePlaceholder")}
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
                onClick={() => setOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={!hasChanges || updateClientProfile.isPending}
              >
                {updateClientProfile.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {t("saveChanges")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
