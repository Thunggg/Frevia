import { getTranslations } from "next-intl/server";
import Link from "next/link";
import authServerRequest from "@/apiRequests/auth.server";
import { canAccessAdminPortal } from "@/lib/admin-access";
import { Button } from "@repo/ui/components/shadcn/button";
import { RoleName } from "@shared/types";

export default async function NotFound() {
  const user = await authServerRequest.getMe();
  const primaryRole =
    user?.roles?.find((r) => r.isPrimary)?.name ?? user?.roles?.[0]?.name;

  let homeHref = "/";
  if (primaryRole === RoleName.CLIENT) {
    homeHref = "/client";
  } else if (primaryRole === RoleName.FREELANCER) {
    homeHref = "/freelancer";
  } else if (user && canAccessAdminPortal(user)) {
    homeHref = "/admin";
  }

  const t = await getTranslations("notFound");

  return (
    <div className="flex min-h-dvh items-center justify-center p-4 sm:p-8 lg:p-12 font-sans dark:bg-zinc-950">
      <div className="text-center flex flex-col items-center justify-center min-h-[460px] dark:bg-zinc-900 dark:border-zinc-800">
        <span className="text-xs sm:text-sm font-semibold tracking-wider text-blue-600 uppercase mb-3 dark:text-blue-400">
          {t("errorBadge")}
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-950 mb-4 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="text-sm sm:text-base text-zinc-500 max-w-lg mb-8 leading-relaxed dark:text-zinc-400">
          {t("description")}
        </p>
        <Button
          asChild
          className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 text-sm transition-all shadow-sm hover:shadow"
        >
          <Link href={homeHref}>{t("goHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
