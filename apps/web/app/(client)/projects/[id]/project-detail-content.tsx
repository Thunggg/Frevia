import Link from "next/link";
import { ArrowLeft, CalendarDays, DollarSign, Tag } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import type { ViewJobDetailResType } from "@shared/types";

export function ProjectDetailContent({ job }: { job: ViewJobDetailResType }) {
  return <div className="flex min-h-screen flex-col bg-background"><Header role="CLIENT" /><main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8"><Button variant="ghost" asChild><Link href="/projects"><ArrowLeft className="mr-2 size-4" />Back to My Jobs</Link></Button><div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row"><div><Badge variant="outline">{job.status}</Badge><h1 className="mt-3 text-3xl font-bold">{job.title}</h1><div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1"><DollarSign className="size-4" />${job.budgetMin ?? 0} – ${job.budgetMax ?? 0}</span><span className="flex items-center gap-1"><CalendarDays className="size-4" />Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : "Not set"}</span></div></div><Button asChild><Link href="/projects">Edit from My Jobs</Link></Button></div><div className="mt-8 grid gap-6 lg:grid-cols-3"><Card className="lg:col-span-2"><CardHeader><CardTitle>Job description</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap leading-7 text-muted-foreground">{job.description ?? "No description provided."}</CardContent></Card><Card><CardHeader><CardTitle>Required skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{job.skills.map((skill) => <Badge key={skill.skillId} variant="secondary"><Tag className="mr-1 size-3" />{skill.skill.name}</Badge>)}</CardContent></Card></div></main><Footer /></div>;
}
