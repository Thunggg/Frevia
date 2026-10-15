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
  src: "./fonts/Poppins-Regular.ttf",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/Poppins-SemiBold.ttf",
  variable: "--font-geist-mono",
});

const aquire = localFont({
  src: "./fonts/JoscelynnDemoRegular.ttf",
  variable: "--font-aquire",
});

const materialSymbols = localFont({
  src: "./fonts/material-symbols-outlined.woff2",
  variable: "--font-material-symbols",
  display: "block",
});

export const metadata: Metadata = {
  title: "Frevia | Hire talent, find work, grow together",
  description:
    "A calm freelance marketplace to hire freelancers, find paid work, and learn in the community forum.",
  icons: {
    icon: [{ url: "/frevia-mark.png", type: "image/png" }],
    apple: [{ url: "/frevia-mark.png" }],
  },
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
      <body className={`${geistSans.variable} ${geistMono.variable} ${aquire.variable} ${materialSymbols.variable} font-sans antialiased`}>
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
