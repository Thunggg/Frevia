"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

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
        retry: 1,
      },
    },
  });
}

// Browser: giữ QueryClientsingleton qua useState để tránh tạo lại mỗi render
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

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = React.useState(() => getQueryClient())[0];

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
