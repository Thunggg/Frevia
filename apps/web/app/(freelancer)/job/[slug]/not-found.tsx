import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@repo/ui/components/shadcn/button";

export default function JobNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header role="FREELANCER" />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <section className="max-w-md text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
            <BriefcaseBusiness className="size-7" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Job này không còn khả dụng</h1>
          <p className="mt-3 text-muted-foreground">
            Job có thể đã bị xoá, đóng hoặc tài khoản đăng job không còn hoạt động.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/find-work">Xem các job khác</Link>
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
