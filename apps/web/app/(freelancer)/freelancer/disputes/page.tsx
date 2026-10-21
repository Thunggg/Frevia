import { UserDisputesList } from "./_components/user-disputes-list";

export const metadata = {
  title: "My Disputes & Arbitration | Freelancer Dashboard | Frevia",
  description: "Track and manage all your active and past dispute cases.",
};

export default function FreelancerDisputesPage() {
  return (
    <div className="min-h-full bg-background font-sans">
      <section className="border-b border-border bg-background">
        <div className="px-6 pt-8 pb-6 lg:px-8 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Disputes & Arbitration
          </h1>
          <p className="mt-1 text-xs font-normal text-muted-foreground">
            Manage your arbitration claims, submit rebuttals, review settlement proposals, and track resolutions.
          </p>
        </div>
      </section>

      <div className="px-6 py-8 lg:px-8 max-w-7xl mx-auto">
        <UserDisputesList isFreelancer={true} />
      </div>
    </div>
  );
}
