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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import {
  Building2,
  ExternalLink,
  Globe2,
  Link2,
  Loader2,
  Pencil,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ClientProfileDetailType } from "@shared/types";

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
          : "Unable to load client profile.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => void load(), [load]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header role={headerRole} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : error || !profile ? (
          <Card>
            <CardContent className="py-20 text-center">
              <Building2 className="mx-auto size-12 text-muted-foreground" />
              <h1 className="mt-4 text-2xl font-bold">
                Client profile unavailable
              </h1>
              <p className="mt-2 text-muted-foreground">{error}</p>
              <Button className="mt-5" onClick={() => void load()}>
                <RefreshCw /> Try again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="overflow-hidden py-0">
              <div
                className="h-44 bg-gradient-to-r from-emerald-800 to-lime-500 bg-cover bg-center"
                style={
                  profile.coverUrl
                    ? { backgroundImage: `url(${profile.coverUrl})` }
                    : undefined
                }
              />
              <CardContent className="relative px-7 pb-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <Avatar className="-mt-14 size-28 border-4 border-background">
                      <AvatarImage src={profile.avatarUrl ?? undefined} />
                      <AvatarFallback>
                        <Building2 />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Badge variant="secondary">Client</Badge>
                      <h1 className="mt-2 text-3xl font-bold">
                        {profile.clientProfile.companyName ??
                          profile.displayName ??
                          "Client"}
                      </h1>
                      <p className="mt-1 text-muted-foreground">
                        Member since {new Date(profile.createdAt).getFullYear()}
                      </p>
                    </div>
                  </div>
                  {currentUserId === profile.userId && (
                    <Button asChild>
                      <Link href="/account-profile">
                        <Pencil /> Edit company
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
              <Card>
                <CardHeader>
                  <CardTitle>About the company</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap leading-7 text-muted-foreground">
                    {profile.clientProfile.companyDescription ||
                      profile.bio ||
                      "No company description added yet."}
                  </p>
                </CardContent>
              </Card>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Company details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profile.clientProfile.website ? (
                      <a
                        className="flex items-center gap-2 text-primary hover:underline"
                        href={profile.clientProfile.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Globe2 className="size-4" /> Website{" "}
                        <ExternalLink className="ml-auto size-4" />
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Website not provided.
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Social links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {profile.socialLinks.length ? (
                      profile.socialLinks.map((social) => (
                        <a
                          key={social.id}
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                          href={social.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Link2 className="size-4" /> {social.platform}
                          <ExternalLink className="ml-auto size-3" />
                        </a>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No social links available.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
