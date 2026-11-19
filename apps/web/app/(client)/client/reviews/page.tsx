import authServerRequest from "@/apiRequests/auth.server";
import { ReviewManager } from "@/app/(freelancer)/freelancer/profile/review-manager";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata() {
  const t = await getTranslations("sidebar");
  return { title: `${t("navReviews")} | Frevia` };
}

export default async function ClientReviewsPage() {
  const user = await authServerRequest.getMe();
  if (!user) redirect("/login?redirect=/client/reviews");
  const t = await getTranslations("sidebar");
  const tReview = await getTranslations("reviewManager");

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border px-6 pb-6 pt-8 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("navReviews")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {tReview("completedHint")}
        </p>
      </header>
      <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
        <Suspense>
          <ReviewManager userId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}
