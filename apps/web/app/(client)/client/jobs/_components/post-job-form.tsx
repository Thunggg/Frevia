"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "@/components/icons";
import {
  CreateJobBodySchema,
  type CreateJobBodyType,
  type JobType,
} from "@shared/types";

import jobApiRequest from "@/apiRequests/job";
import { ApiFail } from "@/lib/http";
import { handleErrorApi } from "@/lib/utils";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/shadcn/sheet";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/shadcn/field";
import { Input } from "@repo/ui/components/shadcn/input";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";

type PostJobFormProps = {
  mode?: "dialog" | "page";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved: (job: JobType) => void;
  onCancel?: () => void;
  job?: JobType;
};

const emptyJobForm: CreateJobBodyType = {
  title: "",
  description: "",
  budgetMin: null,
  budgetMax: null,
  budgetType: "FIXED_PRICE",
  deadline: null,
  expiryDate: null,
  skills: [],
};

function getJobFormValues(job?: JobType): CreateJobBodyType {
  if (!job) return emptyJobForm;

  return {
    title: job.title,
    description: job.description,
    budgetMin: job.budgetMin,
    budgetMax: job.budgetMax,
    budgetType: job.budgetType,
    deadline: job.deadline,
    expiryDate: job.expiryDate,
    skills: job.skills?.map((skill) => skill.skillId) ?? [],
  };
}

export function PostJobForm({
  mode = "dialog",
  open = true,
  onOpenChange,
  onSaved,
  onCancel,
  job,
}: PostJobFormProps) {
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
  const form = useForm<CreateJobBodyType>({
    resolver: zodResolver(CreateJobBodySchema) as Resolver<CreateJobBodyType>,
    defaultValues: emptyJobForm,
  });

  useEffect(() => {
    if (!isActive) return;
    form.reset(getJobFormValues(job));
    setSelectedSkills(
      job?.skills?.map((skill) => ({
        id: skill.skillId,
        name: skill.skill.name,
      })) ?? [],
    );
    setSkillInput("");
    setSkillOptions([]);
    setIsSkillMenuOpen(false);
  }, [form, job, isActive]);

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
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await jobApiRequest.searchSkills(search);
        if (response.success) setSkillOptions(response.data);
      } catch {
        setSkillOptions([]);
      }
    }, search ? 250 : 0);

    return () => window.clearTimeout(timeoutId);
  }, [isActive, skillInput, isSkillMenuOpen]);

  const close = () => {
    if (isDialog) onOpenChange?.(false);
    else onCancel?.();
  };

  const submit = async (data: CreateJobBodyType) => {
    try {
      const response = job
        ? await jobApiRequest.updateJob(job.id, data)
        : await jobApiRequest.createJob(data);
      if (!response.success) throw new Error("Unable to save job");
      onSaved({
        ...response.data,
        skills: selectedSkills.map((skill) => ({
          jobId: response.data.id,
          skillId: skill.id,
          skill: { name: skill.name },
        })),
      });
      toastSuccess({ message: job ? "Job updated" : "Job created" });
      if (isDialog) {
        onOpenChange?.(false);
        form.reset();
      }
    } catch (error) {
      if (error instanceof ApiFail)
        handleErrorApi({ error: error.response, setError: form.setError });
      else toastError({ message: "Unable to save job" });
    }
  };

  const fields = (
    <FieldGroup className="space-y-4 font-sans">
      <Controller
        name="title"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-xs font-semibold text-foreground font-sans">Job title</FieldLabel>
            <Input
              {...field}
              aria-invalid={fieldState.invalid}
              placeholder="Senior Full-stack Developer"
              className="h-10 rounded-full border-0 bg-[#F1F0F5] px-4 text-xs font-normal font-sans dark:bg-zinc-800/90 outline-none"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="description"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-xs font-semibold text-foreground font-sans">Description</FieldLabel>
            <Textarea
              {...field}
              value={field.value ?? ""}
              aria-invalid={fieldState.invalid}
              className="min-h-32 rounded-2xl border-0 bg-[#F1F0F5] p-4 text-xs font-normal font-sans dark:bg-zinc-800/90 outline-none"
              placeholder="Describe the work, expected deliverables, and required experience..."
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
              <FieldLabel className="text-xs font-semibold text-foreground font-sans">Minimum budget ($)</FieldLabel>
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
              <FieldLabel className="text-xs font-semibold text-foreground font-sans">Maximum budget ($)</FieldLabel>
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
          name="deadline"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className="text-xs font-semibold text-foreground font-sans">Deadline</FieldLabel>
              <Input
                type="date"
                value={
                  field.value
                    ? new Date(field.value).toISOString().slice(0, 10)
                    : ""
                }
                onChange={(event) =>
                  field.onChange(
                    event.target.value ? new Date(event.target.value) : null,
                  )
                }
                aria-invalid={fieldState.invalid}
                className="h-10 rounded-full border-0 bg-[#F1F0F5] px-4 text-xs font-normal font-sans dark:bg-zinc-800/90 outline-none"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="expiryDate"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className="text-xs font-semibold text-foreground font-sans">Expiry date</FieldLabel>
              <Input
                type="date"
                value={
                  field.value
                    ? new Date(field.value).toISOString().slice(0, 10)
                    : ""
                }
                onChange={(event) =>
                  field.onChange(
                    event.target.value ? new Date(event.target.value) : null,
                  )
                }
                aria-invalid={fieldState.invalid}
                className="h-10 rounded-full border-0 bg-[#F1F0F5] px-4 text-xs font-normal font-sans dark:bg-zinc-800/90 outline-none"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <Controller
        name="skills"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-xs font-semibold text-foreground font-sans">Required skills</FieldLabel>
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
            <p className="text-xs text-muted-foreground font-sans">
              Search by name or scroll through the available skills to select
              multiple items.
            </p>
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

  const actions = (
    <div className="mt-6 flex justify-end gap-2 font-sans">
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
        disabled={
          form.formState.isSubmitting ||
          (Boolean(job) && !form.formState.isDirty)
        }
      >
        {form.formState.isSubmitting ? "Saving..." : "Save job"}
      </Button>
    </div>
  );

  const formEl = (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-5 font-sans">
      {fields}
      {isDialog ? (
        <SheetFooter className="mt-8 flex flex-row items-center justify-end gap-3 border-t border-border/60 pt-5 font-sans">
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
            disabled={
              form.formState.isSubmitting ||
              (Boolean(job) && !form.formState.isDirty)
            }
          >
            {form.formState.isSubmitting ? "Saving..." : "Save job"}
          </Button>
        </SheetFooter>
      ) : (
        actions
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
        className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl overflow-y-auto p-6 sm:p-8 bg-background border-l border-border shadow-2xl rounded-l-[28px] flex flex-col justify-between font-sans"
      >
        <div className="flex flex-col font-sans">
          <SheetHeader className="p-0 pb-6 border-b border-border/60 font-sans">
            <SheetTitle className="text-xl font-bold tracking-tight text-foreground font-sans">
              {job ? "Edit job" : "Post a new job"}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground mt-1 font-sans">
              {job
                ? "Update your job details, budget, timeline, and required skills."
                : "Fill in the details to publish a new job posting."}
            </SheetDescription>
          </SheetHeader>
          <div className="pt-6 font-sans">
            {formEl}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
