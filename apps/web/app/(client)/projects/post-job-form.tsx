"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { CreateJobBodySchema, type CreateJobBodyType, type JobType } from "@shared/types";

import jobApiRequest from "@/apiRequests/job";
import { ApiFail } from "@/lib/http";
import { handleErrorApi } from "@/lib/utils";
import { Button } from "@repo/ui/components/shadcn/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/shadcn/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@repo/ui/components/shadcn/field";
import { Input } from "@repo/ui/components/shadcn/input";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";

type PostJobFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (job: JobType) => void;
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

export function PostJobForm({ open, onOpenChange, onSaved, job }: PostJobFormProps) {
  const [skillInput, setSkillInput] = useState("");
  const [skillOptions, setSkillOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedSkills, setSelectedSkills] = useState<Array<{ id: number; name: string }>>([]);
  const [isSkillMenuOpen, setIsSkillMenuOpen] = useState(false);
  const skillPickerRef = useRef<HTMLDivElement>(null);
  const form = useForm<CreateJobBodyType>({
    resolver: zodResolver(CreateJobBodySchema) as Resolver<CreateJobBodyType>,
    defaultValues: emptyJobForm,
  });
  useEffect(() => {
    form.reset(getJobFormValues(job));
    setSelectedSkills(job?.skills?.map((skill) => ({ id: skill.skillId, name: skill.skill.name })) ?? []);
    setSkillInput("");
    setSkillOptions([]);
    setIsSkillMenuOpen(false);
  }, [form, job, open]);

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
    if (!open || !isSkillMenuOpen) return;

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
  }, [open, skillInput, isSkillMenuOpen]);

  const submit = async (data: CreateJobBodyType) => {
    try {
      const response = job ? await jobApiRequest.updateJob(job.id, data) : await jobApiRequest.createJob(data);
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
      onOpenChange(false);
      form.reset();
    } catch (error) {
      if (error instanceof ApiFail) handleErrorApi({ error: error.response, setError: form.setError });
      else toastError({ message: "Unable to save job" });
    }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{job ? "Edit job" : "Post a new job"}</DialogTitle></DialogHeader><form onSubmit={form.handleSubmit(submit)}><FieldGroup>
    <Controller name="title" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel>Job title</FieldLabel><Input {...field} aria-invalid={fieldState.invalid} placeholder="Senior Full-stack Developer" />{fieldState.invalid && <FieldError errors={[fieldState.error]} />}</Field>} />
    <Controller name="description" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel>Description</FieldLabel><Textarea {...field} value={field.value ?? ""} aria-invalid={fieldState.invalid} className="min-h-32" placeholder="Describe the work, expected deliverables, and required experience..." />{fieldState.invalid && <FieldError errors={[fieldState.error]} />}</Field>} />
    <div className="grid gap-4 sm:grid-cols-2"><Controller name="budgetMin" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel>Minimum budget</FieldLabel><Input type="number" value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))} aria-invalid={fieldState.invalid} placeholder="e.g. 500" />{fieldState.invalid && <FieldError errors={[fieldState.error]} />}</Field>} /><Controller name="budgetMax" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel>Maximum budget</FieldLabel><Input type="number" value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))} aria-invalid={fieldState.invalid} placeholder="e.g. 2,000" />{fieldState.invalid && <FieldError errors={[fieldState.error]} />}</Field>} /></div>
    <div className="grid gap-4 sm:grid-cols-2"><Controller name="deadline" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel>Deadline</FieldLabel><Input type="date" value={field.value ? new Date(field.value).toISOString().slice(0, 10) : ""} onChange={(event) => field.onChange(event.target.value ? new Date(event.target.value) : null)} aria-invalid={fieldState.invalid} />{fieldState.invalid && <FieldError errors={[fieldState.error]} />}</Field>} /><Controller name="expiryDate" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel>Expiry date</FieldLabel><Input type="date" value={field.value ? new Date(field.value).toISOString().slice(0, 10) : ""} onChange={(event) => field.onChange(event.target.value ? new Date(event.target.value) : null)} aria-invalid={fieldState.invalid} />{fieldState.invalid && <FieldError errors={[fieldState.error]} />}</Field>} /></div>
    <Controller name="skills" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel>Required skills</FieldLabel><div ref={skillPickerRef} className="relative"><Input value={skillInput} onFocus={() => setIsSkillMenuOpen(true)} onChange={(event) => { setSkillInput(event.target.value); setIsSkillMenuOpen(true); }} placeholder="Search or scroll to select skills..." aria-invalid={fieldState.invalid} />{isSkillMenuOpen && skillOptions.length > 0 && <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">{skillOptions.filter((skill) => !field.value.includes(skill.id)).map((skill) => <button key={skill.id} type="button" className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => { field.onChange([...field.value, skill.id]); setSelectedSkills((current) => [...current, skill]); setSkillInput(""); setIsSkillMenuOpen(false); }}>{skill.name}</button>)}</div>}</div><p className="text-xs text-muted-foreground">Search by name or scroll through the available skills to select multiple items.</p><div className="flex flex-wrap gap-2">{selectedSkills.map((skill) => <Badge key={skill.id}>{skill.name}<button type="button" onClick={() => { field.onChange(field.value.filter((id) => id !== skill.id)); setSelectedSkills((current) => current.filter((item) => item.id !== skill.id)); }}><X className="ml-1 size-3" /></button></Badge>)}</div>{fieldState.invalid && <FieldError errors={[fieldState.error]} />}</Field>} />
  </FieldGroup><DialogFooter className="mt-6"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={form.formState.isSubmitting || (Boolean(job) && !form.formState.isDirty)}>{form.formState.isSubmitting ? "Saving..." : "Save job"}</Button></DialogFooter></form></DialogContent></Dialog>;
}
