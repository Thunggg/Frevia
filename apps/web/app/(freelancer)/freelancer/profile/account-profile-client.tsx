"use client";

import { FreelancerProfileSheet } from "@/app/(client)/_components/freelancer-profile-sheet";
import { LockKeyhole } from "lucide-react";

import { accountProfileApi } from "@/apiRequests/account-profile";
import { useActionPermission } from "@/hooks/use-action-permission";
import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import {
  Eye,
  EyeOff,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "@/components/icons";
import { ApiFail } from "@/lib/http";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/shadcn/alert-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/shadcn/tabs";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  SocialPlatform,
  VerificationStatus,
  type DiscoverFreelancerType,
  type FavoriteFreelancerType,
  type IdentityVerificationStatusType,
  type SocialLinkType,
  type SocialPlatformType,
} from "@shared/types";
import {
  BriefcaseBusiness,
  Building2,
  Heart,
  ShieldCheck,
  Star,
  UserCheck,
  UserMinus,
  UserPlus,
  UserRound,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FreelancerProfessionalSettings } from "./freelancer-professional-settings";
import { GeneralSettings } from "./general-settings";
import { IdentityVerificationForm } from "./identity-verification-form";
import { ReviewManager } from "./review-manager";

type Props = {
  userId: number | null;
  profileId: number | null;
  headerRole: UserRole;
  embedded?: boolean;
};

const DOCUMENT_TYPE_KEYS = [
  "ID_CARD",
  "PASSPORT",
  "DRIVER_LICENSE",
  "RESIDENCE_PERMIT",
  "OTHER",
] as const;

const VERIFICATION_STATUS_KEYS = ["PENDING", "APPROVED", "REJECTED"] as const;

const SOCIAL_PLATFORM_KEYS = [
  "GITHUB",
  "LINKEDIN",
  "TWITTER",
  "FACEBOOK",
  "INSTAGRAM",
  "YOUTUBE",
  "WEBSITE",
  "OTHER",
] as const;

const AVAILABILITY_STATUS_KEYS = [
  "AVAILABLE",
  "BUSY",
  "AWAY",
  "OFFLINE",
] as const;

/**
 * Lỗi từ ApiFail đi qua proxy BFF đã được dịch sẵn (error.details[].message
 * chứa key i18n), nên GIỮ NGUYÊN.
 *
 * Mọi lỗi khác (ví dụ TypeError "Failed to fetch" khi mất mạng) là text tiếng
 * Anh do runtime sinh ra, không phải key dịch — trả về fallback đã dịch thay
 * vì để lộ tiếng Anh cho người dùng.
 */
function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiFail) {
    return error.response.error.details?.[0]?.message ?? error.message;
  }
  return fallback;
}

