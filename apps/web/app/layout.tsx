import { Toaster } from "@repo/ui/components/shadcn/sonner";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { envConfig } from "@/configs/validate-env";
import authServerRequest from "@/apiRequests/auth.server";
import { NotificationProvider } from "@/providers/notification-provider";
import "./globals.css";
import QueryProvider from "@/providers/query-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Frevia — Hire talent, find work, grow together",
  description:
    "A calm freelance marketplace to hire freelancers, find paid work, and learn in the community forum.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value ?? null;
  const user = await authServerRequest.getMe();

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <QueryProvider>
            <NotificationProvider
              socketUrl={envConfig?.NESTJS_API_URL ?? ""}
              token={token}
              currentUserId={user?.id ?? null}
            >
              {children}
            </NotificationProvider>
          </QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
