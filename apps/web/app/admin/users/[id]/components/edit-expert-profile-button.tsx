"use client";

import { adminApiRequest } from "@/apiRequests/admin";
import { ApiFail } from "@/lib/http";
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
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { AdminUserDetailResponseType } from "@shared/types";
import { Loader2, Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const parseLines = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

export function EditExpertProfileButton({
  user,
}: {
  user: AdminUserDetailResponseType;
}) {
  const router = useRouter();
  const expert = user.expertProfile;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expertise, setExpertise] = useState(expert?.expertise ?? []);
  const [isActive, setIsActive] = useState(expert?.isActive ?? true);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setExpertise(expert?.expertise ?? []);
      setIsActive(expert?.isActive ?? true);
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await adminApiRequest.updateExpertProfile(user.id, {
        displayName: String(data.get("displayName") || ""),
        title: String(data.get("title") || "") || null,
        bio: String(data.get("bio") || "") || null,
        expertise,
        yearsOfExperience: data.get("yearsOfExperience")
          ? Number(data.get("yearsOfExperience"))
          : null,
        education: parseLines(data.get("education")),
        certifications: parseLines(data.get("certifications")),
        website: String(data.get("website") || "") || null,
        isActive,
      });
      toastSuccess({ message: "Expert profile updated." });
      setOpen(false);
      router.refresh();
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.message
            : "Unable to update expert profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Pencil className="size-4" /> Edit expert profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit expert profile</DialogTitle>
          <DialogDescription>
            Admin changes are applied immediately and do not require a review
            request.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Display name">
              <Input
                name="displayName"
                defaultValue={user.displayName ?? ""}
                required
              />
            </Field>
            <Field label="Professional title">
              <Input name="title" defaultValue={expert?.title ?? ""} />
            </Field>
            <Field label="Years of experience">
              <Input
                name="yearsOfExperience"
                type="number"
                min={0}
                max={80}
                defaultValue={expert?.yearsOfExperience ?? ""}
              />
            </Field>
            <Field label="Website">
              <Input
                name="website"
                type="url"
                defaultValue={expert?.website ?? ""}
              />
            </Field>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3 sm:col-span-2">
              <div>
                <Label htmlFor="expert-active">Public directory status</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Inactive experts are hidden from the public directory.
                </p>
              </div>
              <Button
                id="expert-active"
                type="button"
                variant={isActive ? "default" : "outline"}
                size="sm"
                aria-pressed={isActive}
                onClick={() => setIsActive((value) => !value)}
              >
                {isActive ? "Active" : "Inactive"}
              </Button>
            </div>
          </div>
          <Field label="Bio">
            <Textarea name="bio" rows={4} defaultValue={user.bio ?? ""} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <TagListField
              label="Expertise"
              values={expertise}
              onChange={setExpertise}
            />
            <ListField
              name="education"
              label="Education"
              value={expert?.education ?? []}
            />
            <ListField
              name="certifications"
              label="Certifications"
              value={expert?.certifications ?? []}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />} Save
              changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ListField({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: string[];
}) {
  return (
    <Field label={label}>
      <Textarea name={name} rows={6} defaultValue={value.join("\n")} />
      <p className="text-xs text-muted-foreground">One item per line</p>
    </Field>
  );
}

function TagListField({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    if (!values.some((item) => item.toLowerCase() === value.toLowerCase())) {
      onChange([...values, value]);
    }
    setDraft("");
  };

  return (
    <Field label={label}>
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder="e.g. Product strategy"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" size="icon" variant="outline" onClick={add}>
          <Plus className="size-4" />
          <span className="sr-only">Add expertise</span>
        </Button>
      </div>
      <div className="flex min-h-10 flex-wrap gap-2 rounded-lg border border-dashed p-2">
        {values.length ? (
          values.map((value) => (
            <Badge key={value} variant="secondary" className="gap-1 pr-1">
              {value}
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-black/10"
                onClick={() => onChange(values.filter((item) => item !== value))}
                aria-label={`Remove ${value}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))
        ) : (
          <span className="px-1 text-xs text-muted-foreground">
            No expertise added yet.
          </span>
        )}
      </div>
    </Field>
  );
}
