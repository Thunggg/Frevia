"use client";

import { accountProfileApi } from "@/apiRequests/account-profile";
import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import { ApiFail } from "@/lib/http";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
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
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header role={headerRole} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-7">
          <h1 className="text-3xl font-bold">Profile & trust settings</h1>
          <p className="mt-2 text-muted-foreground">
            Manage the information that helps people trust and contact you.
          </p>
        </div>
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue={defaultTab}>
            <TabsList className="mb-6">
              {headerRole === "FREELANCER" && (
                <TabsTrigger value="identity">
                  <ShieldCheck /> Identity
                </TabsTrigger>
              )}
              {headerRole === "CLIENT" && (
                <TabsTrigger value="company">
                  <Building2 /> Company
                </TabsTrigger>
              )}
              <TabsTrigger value="social">
                <Link2 /> Social links
              </TabsTrigger>
              {headerRole === "CLIENT" && (
                <TabsTrigger value="favorites">
                  <Heart /> Favorites
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="identity">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload identity document</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-5" onSubmit={uploadDocument}>
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
                      <Button disabled={pending === "identity"}>
                        {pending === "identity" ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Upload />
                        )}{" "}
                        Upload for review
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Verification status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Badge
                      variant={
                        identity?.status === VerificationStatus.APPROVED
                          ? "default"
                          : "secondary"
                      }
                    >
                      {identity?.status ?? "NOT SUBMITTED"}
                    </Badge>
                    {identity?.documents.length ? (
                      identity.documents.map((document) => (
                        <div
                          key={document.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="font-medium">
                              {labels[document.documentType]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(document.createdAt).toLocaleString()}
                            </p>
                            {document.reviewNotes && (
                              <p className="mt-1 text-sm text-destructive">
                                {document.reviewNotes}
                              </p>
                            )}
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
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No documents submitted yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="company">
              <Card className="max-w-3xl">
                <CardHeader>
                  <CardTitle>Company information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-5" onSubmit={saveCompany}>
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
                    <div className="flex gap-3">
                      <Button disabled={pending === "company"}>
                        {pending === "company" && (
                          <Loader2 className="animate-spin" />
                        )}{" "}
                        Save changes
                      </Button>
                      {clientProfile && (
                        <Button variant="outline" asChild>
                          <Link href={`/clients/${userId}`}>
                            View public profile
                          </Link>
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social">
              <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Add social link</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4" onSubmit={addSocialLink}>
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
                      <Button disabled={pending === "social"}>
                        <Plus /> Add link
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Your links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {socialLinks.length ? (
                      socialLinks.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center gap-3 rounded-lg border p-3"
                        >
                          <Link2 className="size-4" />
                          <a
                            className="min-w-0 flex-1 truncate text-sm text-primary hover:underline"
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
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No social links added yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="favorites">
              <div className="grid gap-4 md:grid-cols-2">
                {favorites.length ? (
                  favorites.map((favorite) => (
                    <Card key={favorite.freelancerId}>
                      <CardContent className="flex items-start gap-4 pt-6">
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-semibold">
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
                                <Badge key={skill.id} variant="secondary">
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
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="md:col-span-2">
                    <CardContent className="py-16 text-center">
                      <Heart className="mx-auto size-9 text-muted-foreground" />
                      <p className="mt-3 font-medium">
                        No favorite freelancers yet
                      </p>
                      <Button className="mt-4" asChild>
                        <Link href="/find-work">Discover freelancers</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Footer />
    </div>
  );
}
