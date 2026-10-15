import contractServerRequest from "@/apiRequests/contract.server";
import { ContractList } from "./_components/contract-list";

export const metadata = {
  title: "My Contracts | Frevia",
  description: "View and manage all your active and past freelance contracts.",
};

export default async function ClientContractsPage() {
  const initialContracts = await contractServerRequest.getContracts({ limit: 50 });

  return (
    <div className="min-h-full bg-background font-sans">
      <section className="border-b border-border bg-background">
        <div className="px-6 pt-8 pb-6 lg:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            My Contracts
          </h1>
        </div>
      </section>

      <div className="px-6 py-8 lg:px-8 max-w-7xl mx-auto">
        <ContractList initialData={initialContracts} />
      </div>
    </div>
  );
}
