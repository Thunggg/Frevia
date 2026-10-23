"use client";

import { useTranslations } from "next-intl";
import { expertProfileApi } from "@/apiRequests/expert-profile";
import { profileRevisionApiRequest } from "@/apiRequests/profile-revision";
import { ProfileReviewStatus } from "@/components/profile-review-status";
import { ApiFail } from "@/lib/http";
import { getProfileUpdateText } from "@/lib/profile-update-status";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { ExpertProfileType, ProfileRevisionType } from "@shared/types";
import { Loader2, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

const lines = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

export function ExpertProfileForm() {
  const t = useTranslations("expertProfileForm");
  const [profile, setProfile] = useState<ExpertProfileType | null>(null);
  const [revision, setRevision] = useState<ProfileRevisionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void Promise.all([
      expertProfileApi.getMine(),
      profileRevisionApiRequest.getMine("EXPERT"),
    ])
      .then(([profileResponse, revisionResponse]) => {
        setProfile(profileResponse.data);
        setRevision(revisionResponse.data.revision);
      })
      .catch((error) =>
        toastError({
          message: error instanceof ApiFail ? error.message : t("loadFailed"),
        }),
      )
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }
  if (!profile) return null;

  const isPending = revision?.status === "PENDING";
  const displayedStrength = isPending
    ? revision.profileStrength
    : profile.profileCompletionPercent;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const response = await expertProfileApi.updateMine({
        displayName: String(data.get("displayName") || ""),
        title: String(data.get("title") || "") || null,
        bio: String(data.get("bio") || "") || null,
        expertise: lines(String(data.get("expertise") || "")),
        yearsOfExperience: data.get("yearsOfExperience")
          ? Number(data.get("yearsOfExperience"))
          : null,
        education: lines(String(data.get("education") || "")),
        certifications: lines(String(data.get("certifications") || "")),
        website: String(data.get("website") || "") || null,
      });
      setRevision(response.data.revision);
      toastSuccess({ message: getProfileUpdateText(response.data.status) });
    } catch (error) {
      toastError({
        message: error instanceof ApiFail ? error.message : t("submitFailed"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#4fae2e]">
            <ShieldCheck className="size-4" /> {t("adminReviewed")}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Badge
          variant={isPending || !profile.isActive ? "secondary" : "default"}
          className="w-fit"
        >
          {isPending
            ? t("pendingReview")
            : profile.isActive
              ? t("active")
              : t("inactive")}
        </Badge>
      </div>

      <ProfileReviewStatus revision={revision} />

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{t("profileCompletion")}</span>
          <span className="font-semibold text-[#4fae2e]">
            {displayedStrength}%
          </span>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={displayedStrength}
        >
          <div
            className="h-full rounded-full bg-[#4fae2e] transition-[width]"
            style={{ width: `${displayedStrength}%` }}
          />
        </div>
        {isPending ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("pendingHint")}
          </p>
        ) : null}
      </div>

      <form
        onSubmit={submit}
        className="space-y-6 rounded-xl border bg-card p-6 shadow-sm"
      >
        <fieldset disabled={isPending || saving} className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="displayName">{t("displayName")}</Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={profile.displayName ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">{t("professionalTitle")}</Label>
            <Input
              id="title"
              name="title"
              defaultValue={profile.title ?? ""}
              placeholder={t("titlePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearsOfExperience">
              {t("yearsOfExperience")}
            </Label>
            <Input
              id="yearsOfExperience"
              name="yearsOfExperience"
              type="number"
              min={0}
              max={80}
              defaultValue={profile.yearsOfExperience ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">{t("website")}</Label>
            <Input
              id="website"
              name="website"
              type="url"
              defaultValue={profile.website ?? ""}
              placeholder={t("websitePlaceholder")}
            />
          </div>
          </div>
          <div className="space-y-2">
          <Label htmlFor="bio">{t("bio")}</Label>
          <Textarea
            id="bio"
            name="bio"
            rows={5}
            defaultValue={profile.bio ?? ""}
          />
          </div>
          <div className="grid gap-5 md:grid-cols-3">
          <ListField
            id="expertise"
            label={t("expertise")}
            values={profile.expertise}
          />
          <ListField
            id="education"
            label={t("education")}
            values={profile.education}
          />
          <ListField
            id="certifications"
            label={t("certifications")}
            values={profile.certifications}
          />
          </div>
          <div className="flex justify-end border-t pt-5">
            <Button type="submit" disabled={isPending || saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
              {isPending ? t("awaitingReview") : t("submit")}
            </Button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

function ListField({
  id,
  label,
  values,
}: {
  id: string;
  label: string;
  values: string[];
}) {
  const t = useTranslations("expertProfileForm");

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        name={id}
        rows={6}
        defaultValue={values.join("\n")}
        placeholder={t("oneItemPerLine")}
      />
      <p className="text-xs text-muted-foreground">{t("oneItemPerLine")}</p>
    </div>
  );
}
