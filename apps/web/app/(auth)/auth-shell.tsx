import { Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className="relative hidden w-[42%] max-w-xl flex-col overflow-hidden bg-[oklch(0.42_0.145_155)] p-12 text-white lg:flex">
        <div className="absolute inset-0 [background-image:radial-gradient(90%_70%_at_85%_-10%,rgba(255,255,255,0.07),transparent_55%)]" />

        <div className="relative z-10 flex h-full flex-col">
          <Link href="/" className="inline-flex items-center gap-2 self-start">
            <Image
              src="/Logo.png"
              alt="Frevia"
              width={28}
              height={28}
              className="size-7 object-contain"
              priority
            />
            <span className="text-lg font-semibold tracking-tight">Frevia</span>
          </Link>

          <div className="mt-auto max-w-sm">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/75">
              Freelance marketplace
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-snug tracking-tight xl:text-4xl">
              Hire trusted talent. Deliver great work. Get paid on time.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-white/85">
              Post jobs, manage contracts, and collaborate with verified
              freelancers from a single workspace.
            </p>
          </div>

          <div className="mt-14 flex items-center justify-between border-t border-white/25 pt-6 text-xs text-white/70">
            <span>&copy; 2026 Frevia</span>
            <nav className="flex gap-5">
              <Link href="#" className="transition-colors hover:text-white">
                Terms
              </Link>
              <Link href="#" className="transition-colors hover:text-white">
                Privacy
              </Link>
              <Link href="#" className="transition-colors hover:text-white">
                Support
              </Link>
            </nav>
          </div>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center justify-end">
          <Link
            href="#"
            className="hidden text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline sm:inline-flex"
          >
            Contact support
          </Link>
        </div>

        <div className="mx-auto flex min-h-0 w-full max-w-[500px] flex-1 overflow-y-auto overflow-x-hidden py-6">
          {children}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Globe className="size-3.5" />
            English (United States)
          </span>
          <nav className="flex gap-5">
            <Link href="#" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              Status
            </Link>
          </nav>
        </footer>
      </main>
    </div>
  );
}
