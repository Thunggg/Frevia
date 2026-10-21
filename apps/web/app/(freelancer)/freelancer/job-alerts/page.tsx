import { JobAlertsContent } from "./job-alerts-content";

export const metadata = {
  title: "Job Alerts | Freelancer Dashboard | Frevia",
  description: "Create and manage job alerts for matching new jobs.",
};

export default function FreelancerJobAlertsPage() {
  return <JobAlertsContent embedded />;
}