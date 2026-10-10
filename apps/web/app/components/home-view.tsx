import Image from "next/image";
import Link from "next/link";
import { Briefcase, MessageSquare, Search } from "lucide-react";

import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import { Button } from "@repo/ui/components/shadcn/button";
import { RoleName, type GetMeResType } from "@shared/types";

type HomeViewProps = {
  user: GetMeResType | null;
};

function resolveHeaderRole(user: GetMeResType | null): UserRole {
  if (!user) return "GUEST";

  const primaryRole =
    user.roles.find((role) => role.isPrimary) ?? user.roles[0];

  if (primaryRole?.name === RoleName.CLIENT) return "CLIENT";
  if (primaryRole?.name === RoleName.FREELANCER) return "FREELANCER";

  return "FREELANCER";
}

export function HomeView({ user }: HomeViewProps) {
  const role = resolveHeaderRole(user);
  const displayName = user?.profile?.displayName ?? "there";
  const isClient = role === "CLIENT";
  const primaryHref = isClient ? "/projects" : "/find-work";
  const primaryLabel = isClient ? "Go to My Jobs" : "Find Work";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header role={role} />

      <main className="flex-1">
        <section className="border-b border-border bg-[#eaf8df] dark:bg-[#12331f]">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-20">
            <div className="max-w-xl space-y-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/Logo.png"
                  alt="Frevia"
                  width={40}
                  height={40}
                  className="size-10 object-contain"
                  priority
                />
                <span className="text-2xl font-bold text-[#4fae2e]">Frevia</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Welcome back, {displayName}
              </h1>
              <p className="text-base text-muted-foreground sm:text-lg">
                Connect talent with endless opportunities. Find projects, hire
                freelancers, or join the community forum.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg">
                  <Link href={primaryHref}>{primaryLabel}</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/forum">Visit Forum</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-foreground">
            Where do you want to go?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Jump into the main areas of Frevia.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/find-work"
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-[#4fae2e]/50 hover:bg-accent/40"
            >
              <Search className="size-6 text-[#4fae2e]" />
              <h3 className="mt-4 font-semibold text-foreground group-hover:text-[#4fae2e]">
                Find Work
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse open projects and apply as a freelancer.
              </p>
            </Link>

            <Link
              href="/projects"
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-[#4fae2e]/50 hover:bg-accent/40"
            >
              <Briefcase className="size-6 text-[#4fae2e]" />
              <h3 className="mt-4 font-semibold text-foreground group-hover:text-[#4fae2e]">
                My Jobs
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Post jobs and manage your client projects.
              </p>
            </Link>

            <Link
              href="/forum"
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-[#4fae2e]/50 hover:bg-accent/40 sm:col-span-2 lg:col-span-1"
            >
              <MessageSquare className="size-6 text-[#4fae2e]" />
              <h3 className="mt-4 font-semibold text-foreground group-hover:text-[#4fae2e]">
                Forum
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask questions and share tips with the community.
              </p>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
