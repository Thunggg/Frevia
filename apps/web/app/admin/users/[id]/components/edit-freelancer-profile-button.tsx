"use client";

import { useUpdateFreelancerProfile } from "@/hooks/use-admin-user";
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/shadcn/field";
import { Input } from "@repo/ui/components/shadcn/input";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type {
  AdminUpdateFreelancerProfileBodyType,
  AdminUserDetailResponseType,
} from "@shared/types";
import { Loader2, PenLine, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

// ====== Dialog "Edit freelancer profile" (tab FREELANCER - User Detail) ======
// Gộp toàn bộ hồ sơ Freelancer vào 1 dialog, dùng chung 1 API
// PATCH /api/users/:id/freelancer-profile:
//   - Phần cơ bản: professional title + bio (rỗng = xoá → null)
//   - Danh sách: languages / education / certifications — mỗi mục 1 dòng
//     (lưu dạng string[]; xoá hết = xoá text trong textarea)
// User chưa có freelancer profile → nút "Complete profile" (server tự upsert tạo row).
interface FreelancerProfileFormState {
  title: string;
  bio: string;
  languages: string;
  education: string;
  certifications: string;
}

const EMPTY_FORM: FreelancerProfileFormState = {
  title: "",
  bio: "",
  languages: "",
  education: "",
  certifications: "",
};

interface EditFreelancerProfileButtonProps {
  user: AdminUserDetailResponseType;
}

// Chuyển string[] → text "mỗi dòng một mục"
function toText(values?: string[] | null): string {
  return (values ?? []).join("\n");
}

// Chuyển textarea → string[] (bỏ dòng rỗng)
function toList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

export function EditFreelancerProfileButton({
  user,
}: EditFreelancerProfileButtonProps) {
  const router = useRouter();
  const t = useTranslations("adminUserProfileEdit");
  const [open, setOpen] = useState(false);
  const [formState, setFormState] =
    useState<FreelancerProfileFormState>(EMPTY_FORM);
  const updateFreelancerProfile = useUpdateFreelancerProfile();

  const freelancerProfile = user.freelancerProfile;

  // Mỗi lần mở dialog: nạp lại toàn bộ giá trị hiện tại từ props
  useEffect(() => {
    if (open) {
      setFormState({
        title: freelancerProfile?.title ?? "",
        bio: user.bio ?? "",
        languages: toText(freelancerProfile?.languages),
        education: toText(freelancerProfile?.education),
        certifications: toText(freelancerProfile?.certifications),
      });
    }
  }, [open, freelancerProfile, user.bio]);

  // Dữ liệu hiện tại khi mở dialog
  const current = useMemo(
    () => ({
      title: freelancerProfile?.title ?? null,
      bio: user.bio ?? null,
      languages: freelancerProfile?.languages ?? [],
      education: freelancerProfile?.education ?? [],
      certifications: freelancerProfile?.certifications ?? [],
    }),
    [freelancerProfile, user.bio],
  );

  // So sánh form đã chuẩn hoá với dữ liệu hiện tại → disable Save khi không đổi
  const hasChanges = useMemo(() => {
    const next = {
      title: formState.title.trim() === "" ? null : formState.title.trim(),
      bio: formState.bio.trim() === "" ? null : formState.bio.trim(),
      languages: toList(formState.languages),
      education: toList(formState.education),
      certifications: toList(formState.certifications),
    };
    return (
      next.title !== current.title ||
      next.bio !== current.bio ||
      JSON.stringify(next.languages) !== JSON.stringify(current.languages) ||
      JSON.stringify(next.education) !== JSON.stringify(current.education) ||
      JSON.stringify(next.certifications) !==
        JSON.stringify(current.certifications)
    );
  }, [formState, current]);

  // Xây payload chỉ gồm các trường THAY ĐỔI
  function onSave() {
    const next = {
      title: formState.title.trim() === "" ? null : formState.title.trim(),
      bio: formState.bio.trim() === "" ? null : formState.bio.trim(),
      languages: toList(formState.languages),
      education: toList(formState.education),
      certifications: toList(formState.certifications),
    };

    const payload: AdminUpdateFreelancerProfileBodyType = {};
    if (next.title !== current.title) payload.title = next.title;
    if (next.bio !== current.bio) payload.bio = next.bio;
    if (JSON.stringify(next.languages) !== JSON.stringify(current.languages)) {
      payload.languages = next.languages;
    }
    if (JSON.stringify(next.education) !== JSON.stringify(current.education)) {
      payload.education = next.education;
    }
    if (
      JSON.stringify(next.certifications) !==
      JSON.stringify(current.certifications)
    ) {
      payload.certifications = next.certifications;
    }

    // nếu ko có thay đổi thì đóng dialog
    if (Object.keys(payload).length === 0) {
      setOpen(false);
      return;
    }

    updateFreelancerProfile.mutate(
      { id: user.id, body: payload },
      {
        onSuccess: () => {
          toastSuccess({
            message: t("freelancerUpdated", { email: user.email }),
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
            const first = details[0];
            if (first) {
              toastError({ message: first.message });
            }
            return;
          }
          toastError({ message: t("freelancerUpdateFailed") });
        },
      },
    );
  }

  const updateField = (
    field: keyof FreelancerProfileFormState,
    value: string,
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 hover:bg-purple-500/10 hover:text-purple-500 hover:border-purple-400/40 transition-colors"
        >
          {freelancerProfile ? (
            <PenLine className="h-3.5 w-3.5" />
          ) : (
            <UserRound className="h-3.5 w-3.5" />
          )}
          {freelancerProfile ? t("triggerEdit") : t("triggerComplete")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-purple-500" />
            {freelancerProfile
              ? t("freelancerTitleEdit")
              : t("freelancerTitleComplete")}
          </DialogTitle>
          <DialogDescription>
            {t.rich("freelancerDescription", {
              b: (chunks) => (
                <span className="font-medium text-foreground">{chunks}</span>
              ),
              email: user.email,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit-freelancer-title">
                {t("freelancerFieldTitle")}
              </FieldLabel>
              <Input
                id="edit-freelancer-title"
                value={formState.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder={t("freelancerTitlePlaceholder")}
                maxLength={255}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-freelancer-bio">
                {t("freelancerFieldBio")}
              </FieldLabel>
              <Textarea
                id="edit-freelancer-bio"
                value={formState.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder={t("freelancerBioPlaceholder")}
                rows={4}
                maxLength={5000}
              />
            </Field>
          </FieldGroup>

          <div className="space-y-4 border-t pt-4">
            <Field>
              <FieldLabel htmlFor="edit-freelancer-languages">
                {t("freelancerFieldLanguages")}
              </FieldLabel>
              <Textarea
                id="edit-freelancer-languages"
                value={formState.languages}
                onChange={(e) => updateField("languages", e.target.value)}
                placeholder={t("freelancerLanguagesPlaceholder")}
                rows={3}
              />
              <FieldDescription>
                {t("freelancerLanguagesHint")}
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-freelancer-education">
                {t("freelancerFieldEducation")}
              </FieldLabel>
              <Textarea
                id="edit-freelancer-education"
                value={formState.education}
                onChange={(e) => updateField("education", e.target.value)}
                placeholder={t("freelancerEducationPlaceholder")}
                rows={3}
              />
              <FieldDescription>
                {t("freelancerEducationHint")}
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-freelancer-certifications">
                {t("freelancerFieldCertifications")}
              </FieldLabel>
              <Textarea
                id="edit-freelancer-certifications"
                value={formState.certifications}
                onChange={(e) => updateField("certifications", e.target.value)}
                placeholder={t("freelancerCertificationsPlaceholder")}
                rows={3}
              />
              <FieldDescription>
                {t("freelancerCertificationsHint")}
              </FieldDescription>
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={!hasChanges || updateFreelancerProfile.isPending}
          >
            {updateFreelancerProfile.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {t("saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
