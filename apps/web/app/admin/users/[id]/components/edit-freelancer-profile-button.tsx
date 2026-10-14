"use client";

import { useRouter } from "next/navigation";
import { useUpdateFreelancerProfile } from "@/hooks/use-admin-user";
import { ApiFail } from "@/lib/http";
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
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  ManageUserMessage,
  type AdminUpdateFreelancerProfileBodyType,
  type AdminUserDetailResponseType,
} from "@shared/types";
import { Loader2, PenLine, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { z } from "zod";

const FIELD_PATHS = new Set(["title", "bio"]);

const IntroFormSchema = z.object({
  title: z
    .string()
    .trim()
    .max(255, ManageUserMessage.FREELANCER_TITLE_TOO_LONG),
  bio: z.string().trim().max(5000, ManageUserMessage.BIO_TOO_LONG),
});

type IntroFormValues = z.infer<typeof IntroFormSchema>;

interface EditFreelancerProfileButtonProps {
  user: AdminUserDetailResponseType;
}

// ====== Nút "Edit intro / Complete profile" trong tab FREELANCER (User Detail) ======
// Mở dialog sửa phần giới thiệu: professional title + bio.
// - User chưa có freelancer profile → nút "Complete profile" (server tự upsert tạo row).
// - Bỏ trống 1 trường = xoá nội dung trường đó (gửi null).
export function EditFreelancerProfileButton({
  user,
}: EditFreelancerProfileButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const updateFreelancerProfile = useUpdateFreelancerProfile();
  const freelancerProfile = user.freelancerProfile;

  const form = useForm<IntroFormValues>({
    resolver: zodResolver(IntroFormSchema) as Resolver<IntroFormValues>,
    defaultValues: {
      title: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: freelancerProfile?.title ?? "",
        bio: user.bio ?? "",
      });
    }
  }, [open, freelancerProfile, user.bio, form]);

  const watched = form.watch();

  // So sánh form (chuẩn hoá rỗng → null) với dữ liệu hiện tại → disable Save nếu không đổi
  const hasChanges = useMemo(() => {
    const current = {
      title: freelancerProfile?.title ?? null,
      bio: user.bio ?? null,
    };
    const next = {
      title: watched.title.trim() === "" ? null : watched.title.trim(),
      bio: watched.bio.trim() === "" ? null : watched.bio.trim(),
    };
    return next.title !== current.title || next.bio !== current.bio;
  }, [freelancerProfile, user.bio, watched]);

  // Chỉ gửi lên các trường thay đổi (payload tối thiểu cho PATCH)
  function onSubmit(values: IntroFormValues) {
    const current = {
      title: freelancerProfile?.title ?? null,
      bio: user.bio ?? null,
    };
    const next = {
      title: values.title.trim() === "" ? null : values.title.trim(),
      bio: values.bio.trim() === "" ? null : values.bio.trim(),
    };

    const payload: AdminUpdateFreelancerProfileBodyType = {};
    if (next.title !== current.title) payload.title = next.title;
    if (next.bio !== current.bio) payload.bio = next.bio;

    if (Object.keys(payload).length === 0) {
      setOpen(false);
      return;
    }

    updateFreelancerProfile.mutate(
      { id: user.id, body: payload },
      {
        onSuccess: () => {
          toastSuccess({
            message: `Freelancer profile for "${user.email}" updated`,
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
            for (const detail of details) {
              if (FIELD_PATHS.has(detail.path)) {
                form.setError(
                  detail.path as "title" | "bio",
                  { type: "server", message: detail.message },
                );
              } else {
                toastError({ message: detail.message });
              }
            }
          } else {
            toastError({ message: "Failed to update freelancer profile" });
          }
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
          className="gap-1.5 hover:bg-purple-500/10 hover:text-purple-500 hover:border-purple-400/40 transition-colors"
        >
          {freelancerProfile ? (
            <PenLine className="h-3.5 w-3.5" />
          ) : (
            <UserRound className="h-3.5 w-3.5" />
          )}
          {freelancerProfile ? "Edit intro" : "Complete profile"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-purple-500" />
            {freelancerProfile
              ? "Edit freelancer intro"
              : "Complete freelancer profile"}
          </DialogTitle>
          <DialogDescription>
            Update the professional title and introduction for{" "}
            <span className="font-medium text-foreground">{user.email}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-freelancer-title">
                    Professional title
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-freelancer-title"
                    placeholder="e.g. Senior Full-stack Developer"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="bio"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-freelancer-bio">
                    Bio / Introduction
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="edit-freelancer-bio"
                    placeholder="Short introduction shown on the public profile..."
                    rows={5}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges || updateFreelancerProfile.isPending}
            >
              {updateFreelancerProfile.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
