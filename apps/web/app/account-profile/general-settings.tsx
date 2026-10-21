"use client";

import { accountProfileApi } from "@/apiRequests/account-profile";
import { ApiFail } from "@/lib/http";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  ChangePasswordSchema,
  UpdateGeneralProfileSchema,
  type GeneralProfileType,
} from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ROLE_KEYS = ["ADMIN", "CLIENT", "FREELANCER", "EXPERT"] as const;
type FieldErrors = Record<string, string>;

/**
 * `account-profile.model.ts` (trong @shared/types) khai báo message validation
 * bằng chuỗi tiếng Anh trực tiếp thay vì key i18n như 19 file schema khác của
 * dự án (auth.message.ts, manage-job.message.ts, ...), và form này gọi
 * `safeParse` trực tiếp nên không đi qua useTranslatedResolver. Bảng dưới ánh
 * xạ chuỗi đó sang key đã dịch; message không khớp sẽ rơi về errInvalidValue
 * nên không bao giờ lộ tiếng Anh. Xem báo cáo để biết cách sửa tận gốc.
 */
const ZOD_MESSAGE_KEYS: Record<string, string> = {
  "Password must contain at least 8 characters.": "errPasswordMin",
  "Password must contain at most 32 characters.": "errPasswordMax",
  "Password must contain an uppercase letter.": "errPasswordUppercase",
  "Password must contain a number.": "errPasswordNumber",
  "Current password is required.": "errCurrentPasswordRequired",
  "Password confirmation does not match.": "errPasswordMismatch",
  "New password must be different from the current password.": "errPasswordSame",
};

/**
 * Lỗi từ ApiFail đi qua proxy BFF đã được dịch sẵn (error.details[].message
 * chứa key i18n), nên GIỮ NGUYÊN. Mọi lỗi khác (TypeError khi mất mạng...) là
 * text tiếng Anh do runtime sinh ra nên trả về fallback đã dịch.
 */
function messageFrom(error: unknown, fallback: string) {
  if (error instanceof ApiFail)
    return error.response.error.details?.[0]?.message ?? error.message;
  return fallback;
}

function validationErrors(
  issues: { path: PropertyKey[]; message: string }[],
  translate: (key: string) => string,
) {
  return issues.reduce<FieldErrors>((errors, issue) => {
    const field = String(issue.path[0] ?? "form");
    const key = ZOD_MESSAGE_KEYS[issue.message];
    errors[field] ??= key ? translate(key) : translate("errInvalidValue");
    return errors;
  }, {});
}

