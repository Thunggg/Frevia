import { BillingPaymentsView } from "@/components/payments/billing-payments-view";

export const metadata = {
  title: "Billing & Payments | Frevia",
  description:
    "Connect Stripe Express, manage your payment methods, and view your milestone payouts and fee history.",
};

export default function FreelancerPaymentsPage() {
  return (
    <div className="min-h-full bg-[#F8F8FA] dark:bg-background font-sans">
      <section className="border-b border-border bg-background">
        <div className="px-6 pt-8 pb-6 lg:px-8 max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Billing & Payments
          </h1>
        </div>
      </section>

      <div className="px-6 py-8 lg:px-8 max-w-7xl mx-auto">
        <BillingPaymentsView mode="freelancer" />
      </div>
    </div>
  );
}
