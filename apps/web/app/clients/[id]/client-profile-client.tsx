"use client";

import { accountProfileApi } from "@/apiRequests/account-profile";
import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import { ApiFail } from "@/lib/http";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import type { ClientProfileDetailType } from "@shared/types";
import {
  Building2,
  ExternalLink,
  Globe2,
  Link2,
  Loader2,
  Pencil,
  RefreshCw,
} from "@/components/icons";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Props = {
  userId: number;
  currentUserId: number | null;
  headerRole: UserRole;
};

export function ClientProfileClient({
  userId,
  currentUserId,
  headerRole,
}: Props) {
  const [profile, setProfile] = useState<ClientProfileDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await accountProfileApi.getClientProfile(userId);
      setProfile(response.data);
    } catch (cause) {
      setError(
        cause instanceof ApiFail
          ? cause.message
          : "Couldn't load client profile.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const companyName =
    profile?.clientProfile.companyName ??
    profile?.displayName ??
    "Client";

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={headerRole} />

      <main className="flex-1">
        <section className="border-b border-[#0069D3]/15 bg-[#D0E1F8]/20 dark:border-white/10 dark:bg-zinc-950">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="transition-colors hover:text-[#0069D3]">
                Home
              </Link>
              <span className="mx-2 text-foreground/35">/</span>
              <span className="font-medium text-foreground">Client profile</span>
            </nav>
            {!loading && profile ? (
              <>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {companyName}
                </h1>
                <p className="mt-2 text-base text-foreground/70 dark:text-foreground/75">
                  Member since {new Date(profile.createdAt).getFullYear()}
                </p>
              </>
            ) : (
              <>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Client profile
                </h1>
                <p className="mt-2 text-base text-foreground/70">
                  Company details on Frevia.
                </p>
              </>
            )}
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="size-8 animate-spin text-[#0069D3]" />
            </div>
          ) : error || !profile ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#D0E1F8]/50 text-[#0069D3] dark:bg-[#0069D3]/15">
                <Building2 className="size-7" />
              </div>
              <h2 className="text-lg font-medium text-foreground">
                Client profile unavailable
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {error || "Couldn't load this profile. Try again."}
              </p>
              <Button
                className="mt-6 rounded-full bg-[#0069D3] text-white hover:bg-[#005bb8]"
                onClick={() => void load()}
              >
                <RefreshCw className="mr-2 size-4" />
                Try again
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border border-border">
                <div
                  className="h-40 bg-zinc-900 bg-cover bg-center"
                  style={
                    profile.coverUrl
                      ? { backgroundImage: `url(${profile.coverUrl})` }
                      : undefined
                  }
                />
                <div className="relative px-5 pb-6 pt-0 sm:px-7">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                      <Avatar className="-mt-12 size-24 border-4 border-background sm:size-28">
                        <AvatarImage src={profile.avatarUrl ?? undefined} />
                        <AvatarFallback className="bg-[#D0E1F8]/60 text-[#0069D3] dark:bg-[#0069D3]/20">
                          <Building2 />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Badge className="border-transparent bg-[#D0E1F8] text-[#0069D3] dark:bg-[#0069D3]/20 dark:text-[#D0E1F8]">
                          Client
                        </Badge>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                          {companyName}
                        </h2>
                      </div>
                    </div>
                    {currentUserId === profile.userId ? (
                      <Button
                        asChild
                        className="rounded-full bg-[#0069D3] text-white hover:bg-[#005bb8]"
                      >
                        <Link href="/client/profile">
                          <Pencil className="mr-2 size-4" />
                          Edit company
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-10 lg:grid-cols-12">
                <section className="lg:col-span-8">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    About the company
                  </h3>
                  <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">
                    {profile.clientProfile.companyDescription ||
                      profile.bio ||
                      "No company description added yet."}
                  </p>
                </section>

                <aside className="space-y-8 lg:col-span-4">
                  <div className="rounded-2xl border border-border p-5 sm:p-6">
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      Company details
                    </h3>
                    <div className="mt-4">
                      {profile.clientProfile.website ? (
                        <a
                          className="flex items-center gap-2 text-[#0069D3] transition-colors hover:text-[#005bb8]"
                          href={profile.clientProfile.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Globe2 className="size-4" />
                          Website
                          <ExternalLink className="ml-auto size-4" />
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Website not provided.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border p-5 sm:p-6">
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      Social links
                    </h3>
                    <ul className="mt-4 divide-y divide-border">
                      {profile.socialLinks.length ? (
                        profile.socialLinks.map((social) => (
                          <li key={social.id}>
                            <a
                              className="flex items-center gap-2 py-2.5 text-sm text-[#0069D3] transition-colors hover:text-[#005bb8]"
                              href={social.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Link2 className="size-4" />
                              {social.platform}
                              <ExternalLink className="ml-auto size-3" />
                            </a>
                          </li>
                        ))
                      ) : (
                        <li className="py-2 text-sm text-muted-foreground">
                          No social links available.
                        </li>
                      )}
                    </ul>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
