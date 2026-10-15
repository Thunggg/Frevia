import Link from "next/link";

const platformLinks = [
  { href: "/find-work", label: "Find Work" },
  { href: "/conversations", label: "Messages" },
] as const;

const communityLinks = [
  { href: "/forum", label: "Forum" },
  { href: "/register", label: "Become a Freelancer" },
] as const;

function SocialButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex size-10 items-center justify-center rounded-full border border-gray-900/30 text-gray-900 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-900 hover:bg-gray-900 hover:text-white dark:border-white/30 dark:text-white dark:hover:bg-white dark:hover:text-black"
    >
      {children}
    </a>
  );
}

function CenterTechWidget() {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {/* Left Dot Matrix & Bracket */}
      <div className="hidden sm:block">
        <svg
          width="160"
          height="90"
          viewBox="0 0 160 90"
          fill="none"
          className="text-[#34d399] dark:text-[#10b981]"
        >
          {/* 6 columns x 8 rows of dots */}
          {[10, 24, 38, 52, 66, 80].map((x, colIdx) =>
            [8, 19, 30, 41, 52, 63, 74, 85].map((y, rowIdx) => {
              const isAccent =
                (colIdx === 2 && rowIdx === 1) ||
                (colIdx === 4 && rowIdx === 3) ||
                (colIdx === 1 && rowIdx === 6);
              return (
                <circle
                  key={`left-${x}-${y}`}
                  cx={x}
                  cy={y}
                  r={isAccent ? 2 : 1.25}
                  className={
                    isAccent
                      ? "fill-[#10b981] opacity-90 dark:fill-[#34d399]"
                      : "fill-[#059669]/35 dark:fill-[#34d399]/30"
                  }
                />
              );
            }),
          )}
          {/* Bracket line */}
          <path
            d="M 95 8 C 115 8, 115 45, 130 45 L 160 45 M 95 85 C 115 85, 115 45, 130 45"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            className="opacity-60 dark:opacity-75"
          />
        </svg>
      </div>

      {/* Center Button (Get a Demo / Get Started FREE) */}
      <Link
        href="/find-work"
        className="group inline-flex shrink-0 items-center gap-3 rounded-xl bg-[#18181b] px-6 py-3.5 text-sm font-medium text-white shadow-xl shadow-emerald-950/15 transition-all duration-200 hover:scale-[1.03] hover:bg-black hover:shadow-2xl active:scale-[0.98] dark:border dark:border-white/10 dark:bg-black"
      >
        <span className="font-semibold text-white tracking-wide">Find Work</span>
        <span className="rounded-md bg-[#27272a] px-2 py-0.5 text-[11px] font-bold tracking-wider text-[#34d399]">
          NOW
        </span>
      </Link>

      {/* Right Bracket & Dot Matrix */}
      <div className="hidden sm:block">
        <svg
          width="160"
          height="90"
          viewBox="0 0 160 90"
          fill="none"
          className="text-[#34d399] dark:text-[#10b981]"
        >
          {/* Bracket line */}
          <path
            d="M 65 8 C 45 8, 45 45, 30 45 L 0 45 M 65 85 C 45 85, 45 45, 30 45"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            className="opacity-60 dark:opacity-75"
          />
          {/* 6 columns x 8 rows of dots */}
          {[80, 94, 108, 122, 136, 150].map((x, colIdx) =>
            [8, 19, 30, 41, 52, 63, 74, 85].map((y, rowIdx) => {
              const isAccent =
                (colIdx === 1 && rowIdx === 2) ||
                (colIdx === 3 && rowIdx === 5) ||
                (colIdx === 0 && rowIdx === 4);
              return (
                <circle
                  key={`right-${x}-${y}`}
                  cx={x}
                  cy={y}
                  r={isAccent ? 2 : 1.25}
                  className={
                    isAccent
                      ? "fill-[#10b981] opacity-90 dark:fill-[#34d399]"
                      : "fill-[#059669]/35 dark:fill-[#34d399]/30"
                  }
                />
              );
            }),
          )}
        </svg>
      </div>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footerRoot relative w-full overflow-hidden text-gray-900 dark:text-gray-100 transition-colors duration-300 border-t border-transparent dark:border-white/5">
      <style>{`
        .footerRoot {
          background: linear-gradient(180deg, #ffffff 0%, #eefcf3 20%, #bbf7d0 60%, #86efac 100%);
        }
        :is(.dark, [data-theme="dark"], html.dark) .footerRoot {
          background: linear-gradient(180deg, #09090b 0%, #052417 30%, #06442b 68%, #053b26 100%);
        }
      `}</style>
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-4 sm:px-8 lg:px-12">
        {/* Top 3-Section Row */}
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
          {/* Left: Socials, Email, Address */}
          <div className="w-full text-left md:w-[30%]">
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <SocialButton href="https://facebook.com" label="Facebook">
                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </SocialButton>
              <SocialButton href="https://linkedin.com" label="LinkedIn">
                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34m1.39 9.74v-8.37H5.07v8.37h2.78z" />
                </svg>
              </SocialButton>
              <SocialButton href="https://x.com" label="X (Twitter)">
                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </SocialButton>
            </div>

            {/* Email */}
            <div className="mt-8">
              <a
                href="mailto:hello@frevia.com"
                className="text-2xl font-bold tracking-tight text-gray-900 transition-colors hover:text-emerald-700 dark:text-white"
              >
                hello@frevia.com
              </a>
            </div>

            {/* Address */}
            <div className="mt-6 space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>Harju maakond, Tallinn,</p>
              <p>Kesklinna linnaosa,</p>
              <p>Vesivärava tn 50-201, 10152</p>
            </div>
          </div>

          {/* Center: Get a Demo Button with Symmetrical Tech Connectors */}
          <div className="flex w-full justify-center md:w-[35%]">
            <CenterTechWidget />
          </div>

          {/* Right: Navigation Links chia đều 2 bên (2 columns) */}
          <div className="w-full text-right md:w-[30%]">
            {/* Cột 1 (Bên trái): Platform & Community */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
                  Platform
                </h3>
                <ul className="mt-3 space-y-2">
                  {platformLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-700 dark:text-gray-300 dark:hover:text-emerald-400"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-base font-bold tracking-tight text-gray-950 dark:text-white">
                  Community
                </h3>
                <ul className="mt-3 space-y-2">
                  {communityLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm font-medium text-gray-700 transition-colors hover:text-emerald-700 dark:text-gray-300 dark:hover:text-emerald-400"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Legal Row */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 text-xs font-medium text-gray-600 sm:flex-row dark:text-gray-400">
          <Link
            href="/forum"
            className="underline underline-offset-4 transition-colors hover:text-gray-900 dark:hover:text-white"
          >
            Terms and conditions
          </Link>

          <p className="text-center">
            &copy; {year} Frevia. All Rights Reserved
          </p>

          <Link
            href="/forum"
            className="transition-colors hover:text-gray-900 dark:hover:text-white"
          >
            Privacy Policy
          </Link>
        </div>

        {/* Giant Watermark at Bottom */}
        <div
          className="flex w-full justify-center overflow-hidden select-none pointer-events-none"
          style={{ marginTop: "1rem", marginBottom: "-2.5rem" }}
        >
          <span
            className="font-bold tracking-tighter text-emerald-950/15 dark:text-white/15 lowercase"
            style={{
              fontSize: "clamp(120px, 23vw, 380px)",
              lineHeight: 0.9,
              display: "block",
            }}
          >
            frevia
          </span>
        </div>
      </div>
    </footer>
  );
}
