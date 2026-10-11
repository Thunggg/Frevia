import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";

export default function ForumLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
