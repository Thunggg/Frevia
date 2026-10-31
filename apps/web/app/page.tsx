import { HomeView } from "./components/home-view";
import authServerRequest from "@/apiRequests/auth.server";

export default async function HomePage() {
  const user = await authServerRequest.getMe();

  return <HomeView user={user} />;
}
