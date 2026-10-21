"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/shadcn/field";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/shadcn/sheet";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { X } from "@/components/icons";
import {
  CreateJobAlertBodySchema,
  type CreateJobAlertBodyType,
  type JobAlertType,
} from "@shared/types";

import jobApiRequest from "@/apiRequests/job";
import { useCreateJobAlert, useUpdateJobAlert } from "@/hooks/use-job-alerts";
import { ApiFail } from "@/lib/http";
import { handleErrorApi } from "@/lib/utils";

type JobAlertFrequencyValue = "INSTANT" | "DAILY" | "WEEKLY";

const FREQUENCY_OPTIONS: Array<{
  value: JobAlertFrequencyValue;
  label: string;
}> = [
  { value: "INSTANT", label: "Instant" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
];

const CHANNEL_OPTIONS: Array<{
  value: "IN_APP" | "EMAIL";
  label: string;
}> = [
  { value: "IN_APP", label: "In-app notification" },
  { value: "EMAIL", label: "Email" },
];

type JobAlertFormProps = {
  mode?: "dialog" | "page";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved: (alert: JobAlertType) => void;
  onCancel?: () => void;
  alert?: JobAlertType;
};

const emptyAlertForm: CreateJobAlertBodyType = {
  name: "",
  keywords: null,
  budgetMin: null,
  budgetMax: null,
  budgetType: null,
  frequency: "INSTANT",
  channels: ["IN_APP"],
  skills: [],
};

function getAlertFormValues(alert?: JobAlertType): CreateJobAlertBodyType {
  if (!alert) return emptyAlertForm;

  return {
    name: alert.name,
    keywords: alert.keywords,
    budgetMin: alert.budgetMin,
    budgetMax: alert.budgetMax,
    budgetType: alert.budgetType,
    frequency: alert.frequency,
    channels: alert.channels,
    skills: alert.skills.map((skill) => skill.skillId),
  };
}

function formatBudget(values: CreateJobAlertBodyType): string | null {
  if (values.budgetMin == null && values.budgetMax == null) return null;

  const format = (value: number) =>
    new Intl.NumberFormat("en", {
      maximumFractionDigits: 2,
    }).format(value);

  if (values.budgetMin != null && values.budgetMax != null) {
    return `$${format(values.budgetMin)} - $${format(values.budgetMax)}`;
  }
  if (values.budgetMin != null) return `Min $${format(values.budgetMin)}`;
  if (values.budgetMax != null) return `Max $${format(values.budgetMax)}`;
  return null;
}

export function JobAlertForm({
  mode = "dialog",
  open = true,
  onOpenChange,
  onSaved,
  onCancel,
  alert,
}: JobAlertFormProps) {
  const isDialog = mode === "dialog";
  const isActive = isDialog ? open : true;
  const [skillInput, setSkillInput] = useState("");
  const [skillOptions, setSkillOptions] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [selectedSkills, setSelectedSkills] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [isSkillMenuOpen, setIsSkillMenuOpen] = useState(false);
  const skillPickerRef = useRef<HTMLDivElement>(null);
  const form = useForm<CreateJobAlertBodyType>({
    resolver: zodResolver(
      CreateJobAlertBodySchema,
    ) as Resolver<CreateJobAlertBodyType>,
    defaultValues: emptyAlertForm,
  });

  const createAlert = useCreateJobAlert();
  const updateAlert = useUpdateJobAlert();

  useEffect(() => {
    if (!isActive) return;
    form.reset(getAlertFormValues(alert));
    setSelectedSkills(
      alert?.skills.map((skill) => ({
        id: skill.skillId,
        name: skill.skill.name,
      })) ?? [],
    );
    setSkillInput("");
    setSkillOptions([]);
    setIsSkillMenuOpen(false);
  }, [form, alert, isActive]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!skillPickerRef.current?.contains(event.target as Node)) {
        setIsSkillMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (!isActive || !isSkillMenuOpen) return;

    const search = skillInput.trim();
    const timeoutId = window.setTimeout(
      async () => {
        try {
          const response = await jobApiRequest.searchSkills(search);
          if (response.success) setSkillOptions(response.data);
        } catch {
          setSkillOptions([]);
        }
      },
      search ? 250 : 0,
    );

    return () => window.clearTimeout(timeoutId);
  }, [isActive, skillInput, isSkillMenuOpen]);

  const close = () => {
    if (isDialog) onOpenChange?.(false);
    else onCancel?.();
  };

  const submit = async (data: CreateJobAlertBodyType) => {
    try {
      const response = alert
        ? await updateAlert.mutateAsync({ id: alert.id, body: data })
        : await createAlert.mutateAsync(data);
      if (!response.success) throw new Error("Unable to save job alert");
      onSaved(response.data);
      toastSuccess({
        message: alert
          ? "Job alert updated successfully"
          : "Job alert created successfully",
      });
      if (isDialog) {
        onOpenChange?.(false);
        form.reset();
      }
    } catch (error) {
      if (error instanceof ApiFail)
        handleErrorApi({ error: error.response, setError: form.setError });
      else toastError({ message: "Unable to save job alert" });
    }
  };

  const fields = (
    <FieldGroup className="space-y-4 font-sans">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-xs font-semibold text-foreground font-sans">
              Alert name
            </FieldLabel>
            <Input
              {...field}
              aria-invalid={fieldState.invalid}
              placeholder="e.g. React developer alerts"
              className="h-10 rounded-full border-0 bg-[#F1F0F5] px-4 text-xs font-normal font-sans dark:bg-zinc-800/90 outline-none"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="keywords"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-xs font-semibold text-foreground font-sans">
              Keywords
            </FieldLabel>
            <Input
              value={field.value ?? ""}
              onChange={(event) =>
                field.onChange(
                  event.target.value === "" ? null : event.target.value,
                )
              }
              aria-invalid={fieldState.invalid}
              placeholder="e.g. typescript, nextjs, remote"
              className="h-10 rounded-full border-0 bg-[#F1F0F5] px-4 text-xs font-normal font-sans dark:bg-zinc-800/90 outline-none"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="budgetMin"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className="text-xs font-semibold text-foreground font-sans">
                Minimum budget ($)
              </FieldLabel>
              <Input
                type="number"
                value={field.value ?? ""}
                onChange={(event) =>
                  field.onChange(
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
                aria-invalid={fieldState.invalid}
                placeholder="e.g. 500"
                className="h-10 rounded-full border-0 bg-[#F1F0F5] px-4 text-xs font-normal font-sans dark:bg-zinc-800/90 outline-none"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="budgetMax"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className="text-xs font-semibold text-foreground font-sans">
                Maximum budget ($)
              </FieldLabel>
              <Input
                type="number"
                value={field.value ?? ""}
                onChange={(event) =>
                  field.onChange(
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
                aria-invalid={fieldState.invalid}
                placeholder="e.g. 2,000"
                className="h-10 rounded-full border-0 bg-[#F1F0F5] px-4 text-xs font-normal font-sans dark:bg-zinc-800/90 outline-none"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="frequency"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel className="text-xs font-semibold text-foreground font-sans">
                Delivery frequency
              </FieldLabel>
              <Select
                value={field.value}
                onValueChange={(value) =>
                  field.onChange(value as JobAlertFrequencyValue)
                }
              >
                <SelectTrigger className="h-10 rounded-full border-0 bg-[#F1F0F5] px-4 text-xs font-normal font-sans dark:bg-zinc-800/90 outline-none">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
        <Controller
          name="channels"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel className="text-xs font-semibold text-foreground font-sans">
                Channels
              </FieldLabel>
              <div className="flex flex-wrap gap-2 pt-1">
                {CHANNEL_OPTIONS.map((option) => {
                  const isSelected = field.value.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() =>
                        field.onChange(
                          isSelected
                            ? field.value.filter(
                                (value) => value !== option.value,
                              )
                            : [...field.value, option.value],
                        )
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium font-sans cursor-pointer transition-colors ${
                        isSelected
                          ? "border-[#0069D3] bg-[#D0E1F8] text-[#0069D3] dark:bg-[#0069D3]/20 dark:text-blue-200"
                          : "border-border bg-[#F1F0F5] text-muted-foreground hover:border-[#0069D3]/40 dark:bg-zinc-800/90"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}
        />
      </div>
      <Controller
        name="skills"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-xs font-semibold text-foreground font-sans">
              Skills
            </FieldLabel>
            <div ref={skillPickerRef} className="relative">
              <Input
                value={skillInput}
                onFocus={() => setIsSkillMenuOpen(true)}
                onChange={(event) => {
                  setSkillInput(event.target.value);
                  setIsSkillMenuOpen(true);
                }}
                placeholder="Search or scroll to select skills..."
                aria-invalid={fieldState.invalid}
                className="h-10 rounded-full border-0 bg-[#F1F0F5] px-4 text-xs font-normal font-sans dark:bg-zinc-800/90 outline-none"
              />
              {isSkillMenuOpen && skillOptions.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-2 shadow-xl">
                  {skillOptions
                    .filter((skill) => !field.value.includes(skill.id))
                    .map((skill) => (
                      <button
                        key={skill.id}
                        type="button"
                        className="block w-full rounded-full px-3.5 py-2 text-left text-xs font-medium font-sans hover:bg-[#F1F0F5] dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        onClick={() => {
                          field.onChange([...field.value, skill.id]);
                          setSelectedSkills((current) => [...current, skill]);
                          setSkillInput("");
                          setIsSkillMenuOpen(false);
                        }}
                      >
                        {skill.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
            <FieldDescription className="text-xs text-muted-foreground font-sans">
              Save a search or scroll through the available skills to select
              multiple items.
            </FieldDescription>
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <Badge
                  key={skill.id}
                  className="rounded-full border-0 bg-[#F1F0F5] dark:bg-zinc-800 px-3 py-1 text-xs font-medium font-sans text-foreground hover:bg-[#EAE9F0] dark:hover:bg-zinc-700"
                >
                  {skill.name}
                  <button
                    type="button"
                    className="cursor-pointer ml-1"
                    onClick={() => {
                      field.onChange(
                        field.value.filter((id) => id !== skill.id),
                      );
                      setSelectedSkills((current) =>
                        current.filter((item) => item.id !== skill.id),
                      );
                    }}
                  >
                    <X className="size-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))}
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FieldGroup>
  );

  const controls = (submitting: boolean, dirty: boolean) => (
    <>
      <Button
        type="button"
        variant="ghost"
        className="h-10 rounded-full px-5 text-xs font-medium font-sans bg-[#F1F0F5] dark:bg-zinc-800 hover:bg-[#EAE9F0] dark:hover:bg-zinc-700 text-foreground cursor-pointer transition-colors"
        onClick={close}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        className="h-10 rounded-full px-6 text-xs font-semibold font-sans bg-[#0069D3] text-white hover:bg-blue-600 dark:bg-[#0069D3] dark:hover:bg-blue-500 shadow-xs cursor-pointer transition-colors"
        disabled={submitting || (Boolean(alert) && !dirty)}
      >
        {submitting ? "Saving..." : "Save alert"}
      </Button>
    </>
  );

  const formEl = (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-5 font-sans">
      {fields}
      {isDialog ? (
        <SheetFooter className="mt-8 flex flex-row items-center justify-end gap-3 border-t border-border/60 pt-5 font-sans">
          {controls(
            form.formState.isSubmitting,
            Boolean(form.formState.isDirty),
          )}
        </SheetFooter>
      ) : (
        <div className="mt-6 flex justify-end gap-2 font-sans">
          {controls(
            form.formState.isSubmitting,
            Boolean(form.formState.isDirty),
          )}
        </div>
      )}
    </form>
  );

  if (!isDialog) {
    return formEl;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl md:max-w-3xl overflow-y-auto p-6 sm:p-8 bg-background border-l border-border shadow-2xl rounded-l-[28px] flex flex-col justify-between font-sans"
      >
        <div className="flex flex-col font-sans">
          <SheetHeader className="p-0 pb-6 border-b border-border/60 font-sans">
            <SheetTitle className="text-xl font-bold tracking-tight text-foreground font-sans">
              {alert ? "Edit job alert" : "Create a job alert"}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground mt-1 font-sans">
              {alert
                ? "Update the criteria, frequency, and channels for this alert."
                : "Get notified when new jobs match your criteria."}
            </SheetDescription>
          </SheetHeader>
          <div className="pt-6 font-sans">{formEl}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function getAlertBudgetLabel(values: CreateJobAlertBodyType) {
  return formatBudget(values);
}
