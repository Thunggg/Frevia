"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { accountProfileApi } from "@/apiRequests/account-profile";
import { Building2, ExternalLink, Globe2, Loader2 } from "@/components/icons";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@repo/ui/components/shadcn/sheet";

export function ClientProfileSheet({
  userId,
  open,
  onOpenChange,
}: {
  userId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("clientProfilePublic");
  const common = useTranslations("common");
  const role = useTranslations("roleName");
  const socialLabel = useTranslations("socialPlatform");
  const query = useQuery({
    queryKey: ["client-profile", userId],
    queryFn: async () => {
      if (userId === null) throw new Error("Missing client ID");
      return (await accountProfileApi.getClientProfile(userId)).data;
    },
    enabled: open && userId !== null,
    staleTime: 30_000,
  });
  const profile = query.data;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        closeLabel={common("close")}
        className="flex w-full flex-col gap-0 overflow-hidden border-l border-border bg-background p-0 font-sans sm:max-w-xl md:max-w-2xl"
      >
        <SheetHeader className="border-b border-border px-6 py-5 pr-12 text-left">
          <SheetTitle>{t("breadcrumb")}</SheetTitle>
          <SheetDescription>{t("companyDetails")}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {query.isPending ? (
            <div role="status" className="flex justify-center p-16">
              <Loader2 className="size-6 animate-spin text-[#0069D3]" />
              <span className="sr-only">{t("breadcrumb")}</span>
            </div>
          ) : query.isError || !profile ? (
            <div role="alert" className="space-y-4 p-8 text-center">
              <p className="text-sm text-muted-foreground">{t("loadFailed")}</p>
              <Button variant="outline" onClick={() => void query.refetch()}>
                {t("tryAgain")}
              </Button>
            </div>
          ) : (
            <div className="space-y-6 p-6">
              <section className="space-y-4 rounded-2xl border border-border p-5">
                <h2 className="text-base font-semibold">
                  {t("clientContact")}
                </h2>
                <div className="flex items-center gap-3">
                  <Avatar className="size-16">
                    <AvatarImage
                      src={profile.avatarUrl ?? undefined}
                      alt={profile.displayName ?? role("CLIENT")}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                      {profile.displayName?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {profile.displayName ?? role("CLIENT")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t("memberSince", {
                        year: new Date(profile.createdAt).getFullYear(),
                      })}
                    </p>
                  </div>
                </div>
                {profile.bio && (
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                    {profile.bio}
                  </p>
                )}
              </section>
              <section className="space-y-4 rounded-2xl border border-border p-5">
                <div className="flex items-center gap-3">
                  <Building2 className="size-5 shrink-0 text-[#0069D3]" />
                  <h2 className="break-words text-lg font-semibold">
                    {profile.clientProfile.companyName ||
                      t("companyNameMissing")}
                  </h2>
                </div>
                <h3 className="text-sm font-semibold">{t("aboutCompany")}</h3>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                  {profile.clientProfile.companyDescription ||
                    t("noDescription")}
                </p>
                {profile.clientProfile.website ? (
                  <a
                    href={profile.clientProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[#0069D3]"
                  >
                    <Globe2 className="size-4" />
                    {t("website")}
                    <ExternalLink className="size-3.5" />
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("websiteMissing")}
                  </p>
                )}
              </section>
              <section className="rounded-2xl border border-border p-5">
                <h2 className="text-base font-semibold">{t("socialLinks")}</h2>
                {profile.socialLinks.length ? (
                  <ul className="mt-3 divide-y divide-border">
                    {profile.socialLinks.map((link) => (
                      <li key={link.id}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 py-3 text-sm text-[#0069D3]"
                        >
                          {socialLabel(link.platform)}
                          <ExternalLink className="size-3.5" />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t("noSocialLinks")}
                  </p>
                )}
              </section>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
