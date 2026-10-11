import { notFound } from "next/navigation";

import authServerRequest from "@/apiRequests/auth.server";
import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import { extractIdFromSlug } from "@/lib/slug-utils";
import { RoleName } from "@shared/types";

import { PostDetailWrapper } from "./components/post-detail-wrapper";

type PostDetailPageProps = {
  params: Promise<{ categorySlug: string; postSlug: string }>;
};

function resolveHeaderRole(
  user: Awaited<ReturnType<typeof authServerRequest.getMe>>,
): UserRole {
  if (!user) return "GUEST";

  const primaryRole =
    user.roles.find((role) => role.isPrimary) ?? user.roles[0];

  if (primaryRole?.name === RoleName.CLIENT) return "CLIENT";
  if (primaryRole?.name === RoleName.FREELANCER) return "FREELANCER";

  return "FREELANCER";
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { categorySlug, postSlug } = await params;
  const categoryId = extractIdFromSlug(categorySlug);
  const postId = extractIdFromSlug(postSlug);

  if (!categoryId || !postId) {
    notFound();
  }

  const user = await authServerRequest.getMe();
  const currentUserId = user?.id ?? null;
  const role = resolveHeaderRole(user);

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={role} />
      <main className="flex-1">
        <PostDetailWrapper
          postId={postId}
          categoryId={categoryId}
          categorySlug={categorySlug}
          postSlug={postSlug}
          currentUserId={currentUserId}
        />
      </main>
      <Footer />
    </div>
  );
}
