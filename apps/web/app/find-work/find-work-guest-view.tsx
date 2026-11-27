"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@repo/ui/components/shadcn/pagination";
import type {
  JobCategoryBrowseItemType,
  ViewListJobResponseType,
} from "@shared/types";
import { Search, Briefcase, Sparkles, Filter, X } from "lucide-react";
import { JobCard } from "../(freelancer)/_components/job-card";

type FindWorkGuestViewProps = {
  initialData: ViewListJobResponseType | null;
  categories: JobCategoryBrowseItemType[];
  currentKeyword: string;
  currentCategory: string;
  currentBudget: string;
  currentSort: string;
  currentPage: number;
};

export function FindWorkGuestView({
  initialData,
  categories,
  currentKeyword,
  currentCategory,
  currentBudget,
  currentSort,
  currentPage,
}: FindWorkGuestViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(currentKeyword);
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [selectedBudget, setSelectedBudget] = useState(currentBudget);
  const [selectedSort, setSelectedSort] = useState(currentSort);

  const jobs = initialData?.data ?? [];
  const pagination = initialData?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  const handleFilter = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val) {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    });
    params.set("page", "1");

    startTransition(() => {
      router.push(`/find-work?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilter({
      keyword: search.trim(),
      category: selectedCategory,
      budget: selectedBudget,
      sort: selectedSort,
    });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    startTransition(() => {
      router.push(`/find-work?${params.toString()}`);
    });
  };

  const activeCategoryObj = categories.find((c) => c.slug === currentCategory);

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 dark:bg-zinc-950 font-sans">
      <Header role="GUEST" />

      <main className="flex-1 pb-16">
        {/* Hero Search Banner */}
        <div className="border-b border-border/60 bg-white py-10 dark:bg-zinc-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-600/20 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0069D3] dark:bg-blue-950/40 dark:text-blue-400">
                <Sparkles className="size-3.5" />
                Cơ hội việc làm công khai
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Tìm kiếm việc làm chất lượng cao
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Khám phá hàng trăm công việc phù hợp với kỹ năng của bạn, bảo vệ 100% qua ký quỹ Escrow.
              </p>
            </div>

            {/* Search Bar Form */}
            <form onSubmit={handleSearchSubmit} className="mt-6">
              <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-background p-2.5 shadow-xs sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm theo tiêu đề công việc..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 border-0 bg-transparent pl-10 pr-4 text-xs sm:text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                <div className="h-6 w-px bg-border hidden sm:block" />

                {/* Category select */}
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    handleFilter({ category: e.target.value });
                  }}
                  className="h-10 rounded-lg border-0 bg-transparent px-3 text-xs sm:text-sm font-medium text-foreground focus:outline-hidden"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name} ({cat.jobCount})
                    </option>
                  ))}
                </select>

                <div className="h-6 w-px bg-border hidden sm:block" />

                {/* Budget range */}
                <select
                  value={selectedBudget}
                  onChange={(e) => {
                    setSelectedBudget(e.target.value);
                    handleFilter({ budget: e.target.value });
                  }}
                  className="h-10 rounded-lg border-0 bg-transparent px-3 text-xs sm:text-sm font-medium text-foreground focus:outline-hidden"
                >
                  <option value="">Mọi mức ngân sách</option>
                  <option value="under-100">Dưới $100</option>
                  <option value="100-500">$100 - $500</option>
                  <option value="500-2000">$500 - $2,000</option>
                  <option value="over-2000">Trên $2,000</option>
                </select>

                <Button
                  type="submit"
                  className="h-10 rounded-xl bg-[#0069D3] hover:bg-blue-600 text-white px-5 font-semibold text-xs shadow-xs"
                >
                  Tìm việc
                </Button>
              </div>
            </form>

            {/* Active Category Filter Pill (nếu có) */}
            {currentCategory && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Đang lọc theo:</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-[#0069D3] dark:bg-blue-950/50 dark:border-blue-900 dark:text-blue-300">
                  <Filter className="size-3" />
                  {activeCategoryObj?.name || currentCategory}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("");
                      handleFilter({ category: "" });
                    }}
                    className="ml-1 rounded-full p-0.5 hover:bg-blue-200/50"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content area: Job Cards + Sidebar */}
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Main Job List */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between pb-2">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Hiển thị <span className="font-bold text-foreground">{total}</span> việc làm
                </p>

                {/* Sắp xếp */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline">Sắp xếp:</span>
                  <select
                    value={selectedSort}
                    onChange={(e) => {
                      setSelectedSort(e.target.value);
                      handleFilter({ sort: e.target.value });
                    }}
                    className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="budget-high">Ngân sách cao nhất</option>
                    <option value="budget-low">Ngân sách thấp nhất</option>
                  </select>
                </div>
              </div>

              {jobs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center dark:bg-zinc-900">
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-blue-50 text-[#0069D3] dark:bg-blue-950/50 dark:text-blue-400">
                    <Briefcase className="size-6" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    Không tìm thấy công việc phù hợp
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Hãy thử tìm kiếm với từ khóa khác hoặc bỏ chọn bộ lọc danh mục.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 rounded-full text-xs"
                    onClick={() => {
                      setSearch("");
                      setSelectedCategory("");
                      setSelectedBudget("");
                      router.push("/find-work");
                    }}
                  >
                    Xóa tất cả bộ lọc
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job, idx) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      index={idx}
                      jobBaseUrl="/job"
                      filterBasePath="/find-work"
                      canBookmark={false}
                      showApplyButton={true}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 ? (
                <div className="pt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) handlePageChange(currentPage - 1);
                          }}
                          className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href="#"
                                isActive={pageNum === currentPage}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePageChange(pageNum);
                                }}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) handlePageChange(currentPage + 1);
                          }}
                          className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              ) : null}
            </div>

            {/* Sidebar Categories & Register CTA */}
            <div className="w-full lg:w-80 space-y-6">
              {/* Register Callout Card */}
              <div className="rounded-2xl border border-blue-600/20 bg-linear-to-b from-blue-50/70 to-white p-6 shadow-xs dark:from-blue-950/20 dark:to-zinc-900">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0069D3] dark:text-blue-400">
                  Dành cho Freelancer
                </span>
                <h4 className="mt-2 text-base font-bold text-foreground">
                  Muốn ứng tuyển vào các dự án này?
                </h4>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Tạo hồ sơ freelancer chuyên nghiệp, kết nối trực tiếp với khách hàng và nhận thanh toán an toàn.
                </p>
                <div className="mt-5 space-y-2">
                  <Button
                    asChild
                    className="w-full rounded-xl bg-[#0069D3] hover:bg-blue-600 text-white font-semibold text-xs shadow-xs"
                  >
                    <Link href="/register">Đăng ký làm Freelancer</Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full rounded-xl text-xs font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <Link href="/login">Đã có tài khoản? Đăng nhập</Link>
                  </Button>
                </div>
              </div>

              {/* Category Quick Filter List */}
              <div className="rounded-2xl border border-border/80 bg-white p-5 dark:bg-zinc-900">
                <h4 className="text-sm font-bold text-foreground mb-3">
                  Danh mục việc làm
                </h4>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.slug);
                        handleFilter({ category: cat.slug });
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                        selectedCategory === cat.slug
                          ? "bg-blue-50 text-[#0069D3] font-bold dark:bg-blue-950/40 dark:text-blue-400"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-foreground dark:text-zinc-400 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-muted-foreground dark:bg-zinc-800 ml-2">
                        {cat.jobCount}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
