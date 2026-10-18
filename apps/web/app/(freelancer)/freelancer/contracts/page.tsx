import contractServerRequest from "@/apiRequests/contract.server";
import { ContractList } from "@/app/(client)/client/contracts/_components/contract-list";

export const metadata = {
  title: "My Contracts | Freelancer Dashboard | Frevia",
  description: "View and manage all your active and past freelance contracts.",
};

export default async function FreelancerContractsPage() {
  const initialContracts = await contractServerRequest.getContracts({
    limit: 50,
  });

  return (
    <div className="min-h-full bg-background font-sans">
      <section className="border-b border-border bg-background">
        <div className="px-6 pt-8 pb-6 lg:px-8 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Contracts
          </h1>
          <p className="mt-1 text-xs font-normal text-muted-foreground">
            Track active projects, milestone deliverables, and payments.
          </p>
        </div>
      </section>

      <div className="px-6 py-8 lg:px-8 max-w-7xl mx-auto">
        <ContractList initialData={initialContracts} basePath="/freelancer" />
      </div>
    </div>
  );
}
