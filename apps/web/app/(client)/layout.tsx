import { ClientSidebar } from "./_components/client-sidebar";

export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh bg-background font-sans overflow-hidden">
      <ClientSidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <main className="flex-1 overflow-y-auto min-h-0 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
