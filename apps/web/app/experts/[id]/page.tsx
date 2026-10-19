import authServerRequest from "@/apiRequests/auth.server";
import expertProfileServerRequest from "@/apiRequests/expert-profile.server";
import { Header, type UserRole } from "@/components/header";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/shadcn/avatar";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { RoleName } from "@shared/types";
import {
  ArrowLeft,
  Award,
  BriefcaseBusiness,
  ExternalLink,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

function resolveHeaderRole(
  user: Awaited<ReturnType<typeof authServerRequest.getMe>>,
): UserRole {
  const role = user?.roles.find((item) => item.isPrimary)?.name;
  if (role === RoleName.CLIENT) return "CLIENT";
  if (role === RoleName.FREELANCER) return "FREELANCER";
  return "GUEST";
}

export default async function ExpertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expertId = Number(id);
  if (!Number.isInteger(expertId) || expertId <= 0) notFound();

  const [user, expert] = await Promise.all([
    authServerRequest.getMe(),
    expertProfileServerRequest.getExpert(expertId),
  ]);
  if (!expert) notFound();

  const fallback = (expert.displayName ?? "Expert")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-dvh bg-muted/20">
      <Header role={resolveHeaderRole(user)} />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <Button asChild variant="ghost" className="mb-6 -ml-3">
          <Link href="/experts">
            <ArrowLeft className="size-4" /> Back to experts
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="rounded-2xl border bg-card p-7 shadow-sm sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <Avatar className="size-24 border-2 border-[#4fae2e]/30">
                <AvatarImage src={expert.avatarUrl ?? undefined} />
                <AvatarFallback className="text-xl">{fallback}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <Badge variant="secondary" className="gap-1 text-[#3f9225]">
                  <ShieldCheck className="size-3" /> Frevia verified expert
                </Badge>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {expert.displayName ?? "Frevia Expert"}
                </h1>
                <p className="mt-2 text-lg font-medium text-[#4fae2e]">
                  {expert.title ?? "Professional Expert"}
                </p>
              </div>
            </div>

            <section className="mt-9 border-t pt-8">
              <h2 className="text-lg font-semibold">Professional overview</h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">
                {expert.bio ?? "No professional overview has been added yet."}
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-semibold">Areas of expertise</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {expert.expertise.length ? (
                  expert.expertise.map((item) => (
                    <Badge key={item} variant="outline" className="px-3 py-1">
                      {item}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Not provided.</p>
                )}
              </div>
            </section>
          </article>

          <aside className="space-y-5">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="font-semibold">Expert credentials</h2>
              <dl className="mt-5 space-y-5 text-sm">
                <div className="flex gap-3">
                  <BriefcaseBusiness className="mt-0.5 size-4 text-[#4fae2e]" />
                  <div>
                    <dt className="text-muted-foreground">Experience</dt>
                    <dd className="mt-1 font-medium">
                      {expert.yearsOfExperience} years
                    </dd>
                  </div>
                </div>
                <CredentialList
                  icon={<GraduationCap className="size-4" />}
                  label="Education"
                  items={expert.education}
                />
                <CredentialList
                  icon={<Award className="size-4" />}
                  label="Certifications"
                  items={expert.certifications}
                />
              </dl>
            </div>

            {expert.website && (
              <Button asChild className="w-full bg-[#4fae2e] hover:bg-[#459928]">
                <a href={expert.website} target="_blank" rel="noreferrer">
                  Visit professional website <ExternalLink className="size-4" />
                </a>
              </Button>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function CredentialList({
  icon,
  label,
  items,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-[#4fae2e]">{icon}</span>
      <div>
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="mt-1 space-y-1 font-medium">
          {items.length
            ? items.map((item) => <p key={item}>{item}</p>)
            : "Not provided"}
        </dd>
      </div>
    </div>
  );
}
