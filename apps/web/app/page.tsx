import { HomeView } from "./components/home-view";
import { getMeServer } from "@/lib/get-me";

export default async function HomePage() {
  const user = await getMeServer();

  return <HomeView user={user} />;
}
