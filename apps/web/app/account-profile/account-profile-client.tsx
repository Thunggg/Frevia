"use client";

import { accountProfileApi } from "@/apiRequests/account-profile";
import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import {
  ExternalLink,
  Eye,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
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
  DocumentType,
  SocialPlatform,
  VerificationStatus,
  type DiscoverFreelancerType,
  type DocumentTypeType,
  type FavoriteFreelancerType,
  type IdentityVerificationStatusType,
  type SocialLinkType,
  type SocialPlatformType,
} from "@shared/types";
import {
  Building2,
  Heart,
  ShieldCheck,
  Star,
  UserCheck,
  UserMinus,
  UserPlus,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { GeneralSettings } from "./general-settings";
import { ReviewManager } from "./review-manager";

type Props = {
  userId: number | null;
  profileId: number | null;
  headerRole: UserRole;
  embedded?: boolean;
};

function errorMessage(error: unknown) {
  if (error instanceof ApiFail) {
    return error.response.error.details?.[0]?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

const labels: Record<string, string> = {
  ID_CARD: "National ID card",
  PASSPORT: "Passport",
  DRIVER_LICENSE: "Driver license",
  RESIDENCE_PERMIT: "Residence permit",
  OTHER: "Other document",
};

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

export function AccountProfileClient({
  userId,
  profileId,
  headerRole,
  embedded = false,
}: Props) {
  const searchParams = useSearchParams();
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
  const [documentType, setDocumentType] = useState<DocumentTypeType>(
    DocumentType.ID_CARD,
  );
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState<SocialPlatformType>(
    SocialPlatform.LINKEDIN,
  );
  const [socialUrl, setSocialUrl] = useState("");

  const load = useCallback(async () => {
    if (!userId || headerRole === "GUEST") return;
    setLoading(true);
    try {
      const common = accountProfileApi.getSocialLinks();
      if (headerRole === "FREELANCER") {
        const [identityResponse, linksResponse] = await Promise.all([
          accountProfileApi.getIdentityStatus(),
          common,
        ]);
        setIdentity(identityResponse.data);
        setSocialLinks(linksResponse.data);
      } else {
        const [profileResponse, linksResponse, favoritesResponse] =
          await Promise.all([
            accountProfileApi.getClientProfile(userId),
            common,
            accountProfileApi.getFavorites(),
          ]);
        const profile = profileResponse.data;
        setCompanyName(profile.clientProfile.companyName ?? "");
        setCompanyDescription(profile.clientProfile.companyDescription ?? "");
        setWebsite(profile.clientProfile.website ?? "");
        setSocialLinks(linksResponse.data);
        setFavorites(favoritesResponse.data);
      }
    } catch (error) {
      toastError({ message: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, [headerRole, userId]);

  const loadFreelancers = useCallback(async () => {
    setFreelancersLoading(true);
    setFreelancersError(null);
    try {
      const response = await accountProfileApi.discoverFreelancers();
      setFreelancers(response.data);
    } catch (error) {
      setFreelancersError(errorMessage(error));
    } finally {
      setFreelancersLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  useEffect(() => {
    if (headerRole === "CLIENT" && userId) {
      void loadFreelancers();
    }
  }, [headerRole, loadFreelancers, userId]);

  const uploadDocument = async (event: FormEvent) => {
    event.preventDefault();
    if (!documentFile) {
      toastError({ message: "Please select a document file." });
      return;
    }
    setPending("identity");
    try {
      await accountProfileApi.uploadIdentityDocument(
        { documentType },
        documentFile,
      );
      toastSuccess({ message: "Document uploaded for review." });
      setDocumentFile(null);
      await load();
    } catch (error) {
      toastError({ message: errorMessage(error) });
    } finally {
      setPending(null);
    }
  };

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
      toastSuccess({ message: "Social link added." });
    } catch (error) {
      toastError({ message: errorMessage(error) });
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
      toastSuccess({ message: "Social link removed." });
    } catch (error) {
      toastError({ message: errorMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const unfollowFreelancer = async (freelancerId: number) => {
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
      toastSuccess({ message: "Unfollowed freelancer." });
    } catch (error) {
      toastError({ message: errorMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const removeFavorite = async (freelancerId: number) => {
    setPending(`favorite-${freelancerId}`);
    try {
      await accountProfileApi.removeFavorite(freelancerId);
      setFavorites((current) =>
        current.filter((item) => item.freelancerId !== freelancerId),
      );
      toastSuccess({ message: "Removed from favorites." });
    } catch (error) {
      toastError({ message: errorMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const followFreelancer = async (freelancer: DiscoverFreelancerType) => {
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
      toastSuccess({ message: "You are now following this freelancer." });
    } catch (error) {
      toastError({ message: errorMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const saveCompanyProfile = async (event: FormEvent) => {
    event.preventDefault();
    setPending("company");
    try {
      await accountProfileApi.updateClientProfile({
        companyName,
        companyDescription,
        website,
      });
      toastSuccess({ message: "Company profile updated." });
    } catch (error) {
      toastError({ message: errorMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const requestedTab = searchParams.get("tab");
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
      ? ["general", "company", "social", "reviews", "following", "favorites"]
      : ["general", "identity", "social", "reviews"];
  const defaultTab =
    requestedTab && allowedTabs.includes(requestedTab)
      ? requestedTab
      : "general";
  const publicProfileHref =
    headerRole === "FREELANCER"
      ? profileId
        ? `/profiles/${profileId}`
        : null
      : headerRole === "CLIENT" && userId
        ? `/clients/${userId}`
        : null;

  return (
    <div
      className={`flex flex-col bg-background font-sans ${
        embedded ? "min-h-0 flex-1" : "min-h-dvh"
      }`}
    >
      {!embedded && <Header role={headerRole} />}

      <main className="flex-1">
        <section
          className={
            embedded
              ? "border-b border-border bg-background"
              : "border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]"
          }
        >
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            {!embedded && (
              <nav className="text-sm text-foreground/60">
                <Link
                  href="/"
                  className="transition-colors hover:text-[#4fae2e]"
                >
                  Home
                </Link>
                <span className="mx-2 text-foreground/35">/</span>
                <span className="font-medium text-foreground">
                  Profile & trust settings
                </span>
              </nav>
            )}
            <div
              className={`${
                !embedded ? "mt-4" : ""
              } flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between`}
            >
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Profile & trust settings
                </h1>
                <p className="mt-1 text-xs font-normal text-muted-foreground">
                  Manage your identity verification documents and public social
                  connections.
                </p>
              </div>
              {publicProfileHref ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full shrink-0 border-border bg-background/80 text-foreground hover:bg-accent sm:w-auto text-xs"
                  asChild
                >
                  <Link href={publicProfileHref}>
                    <Eye className="mr-2 size-4" />
                    View public profile
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-8 animate-spin text-[#4fae2e]" />
            </div>
          ) : (
            <Tabs key={defaultTab} defaultValue={defaultTab}>
              <TabsList
                variant="line"
                className="mb-8 w-full justify-start overflow-x-auto overflow-y-hidden"
              >
                <TabsTrigger value="general">
                  <UserRound /> General
                </TabsTrigger>
                {headerRole === "FREELANCER" ? (
                  <TabsTrigger value="identity">
                    <ShieldCheck /> Identity
                  </TabsTrigger>
                ) : null}
                {headerRole === "CLIENT" ? (
                  <TabsTrigger value="company">
                    <Building2 /> Company
                  </TabsTrigger>
                ) : null}
                <TabsTrigger value="social">
                  <Link2 /> Social links
                </TabsTrigger>
                <TabsTrigger value="reviews">
                  <Star /> Reviews
                </TabsTrigger>
                {headerRole === "CLIENT" ? (
                  <TabsTrigger value="following">
                    <UserCheck /> Following
                  </TabsTrigger>
                ) : null}
                {headerRole === "CLIENT" ? (
                  <TabsTrigger value="favorites">
                    <Heart /> Favorites
                  </TabsTrigger>
                ) : null}
              </TabsList>

              <TabsContent value="general">
                <GeneralSettings />
              </TabsContent>

              <TabsContent value="company">
                <div className="rounded-xl border border-border p-5 sm:p-6">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    Company information
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tell freelancers about your company. This information is
                    public on your client profile.
                  </p>
                  <form
                    className="mt-5 space-y-4"
                    onSubmit={saveCompanyProfile}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company name</Label>
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(event) => setCompanyName(event.target.value)}
                        placeholder="Acme Inc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyDescription">Description</Label>
                      <textarea
                        id="companyDescription"
                        value={companyDescription}
                        onChange={(event) =>
                          setCompanyDescription(event.target.value)
                        }
                        rows={4}
                        placeholder="A short description about your company..."
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyWebsite">Website</Label>
                      <Input
                        id="companyWebsite"
                        type="url"
                        value={website}
                        onChange={(event) => setWebsite(event.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>
                    <Button
                      className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                      disabled={pending === "company"}
                    >
                      {pending === "company" ? (
                        <Loader2 className="animate-spin" />
                      ) : null}
                      Save changes
                    </Button>
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="identity">
                <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                  <div className="rounded-xl border border-border p-5 sm:p-6">
                    <h2 className="text-base font-semibold tracking-tight text-foreground">
                      Submit document for review
                    </h2>
                    <form className="mt-5 space-y-4" onSubmit={uploadDocument}>
                      <div className="space-y-2">
                        <Label>Document type</Label>
                        <Select
                          value={documentType}
                          onValueChange={(value) =>
                            setDocumentType(value as DocumentTypeType)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(DocumentType).map((value) => (
                              <SelectItem key={value} value={value}>
                                {labels[value]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Document file</Label>
                        <Input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(event) =>
                            setDocumentFile(event.target.files?.[0] ?? null)
                          }
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Upload PDF, PNG, or JPG (max 10MB).
                        </p>
                      </div>
                      <Button
                        className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                        disabled={pending === "identity"}
                      >
                        {pending === "identity" ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Upload />
                        )}
                        Upload document
                      </Button>
                    </form>
                  </div>

                  <div className="rounded-xl border border-border p-5 sm:p-6">
                    <h2 className="text-base font-semibold tracking-tight text-foreground">
                      Verification status
                    </h2>
                    <div className="mt-5 space-y-4">
                      <Badge
                        className={
                          identity?.status === VerificationStatus.APPROVED
                            ? "border-transparent bg-[#4fae2e] text-white hover:bg-[#4fae2e]"
                            : ""
                        }
                        variant={
                          identity?.status === VerificationStatus.APPROVED
                            ? "default"
                            : "secondary"
                        }
                      >
                        {identity?.status ?? "NOT SUBMITTED"}
                      </Badge>
                      {identity?.documents.length ? (
                        <ul className="divide-y divide-border border-y border-border">
                          {identity.documents.map((document) => (
                            <li
                              key={document.id}
                              className="flex items-center justify-between gap-3 py-3"
                            >
                              <div>
                                <p className="font-medium text-foreground">
                                  {labels[document.documentType]}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(
                                    document.createdAt,
                                  ).toLocaleString()}
                                </p>
                                {document.reviewNotes ? (
                                  <p className="mt-1 text-sm text-destructive">
                                    {document.reviewNotes}
                                  </p>
                                ) : null}
                              </div>
                              <Button variant="ghost" size="icon" asChild>
                                <a
                                  href={document.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <ExternalLink />
                                </a>
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No documents submitted yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="social">
                <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
                  <div className="rounded-xl border border-border p-5 sm:p-6">
                    <h2 className="text-base font-semibold tracking-tight text-foreground">
                      Add social link
                    </h2>
                    <form className="mt-5 space-y-4" onSubmit={addSocialLink}>
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
                              {value.replaceAll("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="url"
                        required
                        placeholder="https://..."
                        value={socialUrl}
                        onChange={(event) => setSocialUrl(event.target.value)}
                      />
                      <Button
                        className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                        disabled={pending === "social"}
                      >
                        <Plus /> Add link
                      </Button>
                    </form>
                  </div>

                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-foreground">
                      Your links
                    </h2>
                    {socialLinks.length ? (
                      <ul className="mt-4 divide-y divide-border border-y border-border">
                        {socialLinks.map((link) => (
                          <li
                            key={link.id}
                            className="flex items-center gap-3 px-1 py-4"
                          >
                            <Link2 className="size-4 shrink-0 text-[#4fae2e]" />
                            <a
                              className="min-w-0 flex-1 truncate text-sm text-[#4fae2e] transition-colors hover:text-[#3f9225]"
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <span className="mr-2 font-medium text-foreground">
                                {link.platform}
                              </span>
                              {link.url}
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => void deleteSocialLink(link)}
                              disabled={pending === `social-${link.id}`}
                            >
                              <Trash2 />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 text-sm text-muted-foreground">
                        No social links added yet.
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                {userId ? <ReviewManager userId={userId} /> : null}
              </TabsContent>

              <TabsContent value="following">
                <section aria-labelledby="following-heading">
                  <div className="border-b border-border pb-5">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2
                          id="following-heading"
                          className="text-xl font-semibold tracking-tight text-foreground"
                        >
                          Find freelancers
                        </h2>
                        {!freelancersLoading && !freelancersError ? (
                          <Badge variant="secondary">
                            {followingCount} following
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        Browse profiles and follow people you want to keep in
                        view.
                      </p>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div
                        className="inline-flex w-fit rounded-lg bg-muted p-1"
                        aria-label="Filter freelancers"
                      >
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
                          All freelancers
                        </Button>
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
                          Following ({followingCount})
                        </Button>
                      </div>

                      <div className="relative w-full sm:max-w-xs">
                        <label htmlFor="freelancer-search" className="sr-only">
                          Search freelancers
                        </label>
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="freelancer-search"
                          value={freelancerQuery}
                          onChange={(event) =>
                            setFreelancerQuery(event.target.value)
                          }
                          placeholder="Search by name, title, or skill"
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>

                  {freelancersLoading ? (
                    <FreelancerListSkeleton label="Loading freelancers" />
                  ) : freelancersError ? (
                    <div className="mt-6 rounded-xl border border-destructive/25 bg-destructive/5 px-5 py-8 text-center">
                      <p className="font-medium text-foreground">
                        We could not load freelancers
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
                        <RefreshCw /> Try again
                      </Button>
                    </div>
                  ) : !freelancers.length ? (
                    <div className="mt-6 rounded-xl border border-dashed border-border px-6 py-14 text-center">
                      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
                        <UserPlus className="size-7" />
                      </div>
                      <p className="text-lg font-medium text-foreground">
                        No freelancers available
                      </p>
                      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                        Freelancer profiles will appear here when they become
                        available.
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
                          ? "You are not following anyone yet"
                          : "No matching freelancers"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {freelancerView === "following" && !freelancerQuery
                          ? "Switch to All freelancers to find people to follow."
                          : "Try another name, title, or skill."}
                      </p>
                      <Button
                        variant="link"
                        className="mt-2 text-[#438f2b] dark:text-[#78c85d]"
                        onClick={() => {
                          setFreelancerQuery("");
                          if (freelancerView === "following") {
                            setFreelancerView("all");
                          }
                        }}
                      >
                        {freelancerView === "following"
                          ? "Browse freelancers"
                          : "Clear search"}
                      </Button>
                    </div>
                  ) : (
                    <ul className="mt-6 grid gap-4 lg:grid-cols-2">
                      {filteredFreelancers.map((freelancer) => {
                        const displayName =
                          freelancer.profile.displayName ?? "Freelancer";
                        const skills =
                          freelancer.profile.freelancerProfile.skills;
                        const isPending =
                          pending === `following-${freelancer.freelancerId}`;

                        return (
                          <li
                            key={freelancer.freelancerId}
                            className="flex min-w-0 flex-col rounded-xl border border-border bg-background p-5 transition-colors hover:border-[#4fae2e]/35 dark:hover:border-[#4fae2e]/40"
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
                                <AvatarFallback className="bg-[#eaf8df] text-lg font-semibold text-[#438f2b] dark:bg-[#4fae2e]/15 dark:text-[#78c85d]">
                                  {displayName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>

                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/profiles/${freelancer.profile.id}`}
                                  className="block truncate text-base font-semibold tracking-tight text-foreground hover:text-[#438f2b] hover:underline hover:underline-offset-4 dark:hover:text-[#78c85d]"
                                >
                                  {displayName}
                                </Link>
                                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                                  {freelancer.profile.freelancerProfile.title ??
                                    "Freelancer"}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {freelancer.profile.availabilityStatus
                                      .toLowerCase()
                                      .replaceAll("_", " ")}
                                  </Badge>
                                  {freelancer.profile.freelancerProfile
                                    .idVerified ? (
                                    <Badge
                                      variant="outline"
                                      className="border-[#4fae2e]/25 text-[#438f2b] dark:text-[#78c85d]"
                                    >
                                      <ShieldCheck /> Verified
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
                                    className="border border-[#4fae2e]/20 bg-[#eaf8df] dark:border-[#4fae2e]/30 dark:bg-[#4fae2e]/10"
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
                                No skills listed yet
                              </p>
                            )}

                            <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 active:translate-y-px"
                                asChild
                              >
                                <Link
                                  href={`/profiles/${freelancer.profile.id}`}
                                >
                                  View profile
                                </Link>
                              </Button>

                              {freelancer.isFollowing ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-[#4fae2e]/35 text-[#438f2b] hover:bg-destructive/10 hover:text-destructive dark:text-[#78c85d]"
                                      disabled={isPending}
                                    >
                                      {isPending ? (
                                        <Loader2 className="animate-spin" />
                                      ) : (
                                        <UserCheck />
                                      )}
                                      Following
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Unfollow {displayName}?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Their profile will be removed from your
                                        following list. You can follow them
                                        again at any time.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Keep following
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive text-white hover:bg-destructive/90"
                                        onClick={() =>
                                          void unfollowFreelancer(
                                            freelancer.freelancerId,
                                          )
                                        }
                                      >
                                        <UserMinus /> Unfollow
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                <Button
                                  size="sm"
                                  className="bg-[#4fae2e] text-white hover:bg-[#459928] active:translate-y-px"
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
                                  Follow
                                </Button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </TabsContent>

              <TabsContent value="favorites">
                {favorites.length ? (
                  <ul className="divide-y divide-border border-y border-border">
                    {favorites.map((favorite) => (
                      <li key={favorite.freelancerId}>
                        <div className="flex items-start gap-4 px-3 py-5 transition-colors hover:bg-[#eaf8df]/35 sm:px-5 dark:hover:bg-white/4">
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-semibold tracking-tight text-foreground">
                              {favorite.profile.displayName ?? "Freelancer"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {favorite.profile.freelancerProfile.title ??
                                "Freelancer"}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-1">
                              {favorite.profile.freelancerProfile.skills
                                .slice(0, 4)
                                .map((skill) => (
                                  <Badge
                                    key={skill.id}
                                    variant="secondary"
                                    className="border border-[#4fae2e]/20 bg-[#eaf8df] dark:border-[#4fae2e]/30 dark:bg-[#4fae2e]/10"
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
                              <Link href={`/profiles/${favorite.profile.id}`}>
                                View profile
                              </Link>
                            </Button>
                          </div>
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
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
                      <Heart className="size-7" />
                    </div>
                    <p className="text-lg font-medium text-foreground">
                      No favorite freelancers yet
                    </p>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                      Open a freelancer profile and tap Add to favorites to keep
                      them here.
                    </p>
                    <Button
                      className="mt-6 bg-[#4fae2e] text-white hover:bg-[#459928]"
                      asChild
                    >
                      <Link href="/forum">Visit Forum</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      {!embedded && <Footer />}
    </div>
  );
}
