import Image from "next/image";
import Link from "next/link";

const platformLinks = [
  { href: "/find-work", label: "Find Work" },
  { href: "/projects", label: "My Projects" },
  { href: "/bookmarks", label: "Bookmarks" },
  { href: "/conversations", label: "Messages" },
] as const;

const communityLinks = [
  { href: "/forum", label: "Forum" },
  { href: "/register", label: "Become a Freelancer" },
] as const;

const accountLinks = [
  { href: "/login", label: "Log in" },
  { href: "/register", label: "Sign up" },
  { href: "/forgot-password", label: "Forgot password" },
  { href: "/account-profile", label: "Account settings" },
  { href: "/sessions", label: "Sessions" },
] as const;

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted-foreground/70 transition-colors hover:text-[#4fae2e]"
      >
        {label}
      </Link>
    </li>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/frevia-mark.png"
                alt=""
                width={26}
                height={26}
                className="size-[26px] object-contain"
              />
              <span className="text-lg font-bold tracking-tight text-[#4fae2e]">
                Frevia
              </span>
            </Link>
            <p className="mt-3 max-w-[26ch] text-[13px] leading-relaxed text-muted-foreground/60">
              A curated marketplace connecting talented freelancers with
              visionary clients.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
              Platform
            </h3>
            <ul className="space-y-2.5">
              {platformLinks.map((link) => (
                <FooterLink key={link.href + link.label} {...link} />
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
              Community
            </h3>
            <ul className="space-y-2.5">
              {communityLinks.map((link) => (
                <FooterLink key={link.href + link.label} {...link} />
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
              Account
            </h3>
            <ul className="space-y-2.5">
              {accountLinks.map((link) => (
                <FooterLink key={link.href + link.label} {...link} />
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground/50">
            &copy; {year} Frevia. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/forum"
              className="text-xs text-muted-foreground/50 transition-colors hover:text-[#4fae2e]"
            >
              Help Center
            </Link>
            <Link
              href="/forum"
              className="text-xs text-muted-foreground/50 transition-colors hover:text-[#4fae2e]"
            >
              Community Guidelines
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
