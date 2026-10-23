import { ClientPaymentsView } from "./_components/client-payments-view";

export const metadata = {
  title: "Billing & Transactions | Frevia",
  description: "View and manage all your escrow deposits, contract milestones, platform fees, and refunds.",
};

export default function ClientPaymentsPage() {
  return (
    <div className="min-h-full bg-background font-sans">
      <section className="border-b border-border bg-background">
        <div className="px-6 pt-8 pb-6 lg:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Billing & Payments
          </h1>
        </div>
      </section>

      <div className="px-6 py-8 lg:px-8 max-w-7xl mx-auto">
        <ClientPaymentsView />
      </div>
    </div>
  );
}
