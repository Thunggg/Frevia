import { Toaster } from "@repo/ui/components/shadcn/sonner";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { envConfig } from "@/configs/validate-env";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import QueryProvider from "@/providers/query-provider";
import { AppSocketProvider } from "./components/app-socket-provider";
import { getMeServer } from "@/lib/get-me";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Frevia",
    template: "%s | Frevia",
  },
  description: "Frevia — Connect Talent, Endless Opportunities.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value ?? null;
  const user = await getMeServer();

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <QueryProvider>
            <AppSocketProvider
              socketUrl={envConfig?.NESTJS_API_URL ?? ""}
              token={token}
              currentUserId={user?.id ?? null}
            >
              {children}
            </AppSocketProvider>
          </QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
