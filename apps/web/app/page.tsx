import authServerRequest from "@/apiRequests/auth.server";
import { canAccessAdminPortal, isInternalAdminRole } from "@/lib/admin-access";
import { redirect } from "next/navigation";
import { HomeView } from "./components/home-view";

export default async function HomePage() {
  const user = await authServerRequest.getMe();

  if (user && isInternalAdminRole(user)) {
    redirect(canAccessAdminPortal(user) ? "/admin" : "/access-denied");
  }

  return <HomeView user={user} />;
}
