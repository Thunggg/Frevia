import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { redirect } from "next/navigation";
import { ExpertShell } from "./expert-shell";

export default async function ExpertLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await authServerRequest.getMe();
  const primaryRole = user?.roles.find((role) => role.isPrimary)?.name;
  if (!user) redirect("/login");
  if (primaryRole !== RoleName.EXPERT) redirect("/access-denied");
  return <ExpertShell>{children}</ExpertShell>;
}
