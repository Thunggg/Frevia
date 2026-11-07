import { getTranslations } from "next-intl/server";
import jobAlertServerRequest from "@/apiRequests/job-alert.server";
import { JobAlertsContent } from "./job-alerts-content";

export async function generateMetadata() {
  const t = await getTranslations("jobAlerts");

  return {
    title: `${t("title")} | Frevia`,
    description: t("subtitle"),
  };
}

export default async function FreelancerJobAlertsPage() {
  const alerts = await jobAlertServerRequest.getJobAlerts();

  return <JobAlertsContent initialJobAlerts={alerts ?? []} />;
}
