import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@repo/ui/components/shadcn/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role="GUEST" />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <section className="max-w-md text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#12331f]">
            <FileQuestion className="size-7" />
          </div>
          <p className="mt-6 text-sm font-medium text-[#4fae2e]">404</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="mt-3 text-muted-foreground">
            The page you are looking for does not exist or may have been moved.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              className="bg-[#4fae2e] text-white hover:bg-[#459928] dark:bg-[#4fae2e] dark:text-white dark:hover:bg-[#5bc03a]"
              asChild
            >
              <Link href="/">Go home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/find-work">Find work</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
