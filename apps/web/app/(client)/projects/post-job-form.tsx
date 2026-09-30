"use client";

import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
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

export function PostJobForm({ open, onOpenChange, onSaved, job }: PostJobFormProps) {
  const [skillInput, setSkillInput] = useState("");
  const form = useForm<CreateJobBodyType>({
    resolver: zodResolver(CreateJobBodySchema) as Resolver<CreateJobBodyType>,
    values: job
      ? { title: job.title, description: job.description, budgetMin: job.budgetMin, budgetMax: job.budgetMax, budgetType: job.budgetType, deadline: job.deadline, expiryDate: job.expiryDate, skills: job.skills?.map((skill) => skill.skill.name) ?? [] }
      : { title: "", description: "", budgetMin: null, budgetMax: null, budgetType: "FIXED_PRICE", deadline: null, expiryDate: null, skills: [] },
  });
  const skills = form.watch("skills");

  const submit = async (data: CreateJobBodyType) => {
    try {
      const response = job ? await jobApiRequest.updateJob(job.id, data) : await jobApiRequest.createJob(data);
      if (!response.success) throw new Error("Unable to save job");
      onSaved(response.data);
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
    <Controller name="description" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel>Description</FieldLabel><Textarea {...field} value={field.value ?? ""} aria-invalid={fieldState.invalid} className="min-h-32" />{fieldState.invalid && <FieldError errors={[fieldState.error]} />}</Field>} />
    <div className="grid gap-4 sm:grid-cols-2"><Controller name="budgetMin" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel>Minimum budget</FieldLabel><Input type="number" value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))} aria-invalid={fieldState.invalid} />{fieldState.invalid && <FieldError errors={[fieldState.error]} />}</Field>} /><Controller name="budgetMax" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel>Maximum budget</FieldLabel><Input type="number" value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))} aria-invalid={fieldState.invalid} />{fieldState.invalid && <FieldError errors={[fieldState.error]} />}</Field>} /></div>
    <div className="grid gap-4 sm:grid-cols-2"><Controller name="deadline" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel>Deadline</FieldLabel><Input type="date" value={field.value ? new Date(field.value).toISOString().slice(0, 10) : ""} onChange={(event) => field.onChange(event.target.value ? new Date(event.target.value) : null)} aria-invalid={fieldState.invalid} />{fieldState.invalid && <FieldError errors={[fieldState.error]} />}</Field>} /><Controller name="expiryDate" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel>Expiry date</FieldLabel><Input type="date" value={field.value ? new Date(field.value).toISOString().slice(0, 10) : ""} onChange={(event) => field.onChange(event.target.value ? new Date(event.target.value) : null)} aria-invalid={fieldState.invalid} />{fieldState.invalid && <FieldError errors={[fieldState.error]} />}</Field>} /></div>
    <Controller name="skills" control={form.control} render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel>Required skills</FieldLabel><div className="flex gap-2"><Input value={skillInput} onChange={(event) => setSkillInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); const skill = skillInput.trim(); if (skill && !field.value.includes(skill)) { field.onChange([...field.value, skill]); setSkillInput(""); } } }} placeholder="Type a skill and press Enter" /><Button type="button" variant="outline" onClick={() => { const skill = skillInput.trim(); if (skill && !field.value.includes(skill)) { field.onChange([...field.value, skill]); setSkillInput(""); } }}><Plus /></Button></div><div className="flex flex-wrap gap-2">{skills.map((skill) => <Badge key={skill}>{skill}<button type="button" onClick={() => field.onChange(field.value.filter((item) => item !== skill))}><X className="ml-1 size-3" /></button></Badge>)}</div>{fieldState.invalid && <FieldError errors={[fieldState.error]} />}</Field>} />
  </FieldGroup><DialogFooter className="mt-6"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving..." : "Save job"}</Button></DialogFooter></form></DialogContent></Dialog>;
}
