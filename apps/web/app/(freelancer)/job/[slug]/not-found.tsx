import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@repo/ui/components/shadcn/button";

export default function JobNotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role="GUEST" />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <section className="max-w-md text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#12331f]">
            <BriefcaseBusiness className="size-7" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
            This job is no longer available
          </h1>
          <p className="mt-3 text-muted-foreground">
            It may have been closed, removed, or the posting is no longer
            active.
          </p>
          <Button
            className="mt-6 bg-[#4fae2e] text-white hover:bg-[#459928] dark:bg-[#4fae2e] dark:text-white dark:hover:bg-[#5bc03a]"
            asChild
          >
            <Link href="/find-work">Browse other jobs</Link>
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
