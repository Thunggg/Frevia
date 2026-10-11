import { notFound } from "next/navigation";

import authServerRequest from "@/apiRequests/auth.server";
import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import { RoleName } from "@shared/types";

import { PostDetailWrapper } from "./components/post-detail-wrapper";

type PostDetailPageProps = {
  params: Promise<{ categoryId: string; postId: string }>;
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
  const { categoryId, postId } = await params;

  const postIdNum = Number(postId);
  const categoryIdNum = Number(categoryId);

  if (
    Number.isNaN(postIdNum) ||
    postIdNum <= 0 ||
    Number.isNaN(categoryIdNum) ||
    categoryIdNum <= 0
  ) {
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
          postId={postIdNum}
          categoryId={categoryIdNum}
          currentUserId={currentUserId}
        />
      </main>
      <Footer />
    </div>
  );
}
