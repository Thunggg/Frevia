import { Button } from "@repo/ui/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import type { GetMeResType } from "@shared/types";
import Link from "next/link";

type HomeViewProps = {
  user: GetMeResType | null;
};

export function HomeView({ user }: HomeViewProps) {
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Frevia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are not logged in. Sign in to view your account information.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryRole =
    user.roles.find((role) => role.isPrimary) ?? user.roles[0];

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Home</CardTitle>
          <p className="text-sm text-muted-foreground">
            Login successful. Here is your account information.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Display name
              </p>
              <p className="font-medium">
                {user.profile?.displayName ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Role</p>
              <p className="font-medium">{primaryRole?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                All roles
              </p>
              <p className="font-medium">
                {user.roles.length > 0
                  ? user.roles
                      .map(
                        (role) =>
                          `${role.name}${role.isPrimary ? " (primary)" : ""}`,
                      )
                      .join(", ")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                User ID
              </p>
              <p className="font-medium">{user.id}</p>
            </div>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
