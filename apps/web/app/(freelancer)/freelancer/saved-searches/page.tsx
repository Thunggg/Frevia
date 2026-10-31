import { getTranslations } from "next-intl/server";
import savedSearchServerRequest from "@/apiRequests/saved-search.server";
import { SavedSearchesContent } from "../../saved-searches/saved-searches-content";

export async function generateMetadata() {
  const t = await getTranslations("pageMeta");

  return {
    title: t("savedSearchesTitle"),
    description: t("savedSearchesDescription"),
  };
}

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
