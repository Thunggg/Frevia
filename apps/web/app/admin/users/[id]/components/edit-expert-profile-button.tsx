"use client";

import { useUpdateExpertProfile } from "@/hooks/use-admin-user";
import { ApiFail } from "@/lib/http";
import { handleErrorApi } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@repo/ui/components/shadcn/badge";
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
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@repo/ui/components/shadcn/field";
import { Input } from "@repo/ui/components/shadcn/input";
import { Switch } from "@repo/ui/components/shadcn/switch";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type {
  AdminUpdateExpertProfileType,
  AdminUserDetailResponseType,
} from "@shared/types";
import {
  BrainCircuit,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Tags as TagsIcon,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { z } from "zod";

// ====== Dialog "Edit expert profile" (tab EXPERT - User Detail) ======
// Admin sửa trực tiếp hồ sơ Expert, áp dụng ngay (không qua review như
// bản tự sửa của Expert tại /expert/profile).
// Payload: AdminUpdateExpertProfileSchema — displayName bắt buộc, các trường
// còn lại chuẩn hoá "rỗng → null", mảng thì trim + dedupe không phân biệt hoa thường.
const MAX_YEARS_OF_EXPERIENCE = 80;
const MAX_EXPERTISE_ITEMS = 20;
const MAX_EXPERTISE_ITEM_LENGTH = 100;
const MAX_CREDENTIAL_ITEMS = 20;
const MAX_CREDENTIAL_ITEM_LENGTH = 500;

// Mảng string[]: ô trống chỉ là trạng thái trung gian khi bấm "Add entry",
// nên validate bỏ qua nó (giống cleanList() phía server) thay vì báo lỗi.
// Giữ nguyên kiểu input/output để react-hook-form watch() không lệch kiểu.
const StringList = (maxItems: number, maxItemLength: number, unit: string) =>
  z
    .array(z.string().max(maxItemLength, `Keep each ${unit.replace(/s$/, "")} under ${maxItemLength} characters`))
    .max(maxItems, `Add at most ${maxItems} ${unit}`);

const EditExpertProfileFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(255, "Display name must be 255 characters or fewer"),
  title: z.string().trim().max(255, "Keep the title under 255 characters"),
  yearsOfExperience: z
    .string()
    .trim()
    .refine((value) => {
      if (value === "") return true;
      const years = Number(value);
      return (
        Number.isInteger(years) &&
        years >= 0 &&
        years <= MAX_YEARS_OF_EXPERIENCE
      );
    }, `Enter a whole number between 0 and ${MAX_YEARS_OF_EXPERIENCE}`),
  website: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.url().safeParse(value).success,
      "Enter a valid URL, e.g. https://example.com",
    )
    .refine((value) => value.length <= 500, "Keep the website under 500 characters"),
  bio: z.string().trim().max(5000, "Keep the bio under 5000 characters"),
  expertise: StringList(MAX_EXPERTISE_ITEMS, MAX_EXPERTISE_ITEM_LENGTH, "tags"),
  education: StringList(MAX_CREDENTIAL_ITEMS, MAX_CREDENTIAL_ITEM_LENGTH, "entries"),
  certifications: StringList(
    MAX_CREDENTIAL_ITEMS,
    MAX_CREDENTIAL_ITEM_LENGTH,
    "entries",
  ),
  isActive: z.boolean(),
});

type EditExpertProfileFormValues = z.infer<typeof EditExpertProfileFormSchema>;

interface EditExpertProfileButtonProps {
  user: AdminUserDetailResponseType;
}

// Ô input trống chỉ là trạng thái trung gian khi người dùng bấm "Add entry",
// nên bỏ qua thay vì báo lỗi — giống cleanList() phía server.
function cleanList(values: string[]) {
  return values.map((item) => item.trim()).filter(Boolean);
}

