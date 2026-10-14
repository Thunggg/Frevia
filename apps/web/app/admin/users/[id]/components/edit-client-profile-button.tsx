"use client";

import { useRouter } from "next/navigation";
import { useUpdateClientProfile } from "@/hooks/use-admin-user";
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
  type AdminUpdateClientProfileBodyType,
  type AdminUserDetailResponseType,
} from "@shared/types";
import { Building2, Loader2, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { z } from "zod";

const FIELD_PATHS = new Set(["companyName", "companyDescription", "website"]);

const ClientProfileFormSchema = z.object({
  companyName: z
    .string()
    .trim()
    .max(255, ManageUserMessage.COMPANY_NAME_TOO_LONG),
  companyDescription: z
    .string()
    .trim()
    .max(5000, ManageUserMessage.COMPANY_DESCRIPTION_TOO_LONG),
  website: z.union([
    z.string().trim().url(ManageUserMessage.INVALID_WEBSITE),
    z.literal(""),
  ]),
});

type ClientProfileFormValues = z.infer<typeof ClientProfileFormSchema>;

interface EditClientProfileButtonProps {
  user: AdminUserDetailResponseType;
}

export function EditClientProfileButton({
  user,
}: EditClientProfileButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const updateClientProfile = useUpdateClientProfile();
  const clientProfile = user.clientProfile;

  const form = useForm<ClientProfileFormValues>({
    resolver: zodResolver(ClientProfileFormSchema) as Resolver<
      ClientProfileFormValues
    >,
    defaultValues: {
      companyName: "",
      companyDescription: "",
      website: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        companyName: clientProfile?.companyName ?? "",
        companyDescription: clientProfile?.companyDescription ?? "",
        website: clientProfile?.website ?? "",
      });
    }
  }, [open, clientProfile, form]);

  const watched = form.watch();

  const hasChanges = useMemo(() => {
    const current = {
      companyName: clientProfile?.companyName ?? null,
      companyDescription: clientProfile?.companyDescription ?? null,
      website: clientProfile?.website ?? null,
    };
    const next = {
      companyName:
        watched.companyName.trim() === "" ? null : watched.companyName.trim(),
      companyDescription:
        watched.companyDescription.trim() === ""
          ? null
          : watched.companyDescription.trim(),
      website:
        watched.website.trim() === "" ? null : watched.website.trim(),
    };
    return (
      next.companyName !== current.companyName ||
      next.companyDescription !== current.companyDescription ||
      next.website !== current.website
    );
  }, [clientProfile, watched]);

  function onSubmit(values: ClientProfileFormValues) {
    const current = {
      companyName: clientProfile?.companyName ?? null,
      companyDescription: clientProfile?.companyDescription ?? null,
      website: clientProfile?.website ?? null,
    };
    const next = {
      companyName:
        values.companyName.trim() === "" ? null : values.companyName.trim(),
      companyDescription:
        values.companyDescription.trim() === ""
          ? null
          : values.companyDescription.trim(),
      website: values.website.trim() === "" ? null : values.website.trim(),
    };

    const payload: AdminUpdateClientProfileBodyType = {};
    if (next.companyName !== current.companyName) {
      payload.companyName = next.companyName;
    }
    if (next.companyDescription !== current.companyDescription) {
      payload.companyDescription = next.companyDescription;
    }
    if (next.website !== current.website) {
      payload.website = next.website;
    }

    if (Object.keys(payload).length === 0) {
      setOpen(false);
      return;
    }

    updateClientProfile.mutate(
      { id: user.id, body: payload },
      {
        onSuccess: () => {
          toastSuccess({
            message: `Client profile for "${user.email}" updated`,
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
                  detail.path as
                    | "companyName"
                    | "companyDescription"
                    | "website",
                  { type: "server", message: detail.message },
                );
              } else {
                toastError({ message: detail.message });
              }
            }
          } else {
            toastError({ message: "Failed to update client profile" });
          }
        },
      },
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 hover:bg-[#4fae2e]/10 hover:text-[#4fae2e] hover:border-[#4fae2e]/40 transition-colors"
          >
            {clientProfile ? (
              <Pencil className="h-3.5 w-3.5" />
            ) : (
              <Building2 className="h-3.5 w-3.5" />
            )}
            {clientProfile ? "Edit profile" : "Complete profile"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#4fae2e]" />
              {clientProfile ? "Edit client profile" : "Complete client profile"}
            </DialogTitle>
            <DialogDescription>
              Update company information for{" "}
              <span className="font-medium text-foreground">
                {user.email}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <Controller
                name="companyName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-client-companyName">
                      Company name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="edit-client-companyName"
                      placeholder="Acme Inc."
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="companyDescription"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-client-companyDescription">
                      Company description
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="edit-client-companyDescription"
                      placeholder="What does this company do?"
                      rows={4}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="website"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-client-website">
                      Website
                    </FieldLabel>
                    <Input
                      {...field}
                      id="edit-client-website"
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
                disabled={!hasChanges || updateClientProfile.isPending}
              >
                {updateClientProfile.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
