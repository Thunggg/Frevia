"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import type { ApiResponse } from "@shared/types";

/**
 * Bọc `extractData` để gắn sẵn thông báo dự phòng đã bản địa hoá.
 *
 * `extractData` ở cấp module không truy cập được context của next-intl, nên
 * nếu throw thẳng chuỗi tiếng Anh thì toast sẽ hiện tiếng Anh cho mọi ngôn
 * ngữ. Hook này trả về phiên bản đã gắn message dịch sẵn, giữ nguyên chữ ký
 * nên các call site `.then(extractData)` không phải đổi.
 *
 * Thông báo từ backend vẫn được ưu tiên, vì nó đã đi qua tầng BFF và đã dịch.
 */
export function useApiDataExtractor(namespace: string) {
  const t = useTranslations(namespace);

  return useCallback(
    function extractData<T>(response: ApiResponse<T>): T {
      if (response.success && "data" in response) {
        return response.data;
      }

      // REVIEW (HTTP 202) từ proxy moderation:
      // { success:false, message, need_review } — không có `error.message`.
      const err = response as {
        message?: string;
        error?: { message?: string };
      };

      throw new Error(err.error?.message ?? err.message ?? t("unexpectedError"));
    },
    [t],
  );
}