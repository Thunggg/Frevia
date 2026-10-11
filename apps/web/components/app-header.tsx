import { Header, type UserRole } from "@/components/header";
import { getMeServer } from "@/lib/get-me";

export async function AppHeader() {
  const user = await getMeServer();

  let role: UserRole = "GUEST";
  if (user && user.roles.length > 0) {
    const primaryRole =
      user.roles.find((role) => role.isPrimary) ?? user.roles[0];
    role = primaryRole.name === "FREELANCER" ? "FREELANCER" : "CLIENT";
  }

  return <Header role={role} />;
}
