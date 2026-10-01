"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit2, Eye, Plus, Trash2 } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import jobApiRequest from "@/apiRequests/job";
import { Button } from "@repo/ui/components/shadcn/button";
import { Card, CardContent } from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@repo/ui/components/shadcn/alert-dialog";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { JobType, JobStatusType } from "@shared/types";
import { PostJobForm } from "./post-job-form";

type ProjectsContentProps = {
  initialJobs: JobType[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export function ProjectsContent({ initialJobs, pagination }: ProjectsContentProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [editingJob, setEditingJob] = useState<JobType | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDeleteJobId, setPendingDeleteJobId] = useState<number | null>(null);
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
                  <Button variant="outline" size="sm" asChild><Link href={`/projects/${job.id}`}><Eye className="mr-1 size-4" />View</Link></Button>
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
                    onClick={() => setPendingDeleteJobId(job.id)}
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
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => router.push(`/projects?page=${pagination.page - 1}`)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => router.push(`/projects?page=${pagination.page + 1}`)}
            >
              Next
            </Button>
          </div>
        )}
      </main>
      <PostJobForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSaved={saveJob}
        job={editingJob}
      />
      <AlertDialog open={pendingDeleteJobId !== null} onOpenChange={(open) => !open && setPendingDeleteJobId(null)}>
        <AlertDialogContent showCloseButton={false}>
          <AlertDialogHeader><AlertDialogTitle>Delete this job?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel render={<Button variant="outline" />}>Cancel</AlertDialogCancel><Button variant="destructive" onClick={() => { if (pendingDeleteJobId) deleteJob(pendingDeleteJobId); setPendingDeleteJobId(null); }}>Delete job</Button></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Footer />
    </div>
  );
}
