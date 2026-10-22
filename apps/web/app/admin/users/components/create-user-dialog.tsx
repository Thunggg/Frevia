"use client";

import { useRouter } from "next/navigation";
import { useCreateUser } from "@/hooks/use-admin-user";
import { useRoles } from "@/hooks/use-role";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  AdminCreateUserBodySchema,
  type AdminCreateUserBodyType,
  type RoleListItemType,
} from "@shared/types";
import { Eye, EyeOff, Loader2, Plus, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

const ROLE_FIELD_PATHS = new Set([
  "roleId",
  "email",
  "fullName",
  "password",
  "confirmPassword",
]);

// ====== Dialog "Create User" (Admin) ======
// Tạo tài khoản mới: họ tên / email / password (kèm confirm) + chọn 1 role khởi tạo
// (Client | Freelancer | custom role — không cho chọn Admin).
export function CreateUserDialog() {
  const router = useRouter();
  const t = useTranslations("adminUsers");
  const tCommon = useTranslations("adminCommon");
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const createUser = useCreateUser();

  const {
    data: roles = [],
    isLoading: isRolesLoading,
    isError: isRolesError,
  } = useRoles();

  const form = useForm<AdminCreateUserBodyType>({
    resolver: useTranslatedResolver<AdminCreateUserBodyType>(
      AdminCreateUserBodySchema,
    ),
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
      roleId: 0,
    },
  });

  // Phân loại role để hiển thị dropdown: nhóm built-in (Client, Freelancer) + nhóm custom,
  // loại bỏ Admin (server cũng tự chặn nếu cố tình gửi lên).
  const roleEntries = useMemo(() => {
    const builtIn: RoleListItemType[] = [];
    const custom: RoleListItemType[] = [];

    for (const role of roles) {
      const lower = role.name.toLowerCase();
      if (lower === "admin") continue;
      if (lower === "client" || lower === "freelancer" || lower === "expert") {
        builtIn.push(role);
      } else {
        custom.push(role);
      }
    }

    builtIn.sort((a, b) => {
      const rank = (name: string) =>
        name.toLowerCase() === "client"
          ? 0
          : name.toLowerCase() === "freelancer"
            ? 1
            : 2;
      return rank(a.name) - rank(b.name);
    });
    custom.sort((a, b) => a.name.localeCompare(b.name));

    return { builtIn, custom };
  }, [roles]);

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
    }
  }

  // Submit: gọi API tạo user → thành công thì toast + đóng dialog + router.refresh()
  // để bảng danh sách user (server component) được render lại với dữ liệu mới.
  function onSubmit(payload: AdminCreateUserBodyType) {
    createUser.mutate(
      {
        email: payload.email,
        fullName: payload.fullName,
        password: payload.password,
        confirmPassword: payload.confirmPassword,
        roleId: payload.roleId,
      },
      {
        onSuccess: (created) => {
          toastSuccess({
            message: t("createdToast", {
              email: created.email,
              role: created.roles[0]?.name ?? t("noRoleInParentheses"),
            }),
          });
          handleOpenChange(false);
          router.refresh();
        },
        onError: (error) => {
          if (error instanceof ApiFail) {
            handleErrorApi({
              error: error.response,
              setError: form.setError,
            });
            const hasFieldError = error.response.error.details?.some((detail) =>
              ROLE_FIELD_PATHS.has(detail.path),
            );
            if (!hasFieldError) {
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
          {t("createUser")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#4fae2e]" />
            {t("createTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Controller
              name="fullName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="create-user-fullName">
                    {t("fieldFullName")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="create-user-fullName"
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
                  <FieldLabel htmlFor="create-user-email">
                    {tCommon("email")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="create-user-email"
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-user-password">
                      {t("fieldPassword")}
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        id="create-user-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground hover:text-foreground"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-user-confirmPassword">
                      {t("fieldConfirmPassword")}
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        id="create-user-confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground hover:text-foreground"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <Controller
              name="roleId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{t("fieldInitialRole")}</FieldLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(value) => field.onChange(Number(value))}
                    disabled={isRolesLoading || isRolesError}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue
                        placeholder={
                          isRolesLoading
                            ? t("loadingRoles")
                            : isRolesError
                              ? t("rolesLoadFailed")
                              : t("selectRole")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {roleEntries.builtIn.map((role) => (
                        <SelectItem key={role.id} value={String(role.id)}>
                          {role.name}
                        </SelectItem>
                      ))}
                      {roleEntries.custom.length > 0 && (
                        <>
                          <SelectItem
                            value="__custom-label"
                            disabled
                            className="text-xs font-medium text-muted-foreground"
                          >
                            {t("customRolesLabel")}
                          </SelectItem>
                          {roleEntries.custom.map((role) => (
                            <SelectItem key={role.id} value={String(role.id)}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t("passwordHint")}
                    </p>
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
            <Button
              type="submit"
              disabled={createUser.isPending || isRolesLoading || isRolesError}
            >
              {createUser.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {t("createSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
