"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCreateConversation } from "@/hooks/use-conversation";
import { Loader2 } from "@/components/icons";

export function UserIdAutoRedirect({ targetUserId }: { targetUserId: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const createConversation = useCreateConversation();
  const triggeredRef = useRef(false);

  const basePath = pathname.startsWith("/client/conversations")
    ? "/client/conversations"
    : "/conversations";

  useEffect(() => {
    if (triggeredRef.current || !targetUserId || targetUserId <= 0) return;
    triggeredRef.current = true;

    createConversation.mutate(targetUserId, {
      onSuccess: (conv) => {
        router.replace(`${basePath}/${conv.id}`);
      },
      onError: () => {
        router.replace(basePath);
      },
    });
  }, [targetUserId, createConversation, router, basePath]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs">
      <Loader2 className="size-6 animate-spin text-[#0069D3]" />
      <span className="mt-2 text-xs text-muted-foreground">
        Opening conversation...
      </span>
    </div>
  );
}
