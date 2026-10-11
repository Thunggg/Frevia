import savedSearchServerRequest from "@/apiRequests/saved-search.server";
import { SavedSearchesContent } from "./saved-searches-content";

export default async function SavedSearchesPage() {
  const savedSearches = await savedSearchServerRequest.getSavedSearches();

  return <SavedSearchesContent savedSearches={savedSearches ?? []} />;
}
