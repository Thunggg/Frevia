"use client";

import { expertProfileApi } from "@/apiRequests/expert-profile";
import { profileRevisionApiRequest } from "@/apiRequests/profile-revision";
import { ProfileReviewStatus } from "@/components/profile-review-status";
import { ApiFail } from "@/lib/http";
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
          message:
            error instanceof ApiFail
              ? error.message
              : "Unable to load expert profile.",
        }),
      )
      .finally(() => setLoading(false));
  }, []);

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
      toastSuccess({ message: "Changes submitted for administrator review." });
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.message
            : "Unable to submit profile changes.",
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
            <ShieldCheck className="size-4" /> Admin-reviewed expert profile
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Your expert profile
          </h1>
          <p className="mt-2 text-muted-foreground">
            Updates stay private until an administrator approves them.
          </p>
        </div>
        <Badge
          variant={isPending || !profile.isActive ? "secondary" : "default"}
          className="w-fit"
        >
          {isPending
            ? "Pending review"
            : profile.isActive
              ? "Active"
              : "Inactive"}
        </Badge>
      </div>

      <ProfileReviewStatus revision={revision} />

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Profile completion</span>
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
            This score belongs to the submitted revision. The fields below show
            your currently approved profile and are locked until review.
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
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={profile.displayName ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Professional title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={profile.title ?? ""}
              placeholder="Senior Product Strategy Expert"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearsOfExperience">Years of experience</Label>
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
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              defaultValue={profile.website ?? ""}
              placeholder="https://example.com"
            />
          </div>
          </div>
          <div className="space-y-2">
          <Label htmlFor="bio">Professional bio</Label>
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
            label="Expertise"
            values={profile.expertise}
          />
          <ListField
            id="education"
            label="Education"
            values={profile.education}
          />
          <ListField
            id="certifications"
            label="Certifications"
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
              {isPending ? "Awaiting review" : "Submit for review"}
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
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        name={id}
        rows={6}
        defaultValue={values.join("\n")}
        placeholder="One item per line"
      />
      <p className="text-xs text-muted-foreground">One item per line</p>
    </div>
  );
}
