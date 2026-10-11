import { AppHeader } from "@/components/app-header";
import { HomeView } from "./components/home-view";
import { getMeServer } from "@/lib/get-me";

export default async function HomePage() {
  const user = await getMeServer();

  return (
    <>
      <AppHeader />
      <HomeView user={user} />
    </>
  );
}
