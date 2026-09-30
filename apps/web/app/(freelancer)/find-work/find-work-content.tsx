"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, DollarSign, MapPin } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import type { ViewListJobResponseType } from "@shared/types";

type FindWorkContentProps = {
  initialJobs: ViewListJobResponseType["data"];
  initialPagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  initialKeyword?: string;
  initialBudget?: string;
  initialTime?: string;
};

export function FindWorkContent({
  initialJobs,
  initialPagination,
  initialKeyword = "",
  initialBudget = "all",
  initialTime = "all",
}: FindWorkContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobs = initialJobs ?? [];
  const pagination = initialPagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };

  const trendingSkills = ["UI Design", "React", "Python", "Copywriting", "SEO"];

  const categories = [
    { name: "Design & Creative", count: 1284 },
    { name: "Development & IT", count: 886 },
    { name: "Sales & Marketing", count: 432 },
    { name: "Writing & Translation", count: 280 },
  ];

  const formatPostedTime = (value: string | Date) => {
    const diffMs = Date.now() - new Date(value).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getBudgetText = (job: ViewListJobResponseType["data"][number]) => {
    if (job.budgetMin === null || job.budgetMax === null) {
      return "Negotiable";
    }

    return `$${job.budgetMin} - $${job.budgetMax}`;
  };

  const updateFilter = (name: "budget" | "time", value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete(name);
    } else {
      params.set(name, value);
    }

    params.set("page", "1");
    router.push(`/find-work?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header role="FREELANCER" />

      <main className="flex-1">
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground font-medium">Find Work</span>
            </nav>
          </div>
        </div>

        <div className="bg-secondary border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-4">
              <h1 className="text-4xl font-bold mb-2">Find Work</h1>
              <p className="text-lg text-muted-foreground">
                Find the perfect project that matches your skills
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Badge variant="outline">📁 Custom Websites</Badge>
              <Badge variant="outline">💻 Web Application</Badge>
              <Link href="#" className="text-primary hover:text-primary/80">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-6 border-b">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={initialBudget}
                  onValueChange={(value) => value && updateFilter("budget", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any budget</SelectItem>
                    <SelectItem value="under-500">Under $500</SelectItem>
                    <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                    <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                    <SelectItem value="5000-plus">$5,000+</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={initialTime}
                  onValueChange={(value) => value && updateFilter("time", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any time</SelectItem>
                    <SelectItem value="today">Posted today</SelectItem>
                    <SelectItem value="last-3-days">Last 3 days</SelectItem>
                    <SelectItem value="last-7-days">Last 7 days</SelectItem>
                    <SelectItem value="last-30-days">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-muted-foreground">
                  {initialKeyword
                    ? `Showing results for "${initialKeyword}"`
                    : pagination.total > 0
                      ? `${pagination.total}+ results`
                      : "No results"}
                </p>
                <Select defaultValue="relevance">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Sort: Relevance</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {jobs.length === 0 ? (
                  <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                    No jobs found.
                  </div>
                ) : (
                  jobs.map((job) => (
                    <Card
                      key={job.id}
                      className={job.featured ? "border-primary bg-secondary/50" : ""}
                    >
                      <CardContent className="p-6">
                        {job.featured && <Badge className="mb-3">Featured</Badge>}
                        <Link
                          href={`/job/${job.slug}`}
                          className="hover:text-primary transition-colors"
                        >
                          <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                        </Link>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="size-3" />
                            Remote
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <DollarSign className="size-3" />
                            {getBudgetText(job)}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Clock className="size-3" />
                            {formatPostedTime(job.createdAt)}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {job.description ?? "No description provided yet."}
                        </p>

                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{getBudgetText(job)}</p>
                            <p className="text-xs text-muted-foreground">
                              {job.budgetType}
                            </p>
                          </div>
                          <Button size="sm" asChild>
                            <Link href={`/job/${job.slug}`}>View details</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <Button variant="outline" className="w-full">
                Load More
              </Button>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Never miss a job</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Get notified when new jobs match your skills
                  </p>
                  <Button className="w-full" size="sm">
                    Set Job Alert
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Trending Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {trendingSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.name}
                      className="flex justify-between text-sm"
                    >
                      <span className="hover:text-primary cursor-pointer">
                        {category.name}
                      </span>
                      <span className="text-muted-foreground">
                        {category.count}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
