"use client";

import { useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { NotificationItemType } from "@shared/types";
import { translateBackendMessage } from "@/i18n/backend-message";
import { isLocale } from "@/i18n/config";

/**
 * Các loại thông báo đã có câu chữ trong namespace `notificationText`.
 *
 * Danh sách này phải khớp với từ điển `i18n/messages/{en,vi}.json`;
 * script `check-i18n` sẽ báo lỗi nếu hai bên lệch nhau.
 */
export const TRANSLATABLE_NOTIFICATION_TYPES = [
  "NEW_FOLLOWER",
  "PROPOSAL_ACCEPTED",
  "REVIEW_RECEIVED",
  "REVIEW_RESPONSE_RECEIVED",
] as const;

/**
 * `SYSTEM_ANNOUNCEMENT` được dùng chung cho nhiều nội dung khác nhau nên bản
 * thân `type` không đủ để suy ra câu chữ; backend ghi thêm `data.kind` cho
 * những trường hợp đó.
 */
export const TRANSLATABLE_NOTIFICATION_KINDS = [
  "PROFILE_SUPERSEDED",
  "PROFILE_APPROVED",
  "PROFILE_REJECTED",
] as const;

type NotificationSource = Pick<
  NotificationItemType,
  "type" | "title" | "message" | "data"
>;

/** Tên người gây ra thông báo, mỗi loại lưu dưới một khoá khác nhau. */
const NAME_PARAM_KEYS = [
  "followerName",
  "reviewerName",
  "responderName",
] as const;

/**
 * Một số thông báo có thêm vế câu chỉ xuất hiện khi backend gửi kèm dữ liệu
 * bổ sung — ví dụ lý do từ chối hồ sơ.
 */
const CONDITIONAL_MESSAGE_KEYS: Record<string, { param: string; key: string }> =
  {
    PROFILE_REJECTED: { param: "reviewNotes", key: "messageWithReason" },
  };

function toPayload(data: unknown): Record<string, unknown> {
  return data && typeof data === "object"
    ? (data as Record<string, unknown>)
    : {};
}

function readText(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function includesKey(
  keys: readonly string[],
  value: string,
): boolean {
  return keys.includes(value);
}

/**
 * Suy ra khoá từ điển từ loại thông báo, hoặc `null` nếu loại đó chưa có
 * bản dịch.
 */
function resolveDictionaryKey(notification: NotificationSource): string | null {
  if (notification.type === "SYSTEM_ANNOUNCEMENT") {
    const kind = readText(toPayload(notification.data), "kind");
    return includesKey(TRANSLATABLE_NOTIFICATION_KINDS, kind) ? kind : null;
  }

  return includesKey(TRANSLATABLE_NOTIFICATION_TYPES, notification.type)
    ? notification.type
    : null;
}

/**
 * Dịch tiêu đề và nội dung thông báo từ `type` + `data`, thay vì đọc thẳng cột
 * `title`/`message` mà backend đã lưu sẵn bằng tiếng Anh.
 *
 * Nhờ dựng lại câu từ dữ liệu có cấu trúc, thông báo cũ trong DB cũng dịch được
 * theo ngôn ngữ đang chọn — không cần backfill.
 *
 * Loại chưa có trong từ điển sẽ rơi về nguyên văn chuỗi backend đã lưu.
 */
export function useNotificationText() {
  const t = useTranslations("notificationText");
  const locale = useLocale();

  return useCallback(
    (notification: NotificationSource, fallbackTitle: string) => {
      const key = resolveDictionaryKey(notification);
      if (!key) {
        return {
          title: notification.title ?? fallbackTitle,
          message: notification.message,
        };
      }

      const payload = toPayload(notification.data);
      const rawName =
        NAME_PARAM_KEYS.map((paramKey) => readText(payload, paramKey)).find(
          (value) => value !== "",
        ) ?? "";
      // Backend có thể lưu khoá `Fallback.*` thay cho tên (ví dụ đối tác hợp
      // đồng không có displayName); dịch để không lộ khoá thô cho người dùng.
      const params = {
        name: isLocale(locale)
          ? (translateBackendMessage(rawName, locale) ?? rawName)
          : rawName,
        jobTitle: readText(payload, "jobTitle"),
        contractId: readText(payload, "contractId"),
        notes: readText(payload, "reviewNotes"),
      };

      const conditional = CONDITIONAL_MESSAGE_KEYS[key];
      const messageKey =
        conditional && readText(payload, conditional.param) !== ""
          ? `${key}.${conditional.key}`
          : `${key}.message`;

      return {
        title: t(`${key}.title`, params),
        message: t(messageKey, params),
      };
    },
    [t, locale],
  );
}
