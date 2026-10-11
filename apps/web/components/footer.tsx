import Image from "next/image";
import Link from "next/link";

const exploreLinks = [
  { href: "/find-work", label: "Find Work" },
  { href: "/forum", label: "Forum" },
  { href: "/bookmarks", label: "Bookmarks" },
] as const;

const companyLinks = [
  { href: "/", label: "Home" },
  { href: "/forum", label: "Community" },
  { href: "/register", label: "Get started" },
] as const;

const supportLinks = [
  { href: "/login", label: "Log in" },
  { href: "/account-profile", label: "Account" },
  { href: "/sessions", label: "Sessions" },
] as const;

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted-foreground transition-colors hover:text-[#4fae2e]"
      >
        {label}
      </Link>
    </li>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 inline-flex items-center gap-2">
              <Image
                src="/Logo.png"
                alt=""
                width={28}
                height={28}
                className="size-7 object-contain"
              />
              <span className="text-lg font-semibold tracking-tight text-[#4fae2e]">
                Frevia
              </span>
            </Link>
            <p className="mt-3 max-w-[28ch] text-sm leading-relaxed text-muted-foreground">
              A calm marketplace to hire freelancers, find work, and learn
              together.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Explore
            </h3>
            <ul className="space-y-2.5">
              {exploreLinks.map((link) => (
                <FooterLink key={link.href + link.label} {...link} />
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Company
            </h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <FooterLink key={link.href + link.label} {...link} />
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Support
            </h3>
            <ul className="space-y-2.5">
              {supportLinks.map((link) => (
                <FooterLink key={link.href + link.label} {...link} />
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {year} Frevia. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for freelancers and clients.
          </p>
        </div>
      </div>
    </footer>
  );
}
