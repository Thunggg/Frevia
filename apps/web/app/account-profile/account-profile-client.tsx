"use client";

import { accountProfileApi } from "@/apiRequests/account-profile";
import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import { ApiFail } from "@/lib/http";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/shadcn/tabs";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  Building2,
  ExternalLink,
  Heart,
  Link2,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  DocumentType,
  SocialPlatform,
  VerificationStatus,
  type ClientProfileDetailType,
  type DocumentTypeType,
  type FavoriteFreelancerType,
  type IdentityVerificationStatusType,
  type SocialLinkType,
  type SocialPlatformType,
} from "@shared/types";

type Props = { userId: number | null; headerRole: UserRole };

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

export function AccountProfileClient({ userId, headerRole }: Props) {
  const [identity, setIdentity] =
    useState<IdentityVerificationStatusType | null>(null);
  const [clientProfile, setClientProfile] =
    useState<ClientProfileDetailType | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinkType[]>([]);
  const [favorites, setFavorites] = useState<FavoriteFreelancerType[]>([]);
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
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [website, setWebsite] = useState("");

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
        setClientProfile(profile);
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

  useEffect(() => void load(), [load]);

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

  const saveCompany = async (event: FormEvent) => {
    event.preventDefault();
    setPending("company");
    try {
      const response = await accountProfileApi.updateClientProfile({
        companyName,
        companyDescription: companyDescription || null,
        website: website || null,
      });
      setClientProfile(response.data);
      toastSuccess({ message: "Company information updated." });
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

  const removeFavorite = async (freelancerId: number) => {
    setPending(`favorite-${freelancerId}`);
    try {
      await accountProfileApi.removeFavorite(freelancerId);
      setFavorites((current) =>
        current.filter((item) => item.freelancerId !== freelancerId),
      );
      toastSuccess({ message: "Freelancer removed from favorites." });
    } catch (error) {
      toastError({ message: errorMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const defaultTab = headerRole === "CLIENT" ? "company" : "identity";

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={headerRole} />

      <main className="flex-1">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="transition-colors hover:text-[#4fae2e]">
                Home
              </Link>
              <span className="mx-2 text-foreground/35">/</span>
              <span className="font-medium text-foreground">
                Profile & settings
              </span>
            </nav>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Profile & trust settings
            </h1>
            <p className="mt-2 max-w-[42ch] text-base text-foreground/70 dark:text-foreground/75">
              Manage the information that helps people trust and contact you.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="size-8 animate-spin text-[#4fae2e]" />
          </div>
        ) : (
          <Tabs defaultValue={defaultTab}>
            <TabsList
              variant="line"
              className="mb-8 w-full justify-start overflow-x-auto overflow-y-hidden"
            >
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
              {headerRole === "CLIENT" ? (
                <TabsTrigger value="favorites">
                  <Heart /> Favorites
                </TabsTrigger>
              ) : null}
            </TabsList>

            <TabsContent value="identity">
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="rounded-xl border border-border p-5 sm:p-6">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    Upload identity document
                  </h2>
                  <form className="mt-5 space-y-5" onSubmit={uploadDocument}>
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
                      <Label htmlFor="identity-file">
                        PDF, JPG or PNG (maximum 10 MB)
                      </Label>
                      <Input
                        id="identity-file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(event) =>
                          setDocumentFile(event.target.files?.[0] ?? null)
                        }
                      />
                    </div>
                    <Button
                      className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                      disabled={pending === "identity"}
                    >
                      {pending === "identity" ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Upload />
                      )}{" "}
                      Upload for review
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
                                {new Date(document.createdAt).toLocaleString()}
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

            <TabsContent value="company">
              <div className="max-w-3xl rounded-xl border border-border p-5 sm:p-6">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Company information
                </h2>
                <form className="mt-5 space-y-5" onSubmit={saveCompany}>
                  <div className="space-y-2">
                    <Label>Company name</Label>
                    <Input
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      required
                      maxLength={255}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      rows={6}
                      value={companyDescription}
                      onChange={(event) =>
                        setCompanyDescription(event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input
                      type="url"
                      placeholder="https://company.com"
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                      disabled={pending === "company"}
                    >
                      {pending === "company" ? (
                        <Loader2 className="animate-spin" />
                      ) : null}{" "}
                      Save changes
                    </Button>
                    {clientProfile ? (
                      <Button variant="outline" asChild>
                        <Link href={`/clients/${userId}`}>
                          View public profile
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </form>
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
                                  {skill.skillName}
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
      <Footer />
    </div>
  );
}
