"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  FieldValues,
  Resolver,
  ResolverOptions,
} from "react-hook-form";
import { translateBackendMessage } from "@/i18n/backend-message";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

type UnknownRecord = Record<string, unknown>;

/**
 * Duyệt cây lỗi của react-hook-form và dịch mọi trường `message`.
 * Message do schema zod sinh ra là key i18n dùng chung với backend
 * (ví dụ "Error.EmailRequired"), nên tra cùng một từ điển.
 */
function translateErrorMessages(node: unknown, locale: Locale): unknown {
  if (Array.isArray(node)) {
    return node.map((item) => translateErrorMessages(item, locale));
  }

  if (typeof node !== "object" || node === null) return node;

  const translated: UnknownRecord = {};
  for (const [key, value] of Object.entries(node as UnknownRecord)) {
    translated[key] =
      key === "message" && typeof value === "string"
        ? (translateBackendMessage(value, locale) ?? value)
        : translateErrorMessages(value, locale);
  }

  return translated;
}

/**
 * Thay thế trực tiếp `zodResolver` khi cần hiển thị thông báo validation
 * đã bản địa hoá. Nhận schema dạng `unknown` để không phụ thuộc việc
 * apps/web và @shared/types có dùng chung một bản zod hay không.
 */
export function useTranslatedResolver<TFieldValues extends FieldValues>(
  schema: unknown,
): Resolver<TFieldValues> {
  const activeLocale = useLocale();
  const locale: Locale = isLocale(activeLocale) ? activeLocale : defaultLocale;

  return useMemo(() => {
    const baseResolver = zodResolver(
      schema as never,
    ) as unknown as Resolver<TFieldValues>;

    const translatedResolver = async (
      values: TFieldValues,
      context: unknown,
      options: ResolverOptions<TFieldValues>,
    ) => {
      const result = await baseResolver(values, context, options);

      return {
        ...result,
        errors: translateErrorMessages(
          result.errors,
          locale,
        ) as typeof result.errors,
      };
    };

    return translatedResolver as unknown as Resolver<TFieldValues>;
  }, [schema, locale]);
}
