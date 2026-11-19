"use client";

import React, { useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { GetMeResType } from "@shared/types";

/**
 * Tạo QueryClient với cấu hình mặc định:
 * - queries.retry: 1 → chỉ retry 1 lần nếu request thất bại
 * - queries.refetchOnWindowFocus: false → không refetch khi chuyển tab
 * - queries.refetchOnReconnect: true → refetch khi mất mạng rồi kết nối lại
 * - queries.staleTime: 60s → dữ liệu được coi là "fresh" trong 60s
 * - queries.gcTime: 5 phút → giữ data trong cache 5 phút sau khi unmount
 * - mutations.retry: 1 → chỉ retry mutation 1 lần
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        staleTime: 60 * 1000, // 60 giây
        gcTime: 5 * 60 * 1000, // 5 phút
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

// Browser: giữ QueryClient singleton để không mất cache khi điều hướng
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: tạo mới mỗi request để tránh sharing state giữa users
    return makeQueryClient();
  }
  // Browser: reuse client cũ nếu có
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

function getUserFingerprint(user: GetMeResType | null | undefined): string {
  if (!user) return "guest";
  const roles = (user.roles ?? [])
    .map((r) => `${r.id ?? ""}:${r.name}:${r.isPrimary ? 1 : 0}`)
    .join(",");
  const permissionsKey = [...(user.permissions ?? [])].sort().join(",");
  return `${user.id}|${roles}|${permissionsKey}|${user.profile?.displayName ?? ""}|${user.profile?.avatarUrl ?? ""}`;
}

export default function QueryProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: GetMeResType | null;
}) {
  const [queryClient] = React.useState(() => {
    const client = getQueryClient();
    // Nạp sẵn ["me"] từ SSR ngay trước lần render đầu tiên để tránh nháy
    // "Không có quyền truy cập" và bỏ vòng gọi /api/auth/me thừa khi reload trang.
    if (initialUser !== undefined) {
      client.setQueryData<GetMeResType | null>(["me"], initialUser);
    }
    return client;
  });

  const lastFingerprintRef = useRef<string | null>(
    initialUser !== undefined ? getUserFingerprint(initialUser) : null,
  );

  useEffect(() => {
    if (initialUser === undefined) return;
    const nextFingerprint = getUserFingerprint(initialUser);
    if (nextFingerprint !== lastFingerprintRef.current) {
      lastFingerprintRef.current = nextFingerprint;
      queryClient.setQueryData<GetMeResType | null>(["me"], initialUser);
    }
  }, [initialUser, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
