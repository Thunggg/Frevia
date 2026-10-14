"use client";

import { useRouter } from "next/navigation";
import { useCreateUser } from "@/hooks/use-admin-user";
import { useRoles } from "@/hooks/use-role";
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
import { useMemo, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";

const ROLE_FIELD_PATHS = new Set(["roleId", "email", "fullName", "password", "confirmPassword"]);

export function CreateUserDialog() {
  const router = useRouter();
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
    resolver: zodResolver(
      AdminCreateUserBodySchema,
    ) as Resolver<AdminCreateUserBodyType>,
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
      roleId: 0,
    },
  });

  const roleEntries = useMemo(() => {
    const builtIn: RoleListItemType[] = [];
    const custom: RoleListItemType[] = [];

    for (const role of roles) {
      const lower = role.name.toLowerCase();
      if (lower === "admin") continue;
      if (lower === "client" || lower === "freelancer") {
        builtIn.push(role);
      } else {
        custom.push(role);
      }
    }

    builtIn.sort((a, b) => {
      const rank = (name: string) => (name.toLowerCase() === "client" ? 0 : 1);
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
            message: `User "${created.email}" created (${created.roles[0]?.name ?? "no role"})`,
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
            toastError({ message: "Failed to create user" });
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
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#4fae2e]" />
            Create new user
          </DialogTitle>
          <DialogDescription>
            Create an account and set its initial role. The user can sign in
            with the password you provide.
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
                    Full name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="create-user-fullName"
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
                  <FieldLabel htmlFor="create-user-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="create-user-email"
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-user-password">
                      Password
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
                      Confirm password
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
                  <FieldLabel>Initial role</FieldLabel>
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
                            ? "Loading roles..."
                            : isRolesError
                              ? "Failed to load roles"
                              : "Select a role"
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
                            Custom roles
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
                      Password needs 8–32 characters, an uppercase letter and a
                      number.
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createUser.isPending || isRolesLoading || isRolesError}
            >
              {createUser.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
