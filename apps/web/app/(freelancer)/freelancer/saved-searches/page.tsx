import savedSearchServerRequest from "@/apiRequests/saved-search.server";
import { SavedSearchesContent } from "../../saved-searches/saved-searches-content";

export const metadata = {
  title: "Saved Searches | Freelancer Dashboard | Frevia",
  description: "View and manage all your saved search queries.",
};

export default async function FreelancerSavedSearchesPage() {
  const savedSearches = await savedSearchServerRequest.getSavedSearches();

  return (
    <SavedSearchesContent
      savedSearches={savedSearches ?? []}
      embedded={true}
      basePath="/freelancer/saved-searches"
    />
  );
}
