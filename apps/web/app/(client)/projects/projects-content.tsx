"use client";

import { useState } from "react";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import jobApiRequest from "@/apiRequests/job";
import { Button } from "@repo/ui/components/shadcn/button";
import { Card, CardContent } from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { JobType, JobStatusType } from "@shared/types";
import { PostJobForm } from "./post-job-form";

export function ProjectsContent({ initialJobs }: { initialJobs: JobType[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [editingJob, setEditingJob] = useState<JobType | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const saveJob = (job: JobType) =>
    setJobs((current) =>
      current.some((item) => item.id === job.id)
        ? current.map((item) => (item.id === job.id ? job : item))
        : [job, ...current],
    );
  const deleteJob = async (jobId: number) => {
    try {
      await jobApiRequest.deleteJob(jobId);
      setJobs((current) => current.filter((job) => job.id !== jobId));
      toastSuccess({ message: "Job deleted" });
    } catch {
      toastError({ message: "Unable to delete job" });
    }
  };
  const changeStatus = async (jobId: number, status: JobStatusType) => {
    try {
      const response = await jobApiRequest.changeJobStatus(jobId, { status });
      if (!response.success) throw new Error();
      setJobs((current) =>
        current.map((job) => (job.id === jobId ? response.data : job)),
      );
      toastSuccess({ message: "Job status updated" });
    } catch {
      toastError({ message: "Unable to update status" });
    }
  };
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header role="CLIENT" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Jobs</h1>
            <p className="mt-1 text-muted-foreground">
              Create and manage your posted jobs
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingJob(undefined);
              setIsFormOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            Post a job
          </Button>
        </div>
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{job.title}</h2>
                    <Badge variant="outline">{job.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    ${job.budgetMin ?? 0} – ${job.budgetMax ?? 0} ·{" "}
                    {job.budgetType}
                  </p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={job.status}
                    className="rounded-md border bg-background px-2 text-sm"
                    onChange={(event) =>
                      changeStatus(job.id, event.target.value as JobStatusType)
                    }
                  >
                    {[
                      "DRAFT",
                      "OPEN",
                      "IN_PROGRESS",
                      "COMPLETED",
                      "CLOSED",
                      "CANCELLED",
                    ].map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingJob(job);
                      setIsFormOpen(true);
                    }}
                  >
                    <Edit2 className="mr-1 size-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => deleteJob(job.id)}
                  >
                    <Trash2 className="mr-1 size-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!jobs.length && (
            <p className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
              You have not posted any jobs yet.
            </p>
          )}
        </div>
      </main>
      <PostJobForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSaved={saveJob}
        job={editingJob}
      />
      <Footer />
    </div>
  );
}
