"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useActionPermission } from "@/hooks/use-action-permission";
import { useCreateConversation } from "@/hooks/use-conversation";
import { Loader2 } from "@/components/icons";

export function UserIdAutoRedirect({ targetUserId }: { targetUserId: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("chat");
  const { can, isLoading: isPermissionLoading } = useActionPermission();
  const canStartConversation = can("POST", "/api/conversations");
  const createConversation = useCreateConversation();
  const triggeredRef = useRef(false);

  const basePath = pathname.startsWith("/client/conversations")
    ? "/client/conversations"
    : pathname.startsWith("/freelancer/conversations")
      ? "/freelancer/conversations"
      : "/conversations";

  useEffect(() => {
    if (
      isPermissionLoading ||
      triggeredRef.current ||
      !targetUserId ||
      targetUserId <= 0
    ) {
      return;
    }
    triggeredRef.current = true;

    if (!canStartConversation) {
      router.replace(basePath);
      return;
    }

    createConversation.mutate(targetUserId, {
      onSuccess: (conv) => {
        router.replace(`${basePath}/${conv.slug}`);
      },
      onError: () => {
        router.replace(basePath);
      },
    });
  }, [
    isPermissionLoading,
    targetUserId,
    createConversation,
    router,
    basePath,
    canStartConversation,
  ]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs">
      <Loader2 className="size-6 animate-spin text-[#0069D3]" />
      <span className="mt-2 text-xs text-muted-foreground">
        {t("openingConversation")}
      </span>
    </div>
  );
}
