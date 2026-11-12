"use client";

import { accountProfileApi } from "@/apiRequests/account-profile";
import { useMe } from "@/hooks/use-auth";
import { useBackendMessage } from "@/hooks/use-backend-message";
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
  RoleName,
  UpdateGeneralProfileSchema,
  type GeneralProfileType,
} from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Camera,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  MonitorSmartphone,
  RefreshCw,
  Save,
  ShieldCheck,
  UserCheck,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
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

type FieldErrors = Record<string, string>;

function messageFrom(error: unknown, fallback: string) {
  if (error instanceof ApiFail) {
    return error.response.error.details?.[0]?.message ?? error.message;
  }
  return fallback;
}

function validationErrors(
  issues: { path: PropertyKey[]; message: string }[],
  resolve: (message: string) => string,
) {
  return issues.reduce<FieldErrors>((errors, issue) => {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= resolve(issue.message);
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
          className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4fae2e]/40 cursor-pointer"
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

export function AdminProfileView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const t = useTranslations("adminProfile");
  const tGeneral = useTranslations("generalSettings");
  const tRole = useTranslations("roleName");
  const toBackendMessage = useBackendMessage();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<GeneralProfileType | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileErrors, setProfileErrors] = useState<FieldErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>("load");

  const avatarPreview = useMemo(
    () => (avatar ? URL.createObjectURL(avatar) : null),
    [avatar],
  );

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const resolveIssue = useCallback(
    (message: string) =>
      message.startsWith("Error.")
        ? toBackendMessage(message)
        : tGeneral("errInvalidValue"),
    [toBackendMessage, tGeneral],
  );

  const load = useCallback(async () => {
    setPending("load");
    setLoadError(null);
    try {
      const response = await accountProfileApi.getGeneralProfile();
      setProfile(response.data);
      setDisplayName(response.data.displayName ?? "");
      setBio(response.data.bio ?? "");
    } catch (error) {
      setLoadError(messageFrom(error, t("loadFailed")));
    } finally {
      setPending(null);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const busy = pending !== null;
  const profileChanged =
    displayName !== (profile?.displayName ?? "") ||
    bio !== (profile?.bio ?? "");

  const handleChooseAvatar = (file: File | null) => {
    setAvatarError(null);
    if (!file) {
      setAvatar(null);
      return;
    }
    if (!AVATAR_TYPES.includes(file.type) || file.size > MAX_AVATAR_SIZE) {
      setAvatar(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setAvatarError(tGeneral("avatarTypeError"));
      return;
    }
    setAvatar(file);
  };

  const handleUploadAvatar = async (event: FormEvent) => {
    event.preventDefault();
    if (!avatar) {
      setAvatarError(tGeneral("avatarRequired"));
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
      const msg = messageFrom(error, t("loadFailed"));
      setAvatarError(msg);
      toastError({ message: msg });
    } finally {
      setPending(null);
    }
  };

  const handleSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = UpdateGeneralProfileSchema.safeParse({
      displayName,
      bio: bio.trim() || null,
    });
    if (!parsed.success) {
      setProfileErrors(validationErrors(parsed.error.issues, resolveIssue));
      return;
    }
    setProfileErrors({});
    setPending("profile");
    try {
      const response = await accountProfileApi.updateGeneralProfile(parsed.data);
      setProfile((current) =>
        current
          ? {
              ...current,
              displayName: parsed.data.displayName,
              bio: parsed.data.bio ?? null,
            }
          : current,
      );
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      router.refresh();
      toastSuccess({ message: response.data.message || t("profileUpdated") });
    } catch (error) {
      const msg = messageFrom(error, t("loadFailed"));
      setProfileErrors({ form: msg });
      toastError({ message: msg });
    } finally {
      setPending(null);
    }
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = ChangePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      setPasswordErrors(validationErrors(parsed.error.issues, resolveIssue));
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
      const msg = messageFrom(error, t("loadFailed"));
      setPasswordErrors({ form: msg });
      toastError({ message: msg });
    } finally {
      setPending(null);
    }
  };

  if (pending === "load") {
    return (
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="h-44 animate-pulse rounded-xl border border-border bg-muted/30" />
          <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/30" />
        </div>
        <div className="space-y-6">
          <div className="h-72 animate-pulse rounded-xl border border-border bg-muted/30" />
          <div className="h-32 animate-pulse rounded-xl border border-border bg-muted/30" />
        </div>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-6 py-12 text-center">
        <AlertCircle className="mx-auto size-8 text-destructive" />
        <h2 className="mt-3 text-lg font-semibold text-foreground">
          {tGeneral("loadFailedTitle")}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {loadError ?? t("loadFailed")}
        </p>
        <Button className="mt-5" variant="outline" onClick={() => void load()}>
          <RefreshCw className="mr-2 size-4" />
          {t("retry")}
        </Button>
      </div>
    );
  }

  const initial =
    (profile.displayName ?? profile.email ?? "A").slice(0, 1).toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <UserRound className="h-8 w-8 text-[#4fae2e]" />
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left Column: Avatar & General Information */}
        <div className="space-y-6">
          {/* Section: Profile Photo */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar className="size-20 border border-border shadow-xs">
                <AvatarImage
                  src={avatarPreview ?? profile.avatarUrl ?? undefined}
                  alt={profile.displayName ?? "Admin Avatar"}
                />
                <AvatarFallback className="bg-[#4fae2e]/10 text-2xl font-bold text-[#4fae2e]">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Camera className="size-4 text-[#4fae2e]" />
                  <h2 className="text-base font-semibold text-foreground">
                    {t("avatarTitle")}
                  </h2>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {profile.email}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(me?.roles?.map((r) => r.name) ?? ["ADMIN"]).map((roleName) => (
                    <Badge
                      key={roleName}
                      variant="default"
                      className="bg-[#4fae2e] text-white"
                    >
                      <ShieldCheck className="mr-1 size-3" />
                      {roleName === RoleName.ADMIN
                        ? tRole("ADMIN")
                        : roleName === RoleName.EXPERT
                          ? tRole("EXPERT")
                          : roleName === RoleName.CLIENT
                            ? tRole("CLIENT")
                            : roleName === RoleName.FREELANCER
                              ? tRole("FREELANCER")
                              : roleName}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <form className="mt-5" onSubmit={handleUploadAvatar}>
              <Label htmlFor="admin-avatar">{t("choosePhoto")}</Label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <Input
                  ref={fileInputRef}
                  id="admin-avatar"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy}
                  aria-invalid={Boolean(avatarError)}
                  onChange={(event) =>
                    handleChooseAvatar(event.target.files?.[0] ?? null)
                  }
                />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={busy || !avatar}
                  className="shrink-0 cursor-pointer"
                >
                  {pending === "avatar" ? (
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                  ) : (
                    <Camera className="mr-1.5 size-4" />
                  )}
                  {pending === "avatar" ? t("uploadingPhoto") : t("uploadPhoto")}
                </Button>
              </div>
              <p
                className={`mt-2 text-xs ${avatarError ? "text-destructive" : "text-muted-foreground"}`}
              >
                {avatarError ??
                  (avatar
                    ? tGeneral("avatarSelected", { name: avatar.name })
                    : t("avatarDescription"))}
              </p>
            </form>
          </section>

          {/* Section: General Information */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <UserCheck className="size-5 text-[#4fae2e]" />
              <h2 className="text-base font-semibold text-foreground">
                {t("generalTitle")}
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("generalDescription")}
            </p>

            <form
              className="mt-5 space-y-4"
              onSubmit={handleSaveProfile}
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="admin-display-name">{t("displayName")}</Label>
                <Input
                  id="admin-display-name"
                  maxLength={255}
                  value={displayName}
                  disabled={busy}
                  placeholder={t("displayNamePlaceholder")}
                  aria-invalid={Boolean(profileErrors.displayName)}
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
                  <p className="text-xs text-destructive">
                    {profileErrors.displayName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="admin-bio">{t("bio")}</Label>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {bio.length} / 5000
                  </span>
                </div>
                <Textarea
                  id="admin-bio"
                  rows={4}
                  maxLength={5000}
                  value={bio}
                  disabled={busy}
                  placeholder={t("bioPlaceholder")}
                  aria-invalid={Boolean(profileErrors.bio)}
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
                  <p className="text-xs text-destructive">
                    {profileErrors.bio}
                  </p>
                )}
              </div>

              {profileErrors.form && (
                <p className="text-sm text-destructive">{profileErrors.form}</p>
              )}

              <Button
                type="submit"
                className="bg-[#4fae2e] text-white hover:bg-[#459928] cursor-pointer"
                disabled={busy || !profileChanged}
              >
                {pending === "profile" ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <Save className="mr-1.5 size-4" />
                )}
                {pending === "profile" ? t("saving") : t("saveChanges")}
              </Button>
            </form>
          </section>
        </div>

        {/* Right Column: Password & Sessions Shortcut */}
        <div className="space-y-6">
          {/* Section: Change Password */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <LockKeyhole className="size-5 text-[#4fae2e]" />
              <h2 className="text-base font-semibold text-foreground">
                {t("securityTitle")}
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("securityDescription")}
            </p>

            <form
              className="mt-5 space-y-4"
              onSubmit={handleChangePassword}
              noValidate
            >
              <PasswordInput
                id="admin-current-password"
                label={t("currentPassword")}
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
                id="admin-new-password"
                label={t("newPassword")}
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
                id="admin-confirm-password"
                label={t("confirmPassword")}
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
                <p className="text-sm text-destructive">
                  {passwordErrors.form}
                </p>
              )}

              <Button
                type="submit"
                variant="outline"
                className="w-full cursor-pointer"
                disabled={busy}
              >
                {pending === "password" ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-1.5 size-4" />
                )}
                {pending === "password"
                  ? t("changingPassword")
                  : t("changePassword")}
              </Button>
            </form>
          </section>

          {/* Section: Sessions Navigation Card */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <MonitorSmartphone className="size-5 text-[#4fae2e]" />
              <h2 className="text-base font-semibold text-foreground">
                {t("sessionsTitle")}
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("sessionsDescription")}
            </p>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full cursor-pointer">
                <Link href="/admin/sessions">
                  <MonitorSmartphone className="mr-2 size-4 text-[#4fae2e]" />
                  {t("manageSessions")}
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
