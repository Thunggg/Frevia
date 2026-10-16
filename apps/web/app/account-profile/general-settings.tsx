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
import type { GeneralProfileType } from "@shared/types";
import { Camera, Loader2, LockKeyhole, Save } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

function messageFrom(error: unknown) {
  if (error instanceof ApiFail) {
    return error.response.error.details?.[0]?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function GeneralSettings() {
  const [profile, setProfile] = useState<GeneralProfileType | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState<string | null>("load");

  const load = useCallback(async () => {
    setPending("load");
    try {
      const response = await accountProfileApi.getGeneralProfile();
      setProfile(response.data);
      setDisplayName(response.data.displayName ?? "");
      setBio(response.data.bio ?? "");
    } catch (error) {
      toastError({ message: messageFrom(error) });
    } finally {
      setPending(null);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setPending("profile");
    try {
      const response = await accountProfileApi.updateGeneralProfile({
        displayName,
        bio: bio || null,
      });
      setProfile(response.data);
      toastSuccess({ message: "General profile updated." });
    } catch (error) {
      toastError({ message: messageFrom(error) });
    } finally {
      setPending(null);
    }
  };

  const uploadAvatar = async (event: FormEvent) => {
    event.preventDefault();
    if (!avatar) {
      toastError({ message: "Please choose an avatar image." });
      return;
    }
    setPending("avatar");
    try {
      const response = await accountProfileApi.uploadAvatar(avatar);
      setProfile((current) =>
        current ? { ...current, avatarUrl: response.data.avatarUrl } : current,
      );
      setAvatar(null);
      toastSuccess({ message: "Avatar updated." });
    } catch (error) {
      toastError({ message: messageFrom(error) });
    } finally {
      setPending(null);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPending("password");
    try {
      await accountProfileApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toastSuccess({ message: "Password changed successfully." });
    } catch (error) {
      toastError({ message: messageFrom(error) });
    } finally {
      setPending(null);
    }
  };

  if (pending === "load") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-7 animate-spin text-[#4fae2e]" />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-8">
        <section className="rounded-xl border border-border p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar className="size-20 border border-border">
              <AvatarImage src={profile?.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-[#eaf8df] text-xl text-[#3f9225]">
                {(profile?.displayName ?? profile?.email ?? "U").slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground">
                Profile photo
              </h2>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {profile?.email}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile?.roles.map((role) => (
                  <Badge
                    key={role.name}
                    variant={role.isPrimary ? "default" : "secondary"}
                  >
                    {role.name}
                    {role.isPrimary ? " (active)" : ""}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={uploadAvatar}
          >
            <Input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(event) => setAvatar(event.target.files?.[0] ?? null)}
            />
            <Button
              type="submit"
              variant="outline"
              disabled={pending === "avatar"}
            >
              {pending === "avatar" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Camera />
              )}
              Upload photo
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            JPG, PNG or WebP, maximum 5 MB.
          </p>
        </section>

        <section className="rounded-xl border border-border p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">
            General information
          </h2>
          <form className="mt-5 space-y-5" onSubmit={saveProfile}>
            <div className="space-y-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                required
                maxLength={255}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-bio">Bio</Label>
              <Textarea
                id="profile-bio"
                rows={6}
                maxLength={5000}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Tell clients and freelancers about yourself."
              />
            </div>
            <Button
              className="bg-[#4fae2e] text-white hover:bg-[#459928]"
              disabled={pending === "profile"}
            >
              {pending === "profile" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save />
              )}
              Save profile
            </Button>
          </form>
        </section>
      </div>

      <section className="h-fit rounded-xl border border-border p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <LockKeyhole className="size-5 text-[#4fae2e]" />
          <h2 className="text-lg font-semibold text-foreground">
            Change password
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Use 8 to 32 characters with an uppercase letter and a number.
        </p>
        <form className="mt-5 space-y-4" onSubmit={changePassword}>
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            variant="outline"
            disabled={pending === "password"}
          >
            {pending === "password" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <LockKeyhole />
            )}
            Change password
          </Button>
        </form>
      </section>
    </div>
  );
}