// Rỗng → null để khớp với schema (server coi "" là xoá)
function toNullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function EditExpertProfileButton({
  user,
}: EditExpertProfileButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const updateExpertProfile = useUpdateExpertProfile();

  const expertProfile = user.expertProfile;

  // Giá trị đang lưu trên server, dùng để reset form và so sánh thay đổi
  const savedValues = useMemo<EditExpertProfileFormValues>(
    () => ({
      displayName: user.displayName ?? "",
      title: expertProfile?.title ?? "",
      yearsOfExperience:
        expertProfile?.yearsOfExperience == null
          ? ""
          : String(expertProfile.yearsOfExperience),
      website: expertProfile?.website ?? "",
      bio: user.bio ?? "",
      expertise: expertProfile?.expertise ?? [],
      education: expertProfile?.education ?? [],
      certifications: expertProfile?.certifications ?? [],
      isActive: expertProfile?.isActive ?? true,
    }),
    [user.displayName, user.bio, expertProfile],
  );

  const form = useForm<EditExpertProfileFormValues>({
    resolver: zodResolver(EditExpertProfileFormSchema) as Resolver<EditExpertProfileFormValues>,
    defaultValues: savedValues,
  });

  // Mỗi lần mở dialog: nạp lại giá trị mới nhất từ server, xoá lỗi cũ
  useEffect(() => {
    if (open) {
      form.reset(savedValues);
    }
  }, [open, savedValues, form]);

  const watched = form.watch();

  // Chuẩn hoá giá trị form về đúng shape của API rồi so với dữ liệu đang lưu
  function toPayload(values: EditExpertProfileFormValues) {
    return {
      displayName: values.displayName.trim(),
      title: toNullableText(values.title),
      bio: toNullableText(values.bio),
      expertise: cleanList(values.expertise),
      yearsOfExperience:
        values.yearsOfExperience.trim() === ""
          ? null
          : Number(values.yearsOfExperience),
      education: cleanList(values.education),
      certifications: cleanList(values.certifications),
      website: toNullableText(values.website),
      isActive: values.isActive,
    } satisfies AdminUpdateExpertProfileType;
  }

  const hasChanges = useMemo(
    () =>
      JSON.stringify(toPayload(watched)) !==
      JSON.stringify(toPayload(savedValues)),
    [watched, savedValues],
  );

  function onSubmit(values: EditExpertProfileFormValues) {
    const payload = toPayload(values);
    // Ô trống chưa điền không tính là thay đổi → không bắn API thừa
    if (
      JSON.stringify(payload) === JSON.stringify(toPayload(savedValues))
    ) {
      setOpen(false);
      return;
    }

    updateExpertProfile.mutate(
      { id: user.id, body: payload },
      {
        onSuccess: () => {
          toastSuccess({
            message: `Expert profile for "${user.email}" updated`,
          });
          setOpen(false);
          router.refresh();
        },
        onError: (error) => {
          if (error instanceof ApiFail) {
            handleErrorApi({ error: error.response, setError: form.setError });
            const hasFieldError = (
              error.response.error.details ?? []
            ).some((detail) =>
              [
                "displayName",
                "title",
                "bio",
                "expertise",
                "yearsOfExperience",
                "education",
                "certifications",
                "website",
              ].includes(detail.path),
            );
            if (!hasFieldError) {
              toastError({ message: error.message });
            }
            return;
          }
          toastError({ message: "Failed to update expert profile" });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 transition-colors hover:border-[#4fae2e]/40 hover:bg-[#4fae2e]/10 hover:text-[#4fae2e]"
        >
          {expertProfile ? (
            <Pencil className="size-3.5" />
          ) : (
            <BrainCircuit className="size-3.5" />
          )}
          {expertProfile ? "Edit profile" : "Complete profile"}
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90dvh] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="size-5 text-[#4fae2e]" />
            {expertProfile
              ? "Edit expert profile"
              : "Complete expert profile"}
          </DialogTitle>
          <DialogDescription>
            Update the public expert profile for{" "}
            <span className="font-medium text-foreground">
              {user.displayName || user.email}
            </span>
            . Admin changes are applied immediately and skip review.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* ---------- Identity ---------- */}
            <FieldSet>
              <FieldLegend variant="label" className="text-muted-foreground">
                Identity
              </FieldLegend>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="displayName"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="edit-expert-displayName">
                          Display name
                        </FieldLabel>
                        <Input
                          {...field}
                          id="edit-expert-displayName"
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
                    name="title"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="edit-expert-title">
                          Professional title
                        </FieldLabel>
                        <Input
                          {...field}
                          id="edit-expert-title"
                          placeholder="Senior Product Strategy Expert"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="yearsOfExperience"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="edit-expert-years">
                          Years of experience
                        </FieldLabel>
                        <Input
                          {...field}
                          id="edit-expert-years"
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={MAX_YEARS_OF_EXPERIENCE}
                          placeholder="0"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? (
                          <FieldError errors={[fieldState.error]} />
                        ) : (
                          <FieldDescription>
                            Whole number, 0&ndash;{MAX_YEARS_OF_EXPERIENCE}.
                            Leave empty to clear.
                          </FieldDescription>
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="website"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="edit-expert-website">
                          Website
                        </FieldLabel>
                        <Input
                          {...field}
                          id="edit-expert-website"
                          type="url"
                          placeholder="https://example.com"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="bio"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="edit-expert-bio">
                        Professional bio
                      </FieldLabel>
                      <Textarea
                        {...field}
                        id="edit-expert-bio"
                        rows={5}
                        placeholder="Short introduction shown on the public expert profile..."
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : (
                        <FieldDescription>
                          {field.value.trim().length} / 5000 characters
                        </FieldDescription>
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </FieldSet>

            {/* ---------- Expertise ---------- */}
            <FieldSet>
              <FieldLegend variant="label" className="text-muted-foreground">
                Expertise
              </FieldLegend>
              <Controller
                name="expertise"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-expert-expertise">
                      <TagsIcon className="size-3.5" />
                      Areas of expertise
                    </FieldLabel>
                    <TagListEditor
                      values={field.value}
                      onChange={field.onChange}
                      maxItems={MAX_EXPERTISE_ITEMS}
                      maxItemLength={MAX_EXPERTISE_ITEM_LENGTH}
                      inputId="edit-expert-expertise"
                      placeholder="e.g. Product strategy"
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : (
                      <FieldDescription>
                        Up to {MAX_EXPERTISE_ITEMS} tags, each{" "}
                        {MAX_EXPERTISE_ITEM_LENGTH} characters. Press Enter or
                        comma to add. Duplicates are ignored.
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />
            </FieldSet>

            {/* ---------- Credentials ---------- */}
            <FieldSet>
              <FieldLegend variant="label" className="text-muted-foreground">
                Credentials
              </FieldLegend>
              <div className="grid gap-4 md:grid-cols-2">
                <Controller
                  name="education"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="edit-expert-education">
                        <GraduationCap className="size-3.5" />
                        Education
                      </FieldLabel>
                      <ListEntryEditor
                        id="edit-expert-education"
                        label="Education"
                        values={field.value}
                        onChange={field.onChange}
                        maxItems={MAX_CREDENTIAL_ITEMS}
                        maxItemLength={MAX_CREDENTIAL_ITEM_LENGTH}
                        placeholder="BSc Computer Science - University of Science"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="certifications"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="edit-expert-certifications">
                        Certifications
                      </FieldLabel>
                      <ListEntryEditor
                        id="edit-expert-certifications"
                        label="Certification"
                        values={field.value}
                        onChange={field.onChange}
                        maxItems={MAX_CREDENTIAL_ITEMS}
                        maxItemLength={MAX_CREDENTIAL_ITEM_LENGTH}
                        placeholder="AWS Certified Developer - Associate"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            </FieldSet>

            {/* ---------- Directory visibility ---------- */}
            <FieldSet>
              <FieldLegend variant="label" className="text-muted-foreground">
                Directory visibility
              </FieldLegend>
              <Controller
                name="isActive"
                control={form.control}
                render={({ field }) => (
                  <Field
                    orientation="horizontal"
                    className="items-start gap-4 rounded-lg border bg-muted/20 p-4"
                  >
                    <Switch
                      id="edit-expert-isActive"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <div className="flex-1 space-y-1">
                      <FieldLabel htmlFor="edit-expert-isActive">
                        {field.value ? (
                          <Eye className="size-3.5 text-[#4fae2e]" />
                        ) : (
                          <EyeOff className="size-3.5 text-muted-foreground" />
                        )}
                        Listed in the public directory
                      </FieldLabel>
                      <FieldDescription>
                        {field.value
                          ? "This expert is discoverable at /experts and can receive consultations."
                          : "This expert is hidden from the public directory but keeps all profile data."}
                      </FieldDescription>
                    </div>
                    <Badge
                      variant={field.value ? "default" : "secondary"}
                      className="mt-0.5 shrink-0"
                    >
                      {field.value ? "Active" : "Inactive"}
                    </Badge>
                  </Field>
                )}
              />
            </FieldSet>
          </div>

          {/* ---------- Actions ---------- */}
          <DialogFooter className="border-t bg-muted/30 px-6 py-4">
            <p className="mr-auto text-xs text-muted-foreground">
              {hasChanges ? "Unsaved changes" : "No changes yet"}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges || updateExpertProfile.isPending}
            >
              {updateExpertProfile.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Pencil className="size-4" />
              )}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ====== Tag editor: 1 dòng input + chip list ======
function TagListEditor({
  values,
  onChange,
  maxItems,
  maxItemLength,
  inputId,
  placeholder,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  maxItems: number;
  maxItemLength: number;
  inputId: string;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const isFull = values.length >= maxItems;

  function add() {
    const value = draft.trim();
    setDraft("");
    if (!value || isFull) return;
    // Dedup không phân biệt hoa thường, giống normalizeStringList phía server
    if (values.some((item) => item.toLowerCase() === value.toLowerCase())) return;
    onChange([...values, value.slice(0, maxItemLength)]);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id={inputId}
          value={draft}
          disabled={isFull}
          placeholder={isFull ? `Limit of ${maxItems} tags reached` : placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add();
            }
            // Backspace trên ô trống → xoá tag cuối cùng
            if (event.key === "Backspace" && draft === "" && values.length) {
              onChange(values.slice(0, -1));
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={isFull || draft.trim() === ""}
          onClick={add}
        >
          <Plus className="size-4" />
          <span className="sr-only">Add tag</span>
        </Button>
      </div>

      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="gap-1 py-1 pl-2.5 pr-1"
            >
              {value}
              <button
                type="button"
                className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                onClick={() => onChange(values.filter((item) => item !== value))}
                aria-label={`Remove ${value}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
          No expertise added yet.
        </p>
      )}
    </div>
  );
}

// ====== List editor: mỗi mục 1 ô input + nút xoá ======
function ListEntryEditor({
  id,
  label,
  values,
  onChange,
  maxItems,
  maxItemLength,
  placeholder,
}: {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  maxItems: number;
  maxItemLength: number;
  placeholder: string;
}) {
  const isFull = values.length >= maxItems;

  function update(index: number, value: string) {
    onChange(values.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function remove(index: number) {
    onChange(values.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="space-y-2">
      {values.map((value, index) => (
        <div key={`${id}-${index}`} className="flex items-center gap-2">
          <Input
            // Dòng đầu mang id để FieldLabel htmlFor trỏ đúng vào 1 input
            id={index === 0 ? id : undefined}
            value={value}
            placeholder={placeholder}
            maxLength={maxItemLength}
            aria-label={`${label} entry ${index + 1}`}
            onChange={(event) => update(index, event.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => remove(index)}
          >
            <X className="size-4" />
            <span className="sr-only">
              Remove {label} entry {index + 1}
            </span>
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full border-dashed"
        disabled={isFull}
        onClick={() => onChange([...values, ""])}
      >
        <Plus className="size-3.5" />
        {isFull ? `Limit of ${maxItems} entries reached` : "Add entry"}
      </Button>
    </div>
  );
}
