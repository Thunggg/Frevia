import { Suspense } from "react";
import { PermissionsTable } from "./components/permissions-table";

export default function AdminPermissionsPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground py-12 text-center">
          Loading permissions...
        </p>
      }
    >
      <PermissionsTable />
    </Suspense>
  );
}
