import Link from "next/link";
import { ArrowLeft, UserX } from "lucide-react";
import adminServerRequest from "@/apiRequests/admin.server";
import { Button } from "@repo/ui/components/shadcn/button";
import { UserDetailHeader } from "./components/user-detail-header";
import { UserGeneralInfo } from "./components/user-general-info";
import { UserRoleTabs } from "./components/user-role-tabs";

export const dynamic = "force-dynamic";

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  const userId = Number(id);

  if (isNaN(userId)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <UserX className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground">Invalid User ID</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          The requested user ID &quot;{id}&quot; is not valid.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to User Management
          </Link>
        </Button>
      </div>
    );
  }

  let user = null;
  try {
    user = await adminServerRequest.getUserById(userId);
  } catch (error) {
    console.error("Failed to fetch user detail:", error);
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <UserX className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground">User Not Found</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          No active user exists with ID #{userId}. The account may have been removed or does not exist.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to User Management
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Breadcrumbs, Avatar, Badges & Meta */}
      <UserDetailHeader user={user} />

      {/* 2. General Account Overview & Activity Metrics */}
      <UserGeneralInfo user={user} />

      {/* 3. Role-specific Profiles (Client, Freelancer, Admin/Custom) */}
      <UserRoleTabs user={user} />
    </div>
  );
}
