"use client";

import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
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
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  Building2,
  ExternalLink,
  Heart,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
} from "@/components/icons";
import { accountProfileApi } from "@/apiRequests/account-profile";
import { profileRevisionApiRequest } from "@/apiRequests/profile-revision";
import { useActionPermission } from "@/hooks/use-action-permission";
import { ApiFail } from "@/lib/http";
import { ProfileReviewStatus } from "@/components/profile-review-status";
import { FreelancerProfileSheet } from "@/app/(client)/_components/freelancer-profile-sheet";
import { GeneralSettings } from "@/app/(freelancer)/freelancer/profile/general-settings";
import { VerifiedBadge } from "@/components/verified-badge";
import {
  SocialPlatform,
  UpdateClientProfileSchema,
  type DiscoverFreelancerType,
  type FavoriteFreelancerType,
  type SocialLinkType,
  type SocialPlatformType,
  type ProfileRevisionType,
} from "@shared/types";

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

type TabKey = "personal" | "company" | "social" | "favorites" | "following";

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

type ClientProfileSettingsProps = {
  userId: number;
};

export function ClientProfileSettings({ userId }: ClientProfileSettingsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("clientProfileSettings");
  const tPlatform = useTranslations("socialPlatform");
  const tRole = useTranslations("roleName");

  const platformLabel = (value: string) =>
    (SOCIAL_PLATFORM_KEYS as readonly string[]).includes(value)
      ? tPlatform(value)
      : value;

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
  const canViewSocialLinks = can("GET", "/api/social-links");
  const canAddSocialLink = can("POST", "/api/social-links");
  const canDeleteSocialLink = can("DELETE", "/api/social-links/:id");

  const requestedTab = searchParams.get("tab");
  const activeTab: TabKey =
    requestedTab === "company"
      ? "company"
      : requestedTab === "social" && canViewSocialLinks
        ? "social"
        : requestedTab === "favorites" && canViewFavorites
          ? "favorites"
          : requestedTab === "following" && canViewFollowingTab
            ? "following"
            : "personal";

  const [socialLinks, setSocialLinks] = useState<SocialLinkType[]>([]);
  const [favorites, setFavorites] = useState<FavoriteFreelancerType[]>([]);
  const [freelancers, setFreelancers] = useState<DiscoverFreelancerType[]>([]);
  const [freelancersError, setFreelancersError] = useState<string | null>(null);
  const [freelancerQuery, setFreelancerQuery] = useState("");
  const [freelancerView, setFreelancerView] = useState<
    "discover" | "following"
  >(() => (canDiscoverFreelancers ? "discover" : "following"));

  useEffect(() => {
    if (
      freelancerView === "discover" &&
      !canDiscoverFreelancers &&
      canGetFollowing
    ) {
      setFreelancerView("following");
    } else if (
      freelancerView === "following" &&
      !canGetFollowing &&
      canDiscoverFreelancers
    ) {
      setFreelancerView("discover");
    }
  }, [freelancerView, canDiscoverFreelancers, canGetFollowing]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [profileRevision, setProfileRevision] =
    useState<ProfileRevisionType | null>(null);
  const [profileStrength, setProfileStrength] = useState<number | null>(null);

  // Freelancer profile slide-over sheet
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(
    null,
  );
  const [selectedProfileData, setSelectedProfileData] = useState<
    | {
        displayName?: string | null;
        avatarUrl?: string | null;
        title?: string | null;
        freelancerId?: number;
      }
    | undefined
  >(undefined);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

  const handleOpenProfile = (
    profileId: number,
    data?: {
      displayName?: string | null;
      avatarUrl?: string | null;
      title?: string | null;
      freelancerId?: number;
    },
  ) => {
    setSelectedProfileId(profileId);
    setSelectedProfileData(data);
    setIsProfileSheetOpen(true);
  };

  // Form states
  const [companyLoadError, setCompanyLoadError] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [savedCompany, setSavedCompany] = useState({
    companyName: "",
    companyDescription: "",
    website: "",
  });
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [platform, setPlatform] = useState<SocialPlatformType>(
    SocialPlatform.LINKEDIN,
  );
  const [socialUrl, setSocialUrl] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setCompanyLoadError(null);
    setFreelancersError(null);
    try {
      const [
        profileResult,
        linksResult,
        favoritesResult,
        freelancersResult,
        revisionResult,
      ] = await Promise.allSettled([
        accountProfileApi.getClientProfile(userId),
        canViewSocialLinks
          ? accountProfileApi.getSocialLinks()
          : Promise.resolve({ success: true, data: [] as SocialLinkType[] }),
        canViewFavorites
          ? accountProfileApi.getFavorites()
          : Promise.resolve({
              success: true,
              data: [] as FavoriteFreelancerType[],
            }),
        canDiscoverFreelancers
          ? accountProfileApi.discoverFreelancers()
          : Promise.resolve({
              success: true,
              data: [] as DiscoverFreelancerType[],
            }),
        profileRevisionApiRequest.getMine("CLIENT"),
      ]);

      if (profileResult.status === "fulfilled") {
        const profile = profileResult.value.data;
        const revision =
          revisionResult.status === "fulfilled"
            ? revisionResult.value.data.revision
            : null;
        const draft =
          revision?.status === "PENDING" || revision?.status === "REJECTED"
            ? revision.proposedData
            : null;
        const company = {
          companyName:
            typeof draft?.companyName === "string"
              ? draft.companyName
              : (profile.clientProfile.companyName ?? ""),
          companyDescription:
            draft && "companyDescription" in draft
              ? String(draft.companyDescription ?? "")
              : (profile.clientProfile.companyDescription ?? ""),
          website:
            draft && "website" in draft
              ? String(draft.website ?? "")
              : (profile.clientProfile.website ?? ""),
        };
        setCompanyName(company.companyName);
        setCompanyDescription(company.companyDescription);
        setWebsite(company.website);
        setSavedCompany(company);
        setProfileStrength(profile.profileCompletionPercent);
        if (linksResult.status !== "fulfilled" && profile.socialLinks) {
          setSocialLinks(profile.socialLinks);
        }
      } else {
        setCompanyLoadError(
          errorMessage(profileResult.reason, t("somethingWentWrong")),
        );
      }

      if (linksResult.status === "fulfilled") {
        setSocialLinks(linksResult.value.data);
      }
      if (favoritesResult.status === "fulfilled") {
        setFavorites(favoritesResult.value.data);
      }
      if (freelancersResult.status === "fulfilled") {
        setFreelancers(freelancersResult.value.data);
      } else {
        setFreelancersError(
          errorMessage(freelancersResult.reason, t("somethingWentWrong")),
        );
      }
      if (revisionResult.status === "fulfilled") {
        setProfileRevision(revisionResult.value.data.revision);
      } else {
        setCompanyLoadError(
          errorMessage(revisionResult.reason, t("somethingWentWrong")),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [
    userId,
    t,
    canViewFavorites,
    canDiscoverFreelancers,
    canViewSocialLinks,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  // Sync tab change with URL query parameter
  const handleTabChange = (tab: TabKey) => {
    if (tab === "company" && activeTab === "personal") void load();
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "personal") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    router.replace(`/client/profile${query}`, { scroll: false });
  };

  const companyDirty =
    companyName.trim() !== savedCompany.companyName ||
    companyDescription.trim() !== savedCompany.companyDescription ||
    website.trim() !== savedCompany.website;
  const companyNeedsReview = profileStrength !== null && profileStrength < 20;

  const handleSaveCompany = async (event: FormEvent) => {
    event.preventDefault();
    if (
      !canUpdateClientProfile ||
      companyLoadError ||
      pending === "company" ||
      !companyDirty
    )
      return;
    setCompanyError(null);
    const parsed = UpdateClientProfileSchema.safeParse({
      companyName: companyName.trim(),
      companyDescription: companyDescription.trim() || null,
      website: website.trim() || null,
    });
    if (!parsed.success) {
      setCompanyError(t("companyValidationError"));
      return;
    }
    setPending("company");
    try {
      const response = await accountProfileApi.updateClientProfile(parsed.data);
      setSavedCompany({
        companyName: parsed.data.companyName,
        companyDescription: parsed.data.companyDescription ?? "",
        website: parsed.data.website ?? "",
      });
      setCompanyName(parsed.data.companyName);
      setCompanyDescription(parsed.data.companyDescription ?? "");
      setWebsite(parsed.data.website ?? "");
      setProfileRevision(response.data.revision);
      if (!response.data.reviewRequired) {
        setProfileStrength(response.data.profileStrength);
      }
      toastSuccess({ message: response.data.message });
    } catch (error) {
      setCompanyError(errorMessage(error, t("somethingWentWrong")));
      toastError({ message: errorMessage(error, t("somethingWentWrong")) });
    } finally {
      setPending(null);
    }
  };

  const handleAddSocialLink = async (event: FormEvent) => {
    event.preventDefault();
    const existing = socialLinks.find((item) => item.platform === platform);
    if (existing) {
      toastError({
        message: t("platformAlreadyAdded", {
          platform: platformLabel(platform),
        }),
      });
      return;
    }

    let urlToSubmit = socialUrl.trim();
    if (!urlToSubmit) return;
    if (!/^https?:\/\//i.test(urlToSubmit)) {
      urlToSubmit = `https://${urlToSubmit}`;
    }

    setPending("social");
    try {
      const response = await accountProfileApi.addSocialLink({
        platform,
        url: urlToSubmit,
      });
      setSocialLinks((current) => [...current, response.data]);
      setSocialUrl("");
      // Pick next unused platform
      const allPlatforms = Object.values(SocialPlatform);
      const remaining = allPlatforms.filter(
        (p) =>
          p !== platform && !socialLinks.some((item) => item.platform === p),
      );
      if (remaining.length > 0 && remaining[0]) {
        setPlatform(remaining[0]);
      }
      toastSuccess({ message: t("socialLinkAdded") });
    } catch (error) {
      toastError({ message: errorMessage(error, t("somethingWentWrong")) });
    } finally {
      setPending(null);
    }
  };

  const handleDeleteSocialLink = async (linkId: number) => {
    setPending(`social-${linkId}`);
    try {
      await accountProfileApi.deleteSocialLink(linkId);
      setSocialLinks((current) => current.filter((item) => item.id !== linkId));
      toastSuccess({ message: t("socialLinkRemoved") });
    } catch (error) {
      toastError({ message: errorMessage(error, t("somethingWentWrong")) });
    } finally {
      setPending(null);
    }
  };

  const handleRemoveFavorite = async (freelancerId: number) => {
    if (!canRemoveFavorite) return;
    setPending(`favorite-${freelancerId}`);
    try {
      await accountProfileApi.removeFavorite(freelancerId);
      setFavorites((current) =>
        current.filter((item) => item.freelancerId !== freelancerId),
      );
      toastSuccess({ message: t("favoriteRemoved") });
    } catch (error) {
      toastError({ message: errorMessage(error, t("somethingWentWrong")) });
    } finally {
      setPending(null);
    }
  };

  const handleUnfollowFreelancer = async (freelancerId: number) => {
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
      toastSuccess({ message: t("unfollowed") });
    } catch (error) {
      toastError({ message: errorMessage(error, t("somethingWentWrong")) });
    } finally {
      setPending(null);
    }
  };

  const handleFollowFreelancer = async (freelancerId: number) => {
    if (!canFollowFreelancer) return;
    setPending(`following-${freelancerId}`);
    try {
      await accountProfileApi.followFreelancer(freelancerId);
      setFreelancers((current) =>
        current.map((item) =>
          item.freelancerId === freelancerId
            ? { ...item, isFollowing: true }
            : item,
        ),
      );
      toastSuccess({ message: t("followed") });
    } catch (error) {
      toastError({ message: errorMessage(error, t("somethingWentWrong")) });
    } finally {
      setPending(null);
    }
  };

  const following = freelancers.filter((item) => item.isFollowing);
  const normalizedFreelancerQuery = freelancerQuery.trim().toLowerCase();
  const visibleFreelancers = freelancers.filter((item) =>
    freelancerView === "following" ? item.isFollowing : !item.isFollowing,
  );
  const filteredFreelancers = normalizedFreelancerQuery
    ? visibleFreelancers.filter((item) =>
        [
          item.profile.displayName,
          item.profile.freelancerProfile.title,
          ...item.profile.freelancerProfile.skills.map(
            (skill) => skill.skill.name,
          ),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedFreelancerQuery),
      )
    : visibleFreelancers;

  const tabs = [
    { id: "personal" as const, label: t("tabPersonal"), icon: UserCheck },
    { id: "company" as const, label: t("tabCompany"), icon: Building2 },
    ...(canViewSocialLinks
      ? [
          {
            id: "social" as const,
            label: t("tabSocial"),
            icon: Link2,
            count: socialLinks.length,
          },
        ]
      : []),
    ...(canViewFavorites
      ? [
          {
            id: "favorites" as const,
            label: t("tabFavorites"),
            icon: Heart,
            count: favorites.length,
          },
        ]
      : []),
    ...(canViewFollowingTab
      ? [
          {
            id: "following" as const,
            label: t("tabFollowing"),
            icon: UserCheck,
            count: following.length,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-full bg-background font-sans">
      <div className="w-full px-6 pt-8 pb-12 lg:px-8">
        {/* ── Page Header ── */}
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-sans">
              {t("pageTitle")}
            </h1>
          </div>
        </div>

        <div className="mx-auto w-full">
          {/* ── Capsule Tab Bar ── */}
          <div className="mt-5">
            {activeTab === "company" && (
              <ProfileReviewStatus
                revision={profileRevision}
                profileStrength={profileStrength}
              />
            )}
          </div>

          <div className="mt-6 flex overflow-x-auto pb-1 scrollbar-none">
            {/* Đổi thành flex w-full */}
            <div className="flex w-full p-0.5 rounded-full bg-[#F3F3F7] dark:bg-zinc-900/90 dark:border-white/10 shadow-xs">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex flex-1 justify-center items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-white dark:bg-zinc-800 text-[#0069D3] dark:text-blue-200 shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-zinc-800/60 font-medium"
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 ? (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                          isActive
                            ? "bg-[#D0E1F8] text-[#0069D3] dark:bg-[#0069D3]/30 dark:text-blue-200"
                            : "bg-black/5 dark:bg-white/10 text-muted-foreground"
                        }`}
                      >
                        {tab.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Tab Content ── */}
          <div className="mt-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="size-8 animate-spin text-[#0069D3]" />
                <p className="text-xs text-muted-foreground">
                  {t("loadingSettings")}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {/* 1. Company Profile Tab */}
                {activeTab === "personal" && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {t("personalHint")}
                    </p>
                    <GeneralSettings
                      hideFreelancerFields
                      showAppearance={false}
                      accent="blue"
                    />
                  </div>
                )}
                {activeTab === "company" && (
                  <motion.div
                    key="company"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-[26px] border border-border dark:border-white/10 bg-card p-6 sm:p-8 shadow-xs"
                  >
                    <div className="flex items-center gap-3 border-b border-border pb-5">
                      <div className="flex size-10 items-center justify-center rounded-full   text-[#0069D3]">
                        <Building2 className="size-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-foreground font-sans">
                          {t("companyDetails")}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {t("companyDetailsHint")}
                        </p>
                      </div>
                    </div>

                    {companyLoadError ? (
                      <div
                        role="alert"
                        className="mt-6 space-y-3 text-sm text-destructive"
                      >
                        <p>{companyLoadError}</p>
                        <Button variant="outline" onClick={() => void load()}>
                          {t("retryCompany")}
                        </Button>
                      </div>
                    ) : (
                      <form
                        className="mt-6 space-y-5"
                        onSubmit={handleSaveCompany}
                      >
                        <p className="text-sm text-muted-foreground">
                          {t(
                            profileRevision?.status === "PENDING"
                              ? "companyPendingHint"
                              : companyNeedsReview
                                ? "companyReviewHint"
                                : "companySaveHint",
                          )}
                        </p>
                        {companyError && (
                          <p role="alert" className="text-sm text-destructive">
                            {companyError}
                          </p>
                        )}
                        <div className="space-y-2">
                          <Label
                            htmlFor="company-name"
                            className="text-xs font-semibold"
                          >
                            {t("companyName")}{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="company-name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                            disabled={
                              !canUpdateClientProfile || pending === "company"
                            }
                            maxLength={255}
                            placeholder={t("companyNamePlaceholder")}
                            className="h-10 rounded-full px-4 text-xs sm:text-sm border border-black/5 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-[#0069D3]/30 disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="company-desc"
                            className="text-xs font-semibold"
                          >
                            {t("companyDescription")}
                          </Label>
                          <Textarea
                            id="company-desc"
                            rows={5}
                            value={companyDescription}
                            onChange={(e) =>
                              setCompanyDescription(e.target.value)
                            }
                            disabled={
                              !canUpdateClientProfile || pending === "company"
                            }
                            placeholder={t("companyDescriptionPlaceholder")}
                            className="rounded-2xl p-4 text-xs sm:text-sm border border-black/5 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-[#0069D3]/30 leading-relaxed resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="company-website"
                            className="text-xs font-semibold"
                          >
                            {t("websiteUrl")}
                          </Label>
                          <Input
                            id="company-website"
                            type="url"
                            placeholder={t("websitePlaceholder")}
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            disabled={
                              !canUpdateClientProfile || pending === "company"
                            }
                            className="h-10 rounded-full px-4 text-xs sm:text-sm border border-black/5 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-[#0069D3]/30 disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>

                        {canUpdateClientProfile ? (
                          <div className="pt-2 flex items-center gap-3">
                            <Button
                              type="submit"
                              disabled={
                                pending === "company" ||
                                !companyName.trim() ||
                                !companyDirty
                              }
                              className="gap-2 rounded-full bg-[#0069D3] text-white hover:bg-[#0058b3] px-6 py-2.5 text-xs sm:text-sm font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              {pending === "company" ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : null}
                              {t(
                                pending === "company"
                                  ? "savingCompany"
                                  : companyNeedsReview
                                    ? "submitCompanyReview"
                                    : "saveChanges",
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={!companyDirty || pending === "company"}
                              onClick={() => {
                                setCompanyName(savedCompany.companyName);
                                setCompanyDescription(
                                  savedCompany.companyDescription,
                                );
                                setWebsite(savedCompany.website);
                                setCompanyError(null);
                              }}
                            >
                              {t("resetCompany")}
                            </Button>
                          </div>
                        ) : null}
                      </form>
                    )}
                  </motion.div>
                )}

                {/* 2. Social Links Tab */}
                {activeTab === "social" && canViewSocialLinks && (
                  <motion.div
                    key="social"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-6 lg:grid-cols-[380px_1fr]"
                  >
                    {/* Add link card */}
                    {canAddSocialLink && (
                      <div className="rounded-[26px] border border-black/5 dark:border-white/10 bg-card p-6 sm:p-7 shadow-xs">
                        <div className="flex items-center gap-2.5 border-b border-border pb-4">
                          <div className="flex size-8 items-center justify-center rounded-full bg-[#D0E1F8] dark:bg-[#0069D3]/20 text-[#0069D3]">
                            <Plus className="size-4" />
                          </div>
                          <h3 className="text-sm font-bold text-foreground font-sans">
                            {t("addSocialLink")}
                          </h3>
                        </div>

                        <form
                          className="mt-5 space-y-4"
                          onSubmit={handleAddSocialLink}
                        >
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">
                              {t("platform")}
                            </Label>
                            <Select
                              value={platform}
                              onValueChange={(value) =>
                                setPlatform(value as SocialPlatformType)
                              }
                            >
                              <SelectTrigger className="h-10 rounded-full px-4 text-xs sm:text-sm border border-black/5 dark:border-white/10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl">
                                {Object.values(SocialPlatform).map((val) => {
                                  const alreadyAdded = socialLinks.some(
                                    (item) => item.platform === val,
                                  );
                                  return (
                                    <SelectItem
                                      key={val}
                                      value={val}
                                      disabled={alreadyAdded}
                                    >
                                      <span>{platformLabel(val)}</span>
                                      {alreadyAdded ? (
                                        <span className="ml-1 text-muted-foreground">
                                          {t("alreadyAdded")}
                                        </span>
                                      ) : null}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">
                              {t("profileUrl")}
                            </Label>
                            <Input
                              type="url"
                              required
                              placeholder="https://..."
                              value={socialUrl}
                              onChange={(e) => setSocialUrl(e.target.value)}
                              className="h-10 rounded-full px-4 text-xs sm:text-sm border border-black/5 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-[#0069D3]/30"
                            />
                          </div>

                          <Button
                            type="submit"
                            disabled={pending === "social" || !socialUrl.trim()}
                            className="w-full gap-1.5 rounded-full bg-[#0069D3] text-white hover:bg-[#0058b3] text-xs font-semibold py-2.5 cursor-pointer shadow-xs"
                          >
                            {pending === "social" ? (
                              <Loader2 className="size-3.5 animate-spin mr-1" />
                            ) : (
                              <Plus className="size-3.5 mr-1" />
                            )}
                            {t("addLink")}
                          </Button>
                        </form>
                      </div>
                    )}

                    {/* Existing links list */}
                    <div
                      className={`rounded-[26px] border border-black/5 dark:border-white/10 bg-card p-6 sm:p-7 shadow-xs ${canAddSocialLink ? "" : "lg:col-span-2"}`}
                    >
                      <div className="flex items-center justify-between border-b border-border pb-4">
                        <h3 className="text-sm font-bold text-foreground font-sans">
                          {t("connectedLinks", { count: socialLinks.length })}
                        </h3>
                      </div>

                      {socialLinks.length === 0 ? (
                        <div className="py-16 text-center">
                          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[#F1F0F5] dark:bg-zinc-800 text-muted-foreground">
                            <Link2 className="size-5" />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t("noSocialLinks")}
                          </p>
                        </div>
                      ) : (
                        <ul className="mt-3 divide-y divide-border">
                          {socialLinks.map((link) => (
                            <li
                              key={link.id}
                              className="flex items-center justify-between gap-3 py-3 px-1"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#D0E1F8] dark:bg-[#0069D3]/20 text-[#0069D3]">
                                  <Link2 className="size-3.5" />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-foreground">
                                    {platformLabel(link.platform)}
                                  </p>
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="truncate text-xs text-[#0069D3] hover:underline flex items-center gap-1"
                                  >
                                    <span className="truncate">{link.url}</span>
                                    <ExternalLink className="size-2.5 shrink-0 opacity-70" />
                                  </a>
                                </div>
                              </div>
                              {canDeleteSocialLink && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={pending === `social-${link.id}`}
                                  onClick={() =>
                                    handleDeleteSocialLink(link.id)
                                  }
                                  className="size-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                  title={t("deleteLink")}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* 3. Favorites Tab */}
                {activeTab === "favorites" && (
                  <motion.div
                    key="favorites"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className=""
                  >
                    {favorites.length === 0 ? (
                      <div className="py-20 text-center">
                        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full text-[#0069D3]">
                          <Heart className="size-6" />
                        </div>
                        <h4 className="text-sm font-bold text-foreground">
                          {t("noFavoritesTitle")}
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                          {t("noFavoritesHint")}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {favorites.map((favorite) => (
                          <div
                            key={favorite.freelancerId}
                            className="flex flex-col justify-between rounded-[22px] border border-black/5 dark:border-white/10 p-4 transition-all hover:border-black/15 dark:hover:border-white/20 hover:shadow-xs"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div
                                onClick={() =>
                                  handleOpenProfile(favorite.profile.id, {
                                    displayName: favorite.profile.displayName,
                                    avatarUrl: favorite.profile.avatarUrl,
                                    title:
                                      favorite.profile.freelancerProfile.title,
                                    freelancerId: favorite.freelancerId,
                                  })
                                }
                                className="flex items-center gap-3 min-w-0 cursor-pointer group"
                              >
                                <Avatar className="size-10 rounded-full shrink-0 ring-2 ring-transparent group-hover:ring-[#0069D3]/30 transition-all">
                                  {favorite.profile.avatarUrl ? (
                                    <AvatarImage
                                      src={favorite.profile.avatarUrl}
                                      alt={
                                        favorite.profile.displayName ??
                                        tRole("FREELANCER")
                                      }
                                    />
                                  ) : null}
                                  <AvatarFallback className="bg-[#D0E1F8] text-xs font-bold text-[#0069D3]">
                                    {(
                                      favorite.profile.displayName ??
                                      tRole("FREELANCER")
                                    )
                                      .charAt(0)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="truncate text-xs sm:text-sm font-bold text-foreground group-hover:text-[#0069D3] transition-colors">
                                      {favorite.profile.displayName ??
                                        tRole("FREELANCER")}
                                    </p>
                                    {favorite.profile.freelancerProfile
                                      .idVerified ? (
                                      <VerifiedBadge size="xs" />
                                    ) : null}
                                  </div>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {favorite.profile.freelancerProfile.title ??
                                      tRole("FREELANCER")}
                                  </p>
                                </div>
                              </div>

                              {canRemoveFavorite ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={
                                    pending ===
                                    `favorite-${favorite.freelancerId}`
                                  }
                                  onClick={() =>
                                    handleRemoveFavorite(favorite.freelancerId)
                                  }
                                  className="size-8 shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                  title={t("removeFromFavorites")}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              ) : null}
                            </div>

                            {/* Skills */}
                            <div className="mt-3 flex flex-wrap gap-1">
                              {favorite.profile.freelancerProfile.skills
                                .slice(0, 3)
                                .map((skill) => (
                                  <span
                                    key={skill.id}
                                    className="rounded-full bg-[#D0E1F8]/60 dark:bg-[#0069D3]/20 text-[#0069D3] dark:text-blue-200 px-2 py-0.5 text-[10px] font-medium"
                                  >
                                    {skill.skill.name}
                                  </span>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 4. Following Tab */}
                {activeTab === "following" && (
                  <motion.div
                    key="following"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    aria-labelledby="following-heading"
                  >
                    <div className="border-b border-black/5 pb-5 dark:border-white/10">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h2
                            id="following-heading"
                            className="text-lg font-bold tracking-tight text-foreground"
                          >
                            {t("networkTitle")}
                          </h2>
                          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                            {t("networkHint")}
                          </p>
                        </div>

                        <div className="text-xs font-medium text-muted-foreground">
                          {t.rich("followingLabel", {
                            count: following.length,
                            strong: (chunks) => (
                              <strong className="font-bold text-foreground">
                                {chunks}
                              </strong>
                            ),
                          })}
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div
                          className="inline-flex w-fit rounded-full bg-[#F3F3F7] p-1 dark:bg-zinc-900/90"
                          aria-label={t("filterRelationships")}
                        >
                          {canDiscoverFreelancers && (
                            <button
                              type="button"
                              aria-pressed={freelancerView === "discover"}
                              onClick={() => setFreelancerView("discover")}
                              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                                freelancerView === "discover"
                                  ? "bg-white text-[#0069D3] shadow-xs dark:bg-zinc-800 dark:text-blue-200"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {t("discoverCount", {
                                count: freelancers.filter(
                                  (item) => !item.isFollowing,
                                ).length,
                              })}
                            </button>
                          )}
                          {canGetFollowing && (
                            <button
                              type="button"
                              aria-pressed={freelancerView === "following"}
                              onClick={() => setFreelancerView("following")}
                              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                                freelancerView === "following"
                                  ? "bg-white text-[#0069D3] shadow-xs dark:bg-zinc-800 dark:text-blue-200"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {t("followingTabCount", {
                                count: following.length,
                              })}
                            </button>
                          )}
                        </div>

                        <div className="relative w-full sm:max-w-xs">
                          <label htmlFor="following-search" className="sr-only">
                            {t("searchFreelancers")}
                          </label>
                          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="following-search"
                            value={freelancerQuery}
                            onChange={(event) =>
                              setFreelancerQuery(event.target.value)
                            }
                            placeholder={t("searchPlaceholder")}
                            className="h-9 rounded-full pl-9 text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {freelancersError ? (
                      <div
                        className="mt-6 rounded-[22px] border border-destructive/20 bg-destructive/5 px-5 py-10 text-center"
                        role="alert"
                      >
                        <p className="text-sm font-bold text-foreground">
                          {t("freelancersLoadFailed")}
                        </p>
                        <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
                          {freelancersError}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-4 rounded-full"
                          onClick={() => void load()}
                        >
                          <RefreshCw className="size-3.5" />
                          {t("tryAgain")}
                        </Button>
                      </div>
                    ) : filteredFreelancers.length === 0 ? (
                      <div className="py-16 text-center" aria-live="polite">
                        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-[#D0E1F8] text-[#0069D3] dark:bg-[#0069D3]/20 dark:text-blue-200">
                          {normalizedFreelancerQuery ? (
                            <Search className="size-6" />
                          ) : freelancerView === "following" ? (
                            <UserCheck className="size-6" />
                          ) : (
                            <UserPlus className="size-6" />
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-foreground">
                          {normalizedFreelancerQuery
                            ? t("noMatchingFreelancers")
                            : freelancerView === "following"
                              ? t("notFollowingAnyone")
                              : t("noNewFreelancers")}
                        </h3>
                        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                          {normalizedFreelancerQuery
                            ? t("noMatchHint")
                            : freelancerView === "following"
                              ? t("notFollowingHint")
                              : t("allFollowedHint")}
                        </p>
                        {normalizedFreelancerQuery ? (
                          <Button
                            type="button"
                            variant="link"
                            className="mt-2 text-[#0069D3] dark:text-blue-200"
                            onClick={() => setFreelancerQuery("")}
                          >
                            {t("clearSearch")}
                          </Button>
                        ) : freelancerView === "following" ? (
                          <Button
                            type="button"
                            variant="link"
                            className="mt-2 text-[#0069D3] dark:text-blue-200"
                            onClick={() => setFreelancerView("discover")}
                          >
                            {t("browseFreelancers")}
                          </Button>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {filteredFreelancers.map((freelancer) => {
                          const displayName =
                            freelancer.profile.displayName ??
                            tRole("FREELANCER");
                          const title =
                            freelancer.profile.freelancerProfile.title ??
                            tRole("FREELANCER");
                          const skills =
                            freelancer.profile.freelancerProfile.skills;
                          const isPending =
                            pending === `following-${freelancer.freelancerId}`;

                          return (
                            <article
                              key={freelancer.freelancerId}
                              className="flex min-w-0 flex-col justify-between rounded-[22px] border border-black/5 p-4 transition-colors hover:border-[#0069D3]/25 dark:border-white/10 dark:hover:border-[#0069D3]/40"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenProfile(freelancer.profile.id, {
                                    displayName,
                                    avatarUrl: freelancer.profile.avatarUrl,
                                    title,
                                    freelancerId: freelancer.freelancerId,
                                  })
                                }
                                className="group flex min-w-0 items-center gap-3 text-left"
                              >
                                <Avatar className="size-10 rounded-full shrink-0 ring-2 ring-transparent group-hover:ring-[#0069D3]/30 transition-all">
                                  {freelancer.profile.avatarUrl ? (
                                    <AvatarImage
                                      src={freelancer.profile.avatarUrl}
                                      alt={displayName}
                                    />
                                  ) : null}
                                  <AvatarFallback className="bg-[#D0E1F8] text-xs font-bold text-[#0069D3]">
                                    {displayName.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate text-xs font-bold text-foreground transition-colors group-hover:text-[#0069D3] sm:text-sm">
                                      {displayName}
                                    </span>
                                    {freelancer.profile.freelancerProfile
                                      .idVerified ? (
                                      <VerifiedBadge size="xs" />
                                    ) : null}
                                  </div>
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {title}
                                  </span>
                                </span>
                              </button>

                              <div className="mt-3 flex min-h-5 flex-wrap gap-1">
                                {skills.length ? (
                                  skills.slice(0, 3).map((skill) => (
                                    <span
                                      key={skill.id}
                                      className="rounded-full bg-[#D0E1F8]/60 px-2 py-0.5 text-[10px] font-medium text-[#0069D3] dark:bg-[#0069D3]/20 dark:text-blue-200"
                                    >
                                      {skill.skill.name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">
                                    {t("noSkills")}
                                  </span>
                                )}
                              </div>

                              <div className="mt-4 flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 rounded-full text-xs"
                                  onClick={() =>
                                    handleOpenProfile(freelancer.profile.id, {
                                      displayName,
                                      avatarUrl: freelancer.profile.avatarUrl,
                                      title,
                                      freelancerId: freelancer.freelancerId,
                                    })
                                  }
                                >
                                  {t("viewProfile")}
                                </Button>
                                {freelancer.isFollowing ? (
                                  canUnfollowFreelancer ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={isPending}
                                      onClick={() =>
                                        void handleUnfollowFreelancer(
                                          freelancer.freelancerId,
                                        )
                                      }
                                      className="rounded-full text-xs border-[#0069D3]/25 text-[#0069D3] hover:bg-destructive/10 hover:text-destructive dark:text-blue-200"
                                    >
                                      {isPending ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                      ) : (
                                        <UserMinus className="size-3.5" />
                                      )}
                                      {t("unfollow")}
                                    </Button>
                                  ) : null
                                ) : canFollowFreelancer ? (
                                  <Button
                                    type="button"
                                    variant="default"
                                    size="sm"
                                    disabled={isPending}
                                    onClick={() =>
                                      void handleFollowFreelancer(
                                        freelancer.freelancerId,
                                      )
                                    }
                                    className="rounded-full text-xs bg-[#0069D3] text-white hover:bg-[#0059b3]"
                                  >
                                    {isPending ? (
                                      <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                      <UserPlus className="size-3.5" />
                                    )}
                                    {t("follow")}
                                  </Button>
                                ) : null}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Slide-over full freelancer profile sheet */}
      <FreelancerProfileSheet
        open={isProfileSheetOpen}
        onOpenChange={setIsProfileSheetOpen}
        profileId={selectedProfileId}
        initialData={selectedProfileData}
      />
    </div>
  );
}