function PasswordInput({
  id,
  label,
  value,
  error,
  autoComplete,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  autoComplete: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const t = useTranslations("generalSettings");
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="pr-10"
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4fae2e]/40"
          aria-label={
            visible
              ? t("hidePassword", { field: label })
              : t("showPassword", { field: label })
          }
          disabled={disabled}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function GeneralSettings() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("generalSettings");
  const tSettings = useTranslations("clientProfileSettings");
  const tRole = useTranslations("roleName");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<GeneralProfileType | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileErrors, setProfileErrors] = useState<FieldErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({});
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>("load");

  const avatarPreview = useMemo(
    () => (avatar ? URL.createObjectURL(avatar) : null),
    [avatar],
  );
  useEffect(
    () => () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    },
    [avatarPreview],
  );

  const toMessage = useCallback(
    (error: unknown) => messageFrom(error, tSettings("somethingWentWrong")),
    [tSettings],
  );

  const roleLabel = (name: string) =>
    (ROLE_KEYS as readonly string[]).includes(name) ? tRole(name) : name;

  const load = useCallback(async () => {
    setPending("load");
    setLoadError(null);
    try {
      const response = await accountProfileApi.getGeneralProfile();
      setProfile(response.data);
      setDisplayName(response.data.displayName ?? "");
      setBio(response.data.bio ?? "");
    } catch (error) {
      setLoadError(toMessage(error));
    } finally {
      setPending(null);
    }
  }, [toMessage]);
  useEffect(() => void load(), [load]);

  const busy = pending !== null;
  const profileChanged =
    displayName !== (profile?.displayName ?? "") ||
    bio !== (profile?.bio ?? "");

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = UpdateGeneralProfileSchema.safeParse({
      displayName,
      bio: bio.trim() || null,
    });
    if (!parsed.success) {
      setProfileErrors(validationErrors(parsed.error.issues, t));
      return;
    }
    setProfileErrors({});
    setPending("profile");
    try {
      const response = await accountProfileApi.updateGeneralProfile(
        parsed.data,
      );
      if (!response.data.reviewRequired) {
        setProfile((current) =>
          current
            ? {
                ...current,
                displayName: parsed.data.displayName,
                bio: parsed.data.bio ?? null,
                profileCompletionPercent: response.data.profileStrength,
              }
            : current,
        );
      }
      toastSuccess({ message: response.data.message });
    } catch (error) {
      setProfileErrors({ form: toMessage(error) });
      toastError({ message: toMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const chooseAvatar = (file: File | null) => {
    setAvatarError(null);
    if (!file) {
      setAvatar(null);
      return;
    }
    if (!AVATAR_TYPES.includes(file.type) || file.size > MAX_AVATAR_SIZE) {
      setAvatar(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setAvatarError(t("avatarTypeError"));
      return;
    }
    setAvatar(file);
  };

  const uploadAvatar = async (event: FormEvent) => {
    event.preventDefault();
    if (!avatar) {
      setAvatarError(t("avatarRequired"));
      return;
    }
    setAvatarError(null);
    setPending("avatar");
    try {
      const response = await accountProfileApi.uploadAvatar(avatar);
      setProfile((current) =>
        current ? { ...current, avatarUrl: response.data.avatarUrl } : current,
      );
      setAvatar(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      router.refresh();
      toastSuccess({ message: t("avatarUpdated") });
    } catch (error) {
      setAvatarError(toMessage(error));
      toastError({ message: toMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = ChangePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      setPasswordErrors(validationErrors(parsed.error.issues, t));
      return;
    }
    setPasswordErrors({});
    setPending("password");
    try {
      await accountProfileApi.changePassword(parsed.data);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toastSuccess({ message: t("passwordChanged") });
    } catch (error) {
      setPasswordErrors({ form: toMessage(error) });
      toastError({ message: toMessage(error) });
    } finally {
      setPending(null);
    }
  };

  if (pending === "load") {
    return (
      <div
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
        aria-label={t("loadingProfileAria")}
      >
        <div className="h-80 animate-pulse rounded-xl border border-border bg-muted/30" />
        <div className="h-96 animate-pulse rounded-xl border border-border bg-muted/30" />
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-6 py-12 text-center">
        <AlertCircle className="mx-auto size-7 text-destructive" />
        <h2 className="mt-3 text-lg font-semibold">
          {t("loadFailedTitle")}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {loadError ?? t("profileUnavailable")}
        </p>
        <Button className="mt-5" variant="outline" onClick={() => void load()}>
          <RefreshCw className="size-4" />
          {tSettings("tryAgain")}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-8">
        <section className="rounded-xl border border-border bg-card/30 p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar className="size-24 border border-border shadow-sm">
              <AvatarImage
                src={avatarPreview ?? profile.avatarUrl ?? undefined}
                alt={t("avatarAlt", {
                  name: profile.displayName ?? t("userFallback"),
                })}
              />
              <AvatarFallback className="bg-[#4fae2e]/10 text-2xl font-semibold text-[#4fae2e]">
                {(profile.displayName ?? profile.email)
                  .slice(0, 1)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Camera className="size-4 text-[#4fae2e]" />
                <h2 className="text-lg font-semibold text-foreground">
                  {t("profilePhotoTitle")}
                </h2>
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {profile.email}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.roles.map((role) => (
                  <Badge
                    key={role.name}
                    variant={role.isPrimary ? "default" : "secondary"}
                  >
                    {roleLabel(role.name)}
                    {role.isPrimary ? t("activeRoleSuffix") : ""}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <form className="mt-6" onSubmit={uploadAvatar}>
            <Label htmlFor="profile-avatar">{t("chooseNewPhoto")}</Label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Input
                ref={fileInputRef}
                id="profile-avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                aria-invalid={Boolean(avatarError)}
                aria-describedby="profile-avatar-help"
                onChange={(event) =>
                  chooseAvatar(event.target.files?.[0] ?? null)
                }
              />
              <Button
                type="submit"
                variant="outline"
                disabled={busy || !avatar}
              >
                {pending === "avatar" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Camera />
                )}
                {t("uploadPhoto")}
              </Button>
            </div>
            <p
              id="profile-avatar-help"
              className={`mt-2 text-xs ${avatarError ? "text-destructive" : "text-muted-foreground"}`}
            >
              {avatarError ??
                (avatar
                  ? t("avatarSelected", { name: avatar.name })
                  : t("avatarHelp"))}
            </p>
          </form>
        </section>

        <section className="rounded-xl border border-border bg-card/30 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <UserRound className="size-5 text-[#4fae2e]" />
            <h2 className="text-lg font-semibold text-foreground">
              {t("generalInfoTitle")}
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("generalInfoHint")}
          </p>
          <form className="mt-6 space-y-5" onSubmit={saveProfile} noValidate>
            <div className="space-y-2">
              <Label htmlFor="display-name">{t("displayNameLabel")}</Label>
              <Input
                id="display-name"
                maxLength={255}
                value={displayName}
                disabled={busy}
                aria-invalid={Boolean(profileErrors.displayName)}
                aria-describedby={
                  profileErrors.displayName ? "display-name-error" : undefined
                }
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setProfileErrors((errors) => ({
                    ...errors,
                    displayName: "",
                    form: "",
                  }));
                }}
              />
              {profileErrors.displayName && (
                <p id="display-name-error" className="text-xs text-destructive">
                  {profileErrors.displayName}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="profile-bio">{t("bioLabel")}</Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {t("bioCounter", { count: bio.length })}
                </span>
              </div>
              <Textarea
                id="profile-bio"
                rows={6}
                maxLength={5000}
                value={bio}
                disabled={busy}
                aria-invalid={Boolean(profileErrors.bio)}
                aria-describedby={
                  profileErrors.bio ? "profile-bio-error" : undefined
                }
                placeholder={t("bioPlaceholder")}
                onChange={(event) => {
                  setBio(event.target.value);
                  setProfileErrors((errors) => ({
                    ...errors,
                    bio: "",
                    form: "",
                  }));
                }}
              />
              {profileErrors.bio && (
                <p id="profile-bio-error" className="text-xs text-destructive">
                  {profileErrors.bio}
                </p>
              )}
            </div>
            {profileErrors.form && (
              <p className="text-sm text-destructive">{profileErrors.form}</p>
            )}
            <Button
              className="bg-[#4fae2e] text-white hover:bg-[#459928]"
              disabled={busy || !profileChanged}
            >
              {pending === "profile" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save />
              )}
              {tSettings("saveChanges")}
            </Button>
          </form>
        </section>
      </div>

      <div className="space-y-5">
        <section className="rounded-xl border border-border bg-card/30 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <LockKeyhole className="size-5 text-[#4fae2e]" />
            <h2 className="text-lg font-semibold text-foreground">
              {t("changePasswordTitle")}
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("passwordHint")}
          </p>
          <form className="mt-5 space-y-4" onSubmit={changePassword} noValidate>
            <PasswordInput
              id="current-password"
              label={t("currentPasswordLabel")}
              value={currentPassword}
              error={passwordErrors.currentPassword}
              autoComplete="current-password"
              disabled={busy}
              onChange={(value) => {
                setCurrentPassword(value);
                setPasswordErrors((errors) => ({
                  ...errors,
                  currentPassword: "",
                  form: "",
                }));
              }}
            />
            <PasswordInput
              id="new-password"
              label={t("newPasswordLabel")}
              value={newPassword}
              error={passwordErrors.newPassword}
              autoComplete="new-password"
              disabled={busy}
              onChange={(value) => {
                setNewPassword(value);
                setPasswordErrors((errors) => ({
                  ...errors,
                  newPassword: "",
                  form: "",
                }));
              }}
            />
            <PasswordInput
              id="confirm-password"
              label={t("confirmPasswordLabel")}
              value={confirmPassword}
              error={passwordErrors.confirmPassword}
              autoComplete="new-password"
              disabled={busy}
              onChange={(value) => {
                setConfirmPassword(value);
                setPasswordErrors((errors) => ({
                  ...errors,
                  confirmPassword: "",
                  form: "",
                }));
              }}
            />
            {passwordErrors.form && (
              <p className="text-sm text-destructive">{passwordErrors.form}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              variant="outline"
              disabled={busy}
            >
              {pending === "password" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ShieldCheck />
              )}
              {t("changePasswordAction")}
            </Button>
          </form>
        </section>
        {profile.profileCompletionPercent < 20 ? (
          <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            <Clock3 className="mt-0.5 size-4 shrink-0" />
            <p>
              {t("strengthLow", { percent: profile.profileCompletionPercent })}
            </p>
          </div>
        ) : (
          <div className="flex gap-3 rounded-xl border border-[#4fae2e]/25 bg-[#4fae2e]/5 p-4 text-sm">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#4fae2e]" />
            <p className="text-muted-foreground">
              {t("strengthOk")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