function FreelancerListSkeleton({ label }: { label: string }) {
  return (
    <div
      className="mt-6 grid gap-4 lg:grid-cols-2"
      aria-label={label}
      aria-busy="true"
    >
      {["first", "second"].map((item) => (
        <div key={item} className="rounded-xl border border-border p-5">
          <div className="flex items-start gap-3.5">
            <Skeleton className="size-14 shrink-0 rounded-full sm:size-16" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-48 max-w-full" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>
          <div className="mt-5 flex gap-2 border-t border-border pt-4">
            <Skeleton className="h-8 flex-1 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

const profileTabClassName =
  "h-auto flex-1 gap-2 rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap text-muted-foreground transition-all duration-200 hover:bg-white/60 hover:text-foreground dark:hover:bg-zinc-800/60 sm:text-sm data-[state=active]:bg-white data-[state=active]:text-[#0069D3] data-[state=active]:font-semibold data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-blue-200 dark:data-[state=active]:border-transparent";

export function AccountProfileClient({
  userId,
  profileId,
  headerRole,
  embedded = false,
}: Props) {
  const searchParams = useSearchParams();
  const t = useTranslations("accountProfile");
  const tSettings = useTranslations("clientProfileSettings");
  const tVerification = useTranslations("verificationStatus");
  const tDocument = useTranslations("documentType");
  const tPlatform = useTranslations("socialPlatform");
  const tAvailability = useTranslations("freelancerProfile.availability");
  const tCommon = useTranslations("common");
  const tRole = useTranslations("roleName");
  const format = useFormatter();

  const { can } = useActionPermission();
  const canUpdateClientProfile = can("PUT", "/api/clients/me/profile");
  const canViewFavorites = can("GET", "/api/favorites/freelancers");
  const canRemoveFavorite = can(
    "DELETE",
    "/api/favorites/freelancers/:freelancerId",
  );
  const canGetFollowing = can("GET", "/api/following/freelancers");
  const canDiscoverFreelancers = can(
    "GET",
    "/api/following/freelancers/discover",
  );
  const canFollowFreelancer = can(
    "POST",
    "/api/following/freelancers/:freelancerId",
  );
  const canUnfollowFreelancer = can(
    "DELETE",
    "/api/following/freelancers/:freelancerId",
  );
  const canViewFollowingTab = canGetFollowing || canDiscoverFreelancers;
  const canUploadIdentityDoc = can(
    "POST",
    "/api/identity-verifications/documents",
  );
  const canViewIdentityStatus = can(
    "GET",
    "/api/identity-verifications/status",
  );
  const canDownloadIdentityDoc = can(
    "GET",
    "/api/identity-verifications/documents/:id/file",
  );
  const canAiCheck = can("POST", "/api/identity-verifications/ai-check");
  const canLivenessPose = can(
    "POST",
    "/api/identity-verifications/liveness-pose",
  );
  const canViewIdentityTab =
    canViewIdentityStatus ||
    canUploadIdentityDoc ||
    canAiCheck ||
    canLivenessPose;
  const canViewReviews = can("GET", "/api/reviews/contracts/:contractId");
  const canViewSocialLinks = can("GET", "/api/social-links");
  const canAddSocialLink = can("POST", "/api/social-links");
  const canDeleteSocialLink = can("DELETE", "/api/social-links/:id");

  const toMessage = useCallback(
    (error: unknown) => errorMessage(error, tSettings("somethingWentWrong")),
    [tSettings],
  );

  const documentTypeLabel = (value: string) =>
    (DOCUMENT_TYPE_KEYS as readonly string[]).includes(value)
      ? tDocument(value)
      : value;

  const verificationStatusLabel = (value: string | null | undefined) =>
    value && (VERIFICATION_STATUS_KEYS as readonly string[]).includes(value)
      ? tVerification(value)
      : tVerification("NOT_SUBMITTED");

  const platformLabel = (value: string) =>
    (SOCIAL_PLATFORM_KEYS as readonly string[]).includes(value)
      ? tPlatform(value)
      : value;

  const availabilityLabel = (value: string) =>
    (AVAILABILITY_STATUS_KEYS as readonly string[]).includes(value)
      ? tAvailability(value)
      : value;

  const [identity, setIdentity] =
    useState<IdentityVerificationStatusType | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinkType[]>([]);
  const [favorites, setFavorites] = useState<FavoriteFreelancerType[]>([]);
  const [freelancers, setFreelancers] = useState<DiscoverFreelancerType[]>([]);
  const [freelancersLoading, setFreelancersLoading] = useState(false);
  const [freelancersError, setFreelancersError] = useState<string | null>(null);
  const [freelancerQuery, setFreelancerQuery] = useState("");
  const [freelancerView, setFreelancerView] = useState<"all" | "following">(
    "all",
  );
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [platform, setPlatform] = useState<SocialPlatformType>(
    SocialPlatform.LINKEDIN,
  );
  const [socialUrl, setSocialUrl] = useState("");

  const load = useCallback(async () => {
    if (!userId || headerRole === "GUEST") return;
    setLoading(true);
    try {
      const common = canViewSocialLinks
        ? accountProfileApi.getSocialLinks()
        : Promise.resolve({ success: true, data: [] as SocialLinkType[] });
      if (headerRole === "FREELANCER") {
        const [identityResponse, linksResponse] = await Promise.all([
          canViewIdentityStatus
            ? accountProfileApi.getIdentityStatus()
            : Promise.resolve(null),
          common,
        ]);
        setIdentity(identityResponse?.data ?? null);
        setSocialLinks(linksResponse.data);
      } else {
        const [profileResponse, linksResponse, favoritesResponse] =
          await Promise.all([
            accountProfileApi.getClientProfile(userId),
            common,
            canViewFavorites
              ? accountProfileApi.getFavorites()
              : Promise.resolve({
                  success: true,
                  data: [] as FavoriteFreelancerType[],
                }),
          ]);
        const profile = profileResponse.data;
        setCompanyName(profile.clientProfile.companyName ?? "");
        setCompanyDescription(profile.clientProfile.companyDescription ?? "");
        setWebsite(profile.clientProfile.website ?? "");
        setSocialLinks(linksResponse.data);
        setFavorites(favoritesResponse.data);
      }
    } catch (error) {
      toastError({ message: toMessage(error) });
    } finally {
      setLoading(false);
    }
  }, [
    headerRole,
    userId,
    toMessage,
    canViewFavorites,
    canViewIdentityStatus,
    canViewSocialLinks,
  ]);

  const loadFreelancers = useCallback(async () => {
    if (!canDiscoverFreelancers) {
      setFreelancers([]);
      return;
    }
    setFreelancersLoading(true);
    setFreelancersError(null);
    try {
      const response = await accountProfileApi.discoverFreelancers();
      setFreelancers(response.data);
    } catch (error) {
      setFreelancersError(toMessage(error));
    } finally {
      setFreelancersLoading(false);
    }
  }, [toMessage, canDiscoverFreelancers]);

  useEffect(() => void load(), [load]);

  useEffect(() => {
    if (headerRole === "CLIENT" && userId) {
      void loadFreelancers();
    }
  }, [headerRole, loadFreelancers, userId]);

  const addSocialLink = async (event: FormEvent) => {
    event.preventDefault();
    setPending("social");
    try {
      const response = await accountProfileApi.addSocialLink({
        platform,
        url: socialUrl,
      });
      setSocialLinks((current) => [...current, response.data]);
      setSocialUrl("");
      toastSuccess({ message: tSettings("socialLinkAdded") });
    } catch (error) {
      toastError({ message: toMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const deleteSocialLink = async (link: SocialLinkType) => {
    setPending(`social-${link.id}`);
    try {
      await accountProfileApi.deleteSocialLink(link.id);
      setSocialLinks((current) =>
        current.filter((item) => item.id !== link.id),
      );
      toastSuccess({ message: tSettings("socialLinkRemoved") });
    } catch (error) {
      toastError({ message: toMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const unfollowFreelancer = async (freelancerId: number) => {
    if (!canUnfollowFreelancer) return;
    setPending(`following-${freelancerId}`);
    try {
      await accountProfileApi.unfollowFreelancer(freelancerId);
      setFreelancers((current) =>
        current.map((item) =>
          item.freelancerId === freelancerId
            ? { ...item, isFollowing: false }
            : item,
        ),
      );
      toastSuccess({ message: tSettings("unfollowed") });
    } catch (error) {
      toastError({ message: toMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const removeFavorite = async (freelancerId: number) => {
    if (!canRemoveFavorite) return;
    setPending(`favorite-${freelancerId}`);
    try {
      await accountProfileApi.removeFavorite(freelancerId);
      setFavorites((current) =>
        current.filter((item) => item.freelancerId !== freelancerId),
      );
      toastSuccess({ message: tSettings("favoriteRemoved") });
    } catch (error) {
      toastError({ message: toMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const followFreelancer = async (freelancer: DiscoverFreelancerType) => {
    if (!canFollowFreelancer) return;
    setPending(`following-${freelancer.freelancerId}`);
    try {
      await accountProfileApi.followFreelancer(freelancer.freelancerId);
      setFreelancers((current) =>
        current.map((item) =>
          item.freelancerId === freelancer.freelancerId
            ? { ...item, isFollowing: true }
            : item,
        ),
      );
      toastSuccess({ message: tSettings("followed") });
    } catch (error) {
      toastError({ message: toMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const saveCompanyProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!canUpdateClientProfile) return;
    setPending("company");
    try {
      const response = await accountProfileApi.updateClientProfile({
        companyName,
        companyDescription,
        website,
      });
      toastSuccess({ message: response.data.message });
    } catch (error) {
      toastError({ message: toMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const router = useRouter();
  const [selectedFreelancerProfileId, setSelectedFreelancerProfileId] =
    useState<number | null>(null);
  const requestedTab = searchParams.get("tab");
  const [identityVisible, setIdentityVisible] = useState(false);
  useEffect(() => {
    setIdentityVisible(false);
  }, [requestedTab]);
  const normalizedFreelancerQuery = freelancerQuery.trim().toLowerCase();
  const followingCount = freelancers.filter(
    (freelancer) => freelancer.isFollowing,
  ).length;
  const visibleFreelancers = freelancers.filter(
    (freelancer) => freelancerView === "all" || freelancer.isFollowing,
  );
  const filteredFreelancers = normalizedFreelancerQuery
    ? visibleFreelancers.filter((freelancer) => {
        const searchableText = [
          freelancer.profile.displayName,
          freelancer.profile.freelancerProfile.title,
          ...freelancer.profile.freelancerProfile.skills.map(
            (skill) => skill.skill.name,
          ),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchableText.includes(normalizedFreelancerQuery);
      })
    : visibleFreelancers;
  const allowedTabs =
    headerRole === "CLIENT"
      ? [
          "general",
          "company",
          "social",
          ...(canViewReviews ? ["reviews"] : []),
          "following",
          "favorites",
        ]
      : [
          ...(profileId ? ["professional"] : []),
          "general",
          "identity",
          "social",
          ...(canViewReviews ? ["reviews"] : []),
        ];
  const defaultTab =
    requestedTab && allowedTabs.includes(requestedTab)
      ? requestedTab
      : "general";

  return (
    <div
      className={`flex flex-col bg-background font-sans ${
        embedded ? "min-h-0 flex-1 overflow-hidden" : "min-h-dvh"
      }`}
    >
      {!embedded && <Header role={headerRole} />}

      <main className={embedded ? "min-h-0 flex-1 overflow-y-auto" : "flex-1"}>
        <section
          className={
            embedded
              ? "bg-background"
              : "border-b border-[#0069D3]/15 bg-[#D0E1F8] dark:border-white/10 dark:bg-[#1a1c1a]"
          }
        >
          <div className="w-full px-6 pt-8 lg:px-8">
            {!embedded && (
              <nav className="text-sm text-foreground/60">
                <Link
                  href="/"
                  className="transition-colors hover:text-[#0069D3]"
                >
                  {tCommon("home")}
                </Link>
                <span className="mx-2 text-foreground/35">/</span>
                <span className="font-medium text-foreground">
                  {t("breadcrumb")}
                </span>
              </nav>
            )}
            <div
              className={`${
                !embedded ? "mt-4" : ""
              } flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between`}
            >
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {t("pageTitle")}
                </h1>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full px-6 pt-6 pb-12 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-8 animate-spin text-[#0069D3]" />
            </div>
          ) : (
            <Tabs
              value={defaultTab}
              onValueChange={(tab) => {
                const params = new URLSearchParams(searchParams.toString());
                if (tab === "general") params.delete("tab");
                else params.set("tab", tab);
                router.replace(
                  "/freelancer/profile" +
                    (params.size ? "?" + params.toString() : ""),
                  { scroll: false },
                );
              }}
            >
              <TabsList className="mb-6 w-full justify-start overflow-x-auto overflow-y-hidden rounded-full bg-[#F3F3F7] p-0.5 shadow-xs dark:bg-zinc-900/90 group-data-[orientation=horizontal]/tabs:h-auto">
                <TabsTrigger className={profileTabClassName} value="general">
                  <UserRound /> {t("navPersonal")}
                </TabsTrigger>
                {headerRole === "FREELANCER" && profileId ? (
                  <TabsTrigger
                    className={profileTabClassName}
                    value="professional"
                  >
                    <BriefcaseBusiness /> {t("navProfessional")}
                  </TabsTrigger>
                ) : null}

                {headerRole === "FREELANCER" && canViewIdentityTab ? (
                  <TabsTrigger className={profileTabClassName} value="identity">
                    <ShieldCheck /> {t("navIdentity")}
                  </TabsTrigger>
                ) : null}
                {headerRole === "CLIENT" ? (
                  <TabsTrigger className={profileTabClassName} value="company">
                    <Building2 /> {t("navCompany")}
                  </TabsTrigger>
                ) : null}
                {canViewSocialLinks ? (
                  <TabsTrigger className={profileTabClassName} value="social">
                    <Link2 /> {t("navSocial")}
                  </TabsTrigger>
                ) : null}
                {canViewReviews ? (
                  <TabsTrigger className={profileTabClassName} value="reviews">
                    <Star /> {t("navReviews")}
                  </TabsTrigger>
                ) : null}
                {headerRole === "CLIENT" && canViewFollowingTab ? (
                  <TabsTrigger
                    className={profileTabClassName}
                    value="following"
                  >
                    <UserCheck /> {t("navFollowing")}
                  </TabsTrigger>
                ) : null}
                {headerRole === "CLIENT" && canViewFavorites ? (
                  <TabsTrigger
                    className={profileTabClassName}
                    value="favorites"
                  >
                    <Heart /> {t("navFavorites")}
                  </TabsTrigger>
                ) : null}
              </TabsList>

              {headerRole === "FREELANCER" && profileId ? (
                <TabsContent className="mt-0" value="professional">
                  <FreelancerProfessionalSettings
                    profileId={profileId}
                    userId={userId}
                  />
                </TabsContent>
              ) : null}

              <TabsContent className="mt-0" value="general">
                <GeneralSettings
                  hideFreelancerFields
                  showAppearance={false}
                  accent="blue"
                />
              </TabsContent>

              <TabsContent className="mt-0" value="company">
                <div className="rounded-xl border border-border p-5 sm:p-6">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    {t("companyInfoTitle")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("companyInfoHint")}
                  </p>
                  <form
                    className="mt-5 space-y-4"
                    onSubmit={saveCompanyProfile}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="companyName">
                        {tSettings("companyName")}
                      </Label>
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(event) => setCompanyName(event.target.value)}
                        disabled={!canUpdateClientProfile}
                        placeholder={tSettings("companyNamePlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyDescription">
                        {t("descriptionLabel")}
                      </Label>
                      <textarea
                        id="companyDescription"
                        value={companyDescription}
                        onChange={(event) =>
                          setCompanyDescription(event.target.value)
                        }
                        disabled={!canUpdateClientProfile}
                        rows={4}
                        placeholder={t("descriptionPlaceholder")}
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyWebsite">
                        {tSettings("websiteUrl")}
                      </Label>
                      <Input
                        id="companyWebsite"
                        type="url"
                        value={website}
                        onChange={(event) => setWebsite(event.target.value)}
                        disabled={!canUpdateClientProfile}
                        placeholder={tSettings("websitePlaceholder")}
                      />
                    </div>
                    {canUpdateClientProfile && (
                      <Button
                        className="bg-[#0069D3] text-white hover:bg-[#0058b3]"
                        disabled={pending === "company"}
                      >
                        {pending === "company" ? (
                          <Loader2 className="animate-spin" />
                        ) : null}
                        {tSettings("saveChanges")}
                      </Button>
                    )}
                  </form>
                </div>
              </TabsContent>

              {canViewIdentityTab && (
                <TabsContent className="mt-0" value="identity">
                  <div
                    className={`grid gap-8 ${canAiCheck || canUploadIdentityDoc ? "lg:grid-cols-[minmax(0,1fr)_420px]" : "max-w-xl"}`}
                  >
                    {(canAiCheck || canUploadIdentityDoc) && (
                      <div className="rounded-xl border border-border p-5 sm:p-6">
                        <h2 className="text-base font-semibold tracking-tight text-foreground">
                          {t("aiCheckTitle")}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t("aiCheckHint")}
                        </p>
                        <IdentityVerificationForm
                          onSubmitted={() => void load()}
                        />
                      </div>
                    )}

                    {canViewIdentityStatus && (
                      <div className="rounded-xl border border-border p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-3">
                          <h2 className="text-base font-semibold tracking-tight text-foreground">
                            {t("verificationStatusTitle")}
                          </h2>
                          <Badge
                            className={
                              identity?.status === VerificationStatus.APPROVED
                                ? "border-transparent bg-[#0069D3] text-white hover:bg-[#0069D3]"
                                : ""
                            }
                            variant={
                              identity?.status === VerificationStatus.APPROVED
                                ? "default"
                                : "secondary"
                            }
                          >
                            {verificationStatusLabel(identity?.status)}
                          </Badge>
                        </div>
                        <div className="mt-5 space-y-4">
                          {identity?.status !== VerificationStatus.APPROVED ? (
                            <p className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                              {t("dashboardLockedHint")}
                            </p>
                          ) : null}
                          {identity?.documents.length ? (
                            identityVisible ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setIdentityVisible(false)}
                                  className="gap-2 text-[#0069D3]"
                                >
                                  <EyeOff className="size-4" />
                                  {t("hideIdentityDetails")}
                                </Button>
                                <ul className="divide-y divide-border border-y border-border">
                                  {identity.documents.map((document) => (
                                    <li
                                      key={document.id}
                                      className="flex flex-col gap-4 py-4"
                                    >
                                      <div>
                                        <p className="font-medium text-foreground">
                                          {documentTypeLabel(
                                            document.documentType,
                                          )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {format.dateTime(
                                            new Date(document.createdAt),
                                            {
                                              dateStyle: "medium",
                                              timeStyle: "short",
                                            },
                                          )}
                                        </p>
                                        {document.reviewNotes ? (
                                          <p className="mt-1 text-sm text-destructive">
                                            {document.reviewNotes}
                                          </p>
                                        ) : null}
                                      </div>
                                      <div className="flex min-w-0 flex-col gap-4">
                                        {canDownloadIdentityDoc ? (
                                          <>
                                            <span className="text-xs font-medium text-muted-foreground">
                                              {t("frontImageLabel")}
                                            </span>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                              src={document.fileUrl}
                                              alt={`${documentTypeLabel(document.documentType)} — ${t("frontImageLabel")}`}
                                              className="aspect-[1.586] w-full rounded-lg border border-border object-contain bg-muted/20"
                                            />
                                            {document.backFileUrl ? (
                                              <>
                                                <span className="text-xs font-medium text-muted-foreground">
                                                  {t("backImageLabel")}
                                                </span>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                  src={document.backFileUrl}
                                                  alt={`${documentTypeLabel(document.documentType)} — ${t("backImageLabel")}`}
                                                  className="aspect-[1.586] w-full rounded-lg border border-border object-contain bg-muted/20"
                                                />
                                              </>
                                            ) : null}
                                          </>
                                        ) : (
                                          <div className="flex h-16 w-24 items-center justify-center rounded-md border border-border bg-muted/40 text-xs text-muted-foreground">
                                            {documentTypeLabel(
                                              document.documentType,
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setIdentityVisible(true)}
                                aria-expanded={false}
                                className="relative flex min-h-64 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-dashed border-blue-200 bg-blue-50/60 p-6 text-center transition-colors hover:bg-blue-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0069D3] dark:border-blue-900 dark:bg-blue-950/20 dark:hover:bg-blue-950/40"
                              >
                                <LockKeyhole className="size-8 text-[#0069D3]" />
                                <span className="text-sm font-semibold">
                                  {t("identityHiddenTitle")}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {t("identityHiddenHint")}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-[#0069D3] px-4 py-2 text-xs font-semibold text-white">
                                  <Eye className="size-4" />
                                  {t("showIdentityDetails")}
                                </span>
                              </button>
                            )
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {t("noDocumentsYet")}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}

              {canViewSocialLinks && (
                <TabsContent className="mt-0" value="social">
                  <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
                    {canAddSocialLink && (
                      <div className="rounded-xl border border-border p-5 sm:p-6">
                        <h2 className="text-base font-semibold tracking-tight text-foreground">
                          {tSettings("addSocialLink")}
                        </h2>
                        <form
                          className="mt-5 space-y-4"
                          onSubmit={addSocialLink}
                        >
                          <Select
                            value={platform}
                            onValueChange={(value) =>
                              setPlatform(value as SocialPlatformType)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(SocialPlatform).map((value) => (
                                <SelectItem key={value} value={value}>
                                  {platformLabel(value)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="url"
                            required
                            placeholder="https://..."
                            value={socialUrl}
                            onChange={(event) =>
                              setSocialUrl(event.target.value)
                            }
                          />
                          <Button
                            className="bg-[#0069D3] text-white hover:bg-[#0058b3]"
                            disabled={pending === "social"}
                          >
                            <Plus /> {tSettings("addLink")}
                          </Button>
                        </form>
                      </div>
                    )}

                    <div className={canAddSocialLink ? "" : "lg:col-span-2"}>
                      <h2 className="text-base font-semibold tracking-tight text-foreground">
                        {t("yourLinksTitle")}
                      </h2>
                      {socialLinks.length ? (
                        <ul className="mt-4 divide-y divide-border border-y border-border">
                          {socialLinks.map((link) => (
                            <li
                              key={link.id}
                              className="flex items-center gap-3 px-1 py-4"
                            >
                              <Link2 className="size-4 shrink-0 text-[#0069D3]" />
                              <a
                                className="min-w-0 flex-1 truncate text-sm text-[#0069D3] transition-colors hover:text-[#0058b3]"
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <span className="mr-2 font-medium text-foreground">
                                  {platformLabel(link.platform)}
                                </span>
                                {link.url}
                              </a>
                              {canDeleteSocialLink && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => void deleteSocialLink(link)}
                                  disabled={pending === `social-${link.id}`}
                                >
                                  <Trash2 />
                                </Button>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-4 text-sm text-muted-foreground">
                          {tSettings("noSocialLinks")}
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              )}

              <TabsContent className="mt-0" value="reviews">
                {!canViewReviews ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                    <p className="font-semibold text-foreground">
                      Không có quyền truy cập
                    </p>
                    <p className="mt-1 text-sm">
                      Bạn không có quyền xem đánh giá của hợp đồng.
                    </p>
                  </div>
                ) : userId ? (
                  <ReviewManager userId={userId} />
                ) : null}
              </TabsContent>

              <TabsContent className="mt-0" value="following">
                <section aria-labelledby="following-heading">
                  <div className="border-b border-border pb-5">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2
                          id="following-heading"
                          className="text-xl font-semibold tracking-tight text-foreground"
                        >
                          {t("findFreelancersTitle")}
                        </h2>
                        {!freelancersLoading && !freelancersError ? (
                          <Badge variant="secondary">
                            {t("followingBadge", { count: followingCount })}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {t("findFreelancersHint")}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div
                        className="inline-flex w-fit rounded-lg bg-muted p-1"
                        aria-label={tSettings("filterRelationships")}
                      >
                        {canDiscoverFreelancers && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={
                              freelancerView === "all"
                                ? "bg-background shadow-xs hover:bg-background"
                                : "text-muted-foreground"
                            }
                            aria-pressed={freelancerView === "all"}
                            onClick={() => setFreelancerView("all")}
                          >
                            {t("allFreelancers")}
                          </Button>
                        )}
                        {canGetFollowing && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={
                              freelancerView === "following"
                                ? "bg-background shadow-xs hover:bg-background"
                                : "text-muted-foreground"
                            }
                            aria-pressed={freelancerView === "following"}
                            onClick={() => setFreelancerView("following")}
                          >
                            {tSettings("followingTabCount", {
                              count: followingCount,
                            })}
                          </Button>
                        )}
                      </div>

                      <div className="relative w-full sm:max-w-xs">
                        <label htmlFor="freelancer-search" className="sr-only">
                          {tSettings("searchFreelancers")}
                        </label>
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="freelancer-search"
                          value={freelancerQuery}
                          onChange={(event) =>
                            setFreelancerQuery(event.target.value)
                          }
                          placeholder={tSettings("searchPlaceholder")}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>

                  {freelancersLoading ? (
                    <FreelancerListSkeleton
                      label={t("loadingFreelancersAria")}
                    />
                  ) : freelancersError ? (
                    <div className="mt-6 rounded-xl border border-destructive/25 bg-destructive/5 px-5 py-8 text-center">
                      <p className="font-medium text-foreground">
                        {tSettings("freelancersLoadFailed")}
                      </p>
                      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
                        {freelancersError}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 active:translate-y-px"
                        onClick={() => void loadFreelancers()}
                      >
                        <RefreshCw /> {tSettings("tryAgain")}
                      </Button>
                    </div>
                  ) : !freelancers.length ? (
                    <div className="mt-6 rounded-xl border border-dashed border-border px-6 py-14 text-center">
                      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#D0E1F8] text-[#0069D3] dark:bg-[#0069D3]/15">
                        <UserPlus className="size-7" />
                      </div>
                      <p className="text-lg font-medium text-foreground">
                        {t("noFreelancersAvailable")}
                      </p>
                      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                        {t("noFreelancersHint")}
                      </p>
                    </div>
                  ) : !filteredFreelancers.length ? (
                    <div className="mt-6 rounded-xl border border-dashed border-border px-6 py-12 text-center">
                      {freelancerView === "following" && !freelancerQuery ? (
                        <UserCheck className="mx-auto size-7 text-muted-foreground" />
                      ) : (
                        <Search className="mx-auto size-7 text-muted-foreground" />
                      )}
                      <p className="mt-3 font-medium text-foreground">
                        {freelancerView === "following" && !freelancerQuery
                          ? tSettings("notFollowingAnyone")
                          : tSettings("noMatchingFreelancers")}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {freelancerView === "following" && !freelancerQuery
                          ? t("notFollowingHint")
                          : tSettings("noMatchHint")}
                      </p>
                      <Button
                        variant="link"
                        className="mt-2 text-[#0069D3] dark:text-[#93c5fd]"
                        onClick={() => {
                          setFreelancerQuery("");
                          if (freelancerView === "following") {
                            setFreelancerView("all");
                          }
                        }}
                      >
                        {freelancerView === "following"
                          ? tSettings("browseFreelancers")
                          : tSettings("clearSearch")}
                      </Button>
                    </div>
                  ) : (
                    <ul className="mt-6 grid gap-4 lg:grid-cols-2">
                      {filteredFreelancers.map((freelancer) => {
                        const displayName =
                          freelancer.profile.displayName ?? tRole("FREELANCER");
                        const skills =
                          freelancer.profile.freelancerProfile.skills;
                        const isPending =
                          pending === `following-${freelancer.freelancerId}`;

                        return (
                          <li
                            key={freelancer.freelancerId}
                            className="flex min-w-0 flex-col rounded-xl border border-border bg-background p-5 transition-colors hover:border-[#0069D3]/35 dark:hover:border-[#0069D3]/40"
                          >
                            <div className="flex min-w-0 items-start gap-3.5">
                              <Avatar className="size-14 border border-border sm:size-16">
                                <AvatarImage
                                  src={
                                    freelancer.profile.avatarUrl ?? undefined
                                  }
                                  alt={displayName}
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-[#D0E1F8] text-lg font-semibold text-[#0069D3] dark:bg-[#0069D3]/15 dark:text-[#93c5fd]">
                                  {displayName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>

                              <div className="min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedFreelancerProfileId(
                                      freelancer.profile.id,
                                    )
                                  }
                                  className="block truncate text-base font-semibold tracking-tight text-foreground hover:text-[#0069D3] hover:underline hover:underline-offset-4 dark:hover:text-[#93c5fd]"
                                >
                                  {displayName}
                                </button>
                                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                                  {freelancer.profile.freelancerProfile.title ??
                                    tRole("FREELANCER")}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  <Badge variant="outline">
                                    {availabilityLabel(
                                      freelancer.profile.availabilityStatus,
                                    )}
                                  </Badge>
                                  {freelancer.profile.freelancerProfile
                                    .idVerified ? (
                                    <Badge
                                      variant="outline"
                                      className="border-[#0069D3]/25 text-[#0069D3] dark:text-[#93c5fd]"
                                    >
                                      <ShieldCheck /> {tCommon("verified")}
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {skills.length ? (
                              <div className="mt-4 flex min-h-6 flex-wrap gap-1.5">
                                {skills.slice(0, 3).map((skill) => (
                                  <Badge
                                    key={skill.id}
                                    variant="secondary"
                                    className="border border-[#0069D3]/20 bg-[#D0E1F8] dark:border-[#0069D3]/30 dark:bg-[#0069D3]/10"
                                  >
                                    {skill.skill.name}
                                  </Badge>
                                ))}
                                {skills.length > 3 ? (
                                  <Badge variant="secondary">
                                    +{skills.length - 3}
                                  </Badge>
                                ) : null}
                              </div>
                            ) : (
                              <p className="mt-4 text-xs text-muted-foreground">
                                {tSettings("noSkills")}
                              </p>
                            )}

                            <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 active:translate-y-px"
                                asChild
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedFreelancerProfileId(
                                      freelancer.profile.id,
                                    )
                                  }
                                >
                                  {tSettings("viewProfile")}
                                </button>
                              </Button>

                              {freelancer.isFollowing ? (
                                canUnfollowFreelancer ? (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-[#0069D3]/35 text-[#0069D3] hover:bg-destructive/10 hover:text-destructive dark:text-[#93c5fd]"
                                        disabled={isPending}
                                      >
                                        {isPending ? (
                                          <Loader2 className="animate-spin" />
                                        ) : (
                                          <UserCheck />
                                        )}
                                        {t("followingState")}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          {t("unfollowTitle", {
                                            name: displayName,
                                          })}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          {t("unfollowHint")}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          {t("keepFollowing")}
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-destructive text-white hover:bg-destructive/90"
                                          onClick={() =>
                                            void unfollowFreelancer(
                                              freelancer.freelancerId,
                                            )
                                          }
                                        >
                                          <UserMinus /> {tSettings("unfollow")}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                ) : null
                              ) : canFollowFreelancer ? (
                                <Button
                                  size="sm"
                                  className="bg-[#0069D3] text-white hover:bg-[#0058b3] active:translate-y-px"
                                  disabled={isPending}
                                  onClick={() =>
                                    void followFreelancer(freelancer)
                                  }
                                >
                                  {isPending ? (
                                    <Loader2 className="animate-spin" />
                                  ) : (
                                    <UserPlus />
                                  )}
                                  {tSettings("follow")}
                                </Button>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </TabsContent>

              <TabsContent className="mt-0" value="favorites">
                {favorites.length ? (
                  <ul className="divide-y divide-border border-y border-border">
                    {favorites.map((favorite) => (
                      <li key={favorite.freelancerId}>
                        <div className="flex items-start gap-4 px-3 py-5 transition-colors hover:bg-[#D0E1F8]/35 sm:px-5 dark:hover:bg-white/4">
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-semibold tracking-tight text-foreground">
                              {favorite.profile.displayName ??
                                tRole("FREELANCER")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {favorite.profile.freelancerProfile.title ??
                                tRole("FREELANCER")}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-1">
                              {favorite.profile.freelancerProfile.skills
                                .slice(0, 4)
                                .map((skill) => (
                                  <Badge
                                    key={skill.id}
                                    variant="secondary"
                                    className="border border-[#0069D3]/20 bg-[#D0E1F8] dark:border-[#0069D3]/30 dark:bg-[#0069D3]/10"
                                  >
                                    {skill.skill.name}
                                  </Badge>
                                ))}
                            </div>
                            <Button
                              className="mt-4"
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedFreelancerProfileId(
                                    favorite.profile.id,
                                  )
                                }
                              >
                                {tSettings("viewProfile")}
                              </button>
                            </Button>
                          </div>
                          {canRemoveFavorite ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                void removeFavorite(favorite.freelancerId)
                              }
                              disabled={
                                pending === `favorite-${favorite.freelancerId}`
                              }
                            >
                              <Trash2 />
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#D0E1F8] text-[#0069D3] dark:bg-[#0069D3]/15">
                      <Heart className="size-7" />
                    </div>
                    <p className="text-lg font-medium text-foreground">
                      {tSettings("noFavoritesTitle")}
                    </p>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                      {tSettings("noFavoritesHint")}
                    </p>
                    <Button
                      className="mt-6 bg-[#0069D3] text-white hover:bg-[#0058b3]"
                      asChild
                    >
                      <Link href="/forum">{t("visitForum")}</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <FreelancerProfileSheet
        profileId={selectedFreelancerProfileId}
        open={selectedFreelancerProfileId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedFreelancerProfileId(null);
        }}
      />
      {!embedded && <Footer />}
    </div>
  );
}
