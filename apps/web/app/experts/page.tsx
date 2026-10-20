import authServerRequest from "@/apiRequests/auth.server";
import expertProfileServerRequest from "@/apiRequests/expert-profile.server";
import { Header, type UserRole } from "@/components/header";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/shadcn/avatar";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { RoleName, type PublicExpertType } from "@shared/types";
import { ArrowRight, Award, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Verified Experts | Frevia",
  description: "Meet Frevia's active professional review experts.",
};

type SearchParams = Promise<{
  page?: string;
  search?: string;
  expertise?: string;
}>;

function resolveHeaderRole(
  user: Awaited<ReturnType<typeof authServerRequest.getMe>>,
): UserRole {
  const role = user?.roles.find((item) => item.isPrimary)?.name;
  if (role === RoleName.CLIENT) return "CLIENT";
  if (role === RoleName.FREELANCER) return "FREELANCER";
  return "GUEST";
}

function initials(name: string | null) {
  return (name ?? "Expert")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function pageHref(
  page: number,
  filters: { search?: string; expertise?: string },
) {
  const params = new URLSearchParams({ page: String(page) });
  if (filters.search) params.set("search", filters.search);
  if (filters.expertise) params.set("expertise", filters.expertise);
  return `/experts?${params.toString()}`;
}

export default async function ExpertsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = await searchParams;
  const page = Math.max(1, Number(filters.page) || 1);
  const [user, result] = await Promise.all([
    authServerRequest.getMe(),
    expertProfileServerRequest.getExperts({
      page,
      limit: 12,
      search: filters.search,
      expertise: filters.expertise,
    }),
  ]);
  const experts = result?.experts ?? [];
  const pagination = result?.pagination ?? {
    page,
    limit: 12,
    total: 0,
    totalPages: 0,
  };

  return (
    <div className="min-h-dvh bg-background">
      <Header role={resolveHeaderRole(user)} />
      <main>
        <section className="border-b bg-[radial-gradient(circle_at_top_left,rgba(79,174,46,0.16),transparent_42%)]">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:py-20">
            <div className="max-w-3xl">
              <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-[#4fae2e]/30 bg-[#4fae2e]/10 px-3 py-1 text-xs font-semibold text-[#3f9225] dark:text-[#78d45a]">
                <ShieldCheck className="size-4" /> Frevia verified network
              </div>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
                Trusted expertise, visible by design.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                Explore active experts appointed by Frevia to strengthen
                professional review quality and marketplace trust.
              </p>
            </div>

            <form className="mt-10 grid max-w-4xl gap-3 rounded-2xl border bg-background/90 p-3 shadow-sm backdrop-blur sm:grid-cols-[1fr_0.7fr_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="search"
                  defaultValue={filters.search}
                  placeholder="Search by name, title, or bio"
                  className="border-0 pl-9 shadow-none focus-visible:ring-0"
                />
              </div>
              <Input
                name="expertise"
                defaultValue={filters.expertise}
                placeholder="Expertise, e.g. Product strategy"
                className="border-0 shadow-none focus-visible:ring-0"
              />
              <Button type="submit" className="bg-[#4fae2e] hover:bg-[#459928]">
                Find experts
              </Button>
            </form>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#4fae2e]">
                {pagination.total} active expert{pagination.total === 1 ? "" : "s"}
              </p>
              <h2 className="mt-1 text-2xl font-semibold">Meet the network</h2>
            </div>
            {(filters.search || filters.expertise) && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/experts">Clear filters</Link>
              </Button>
            )}
          </div>

          {experts.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {experts.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed px-6 py-20 text-center">
              <Award className="mx-auto size-9 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">No experts found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a broader name or expertise filter.
              </p>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button asChild variant="outline" disabled={pagination.page <= 1}>
                <Link
                  href={pageHref(Math.max(1, pagination.page - 1), filters)}
                  aria-disabled={pagination.page <= 1}
                >
                  Previous
                </Link>
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                asChild
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
              >
                <Link
                  href={pageHref(
                    Math.min(pagination.totalPages, pagination.page + 1),
                    filters,
                  )}
                  aria-disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Link>
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ExpertCard({ expert }: { expert: PublicExpertType }) {
  return (
    <article className="group flex min-h-80 flex-col rounded-2xl border bg-card p-6 transition hover:-translate-y-0.5 hover:border-[#4fae2e]/50 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <Avatar className="size-14 border">
          <AvatarImage src={expert.avatarUrl ?? undefined} />
          <AvatarFallback>{initials(expert.displayName)}</AvatarFallback>
        </Avatar>
        <Badge variant="secondary" className="gap-1 text-[#3f9225]">
          <ShieldCheck className="size-3" /> Verified
        </Badge>
      </div>
      <h3 className="mt-5 text-xl font-semibold">
        {expert.displayName ?? "Frevia Expert"}
      </h3>
      <p className="mt-1 text-sm font-medium text-[#4fae2e]">
        {expert.title ?? "Professional Expert"}
      </p>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
        {expert.bio ?? "This expert is building their professional profile."}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {expert.expertise.slice(0, 4).map((item) => (
          <Badge key={item} variant="outline">
            {item}
          </Badge>
        ))}
      </div>
      <Link
        href={`/experts/${expert.id}`}
        className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-[#4fae2e]"
      >
        View profile
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </article>
  );
}
