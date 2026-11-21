import { StringValue } from "ms";
import { z } from "zod";

const envSchema = z.object({
  APP_URL: z.string(),
  NESTJS_API_URL: z.string(),
  // URL công khai (từ trình duyệt) dùng để kết nối Socket.IO tới backend.
  // Trong Docker, NESTJS_API_URL là http://backend:3000 (chỉ gọi được giữa các container),
  // còn trình duyệt cần gọi qua port đã map ra host (vd: http://localhost:3002).
  NEXT_PUBLIC_SOCKET_URL: z.string().optional(),
  // Proxy SensitiveAI — chỉ dùng cho POST tạo bài đăng forum.
  // Không bắt buộc: nếu thiếu, POST tạo bài sẽ gọi thẳng backend.
  NESTJS_PROXY_URL: z.string().optional(),
  ACCESS_TOKEN_EXPIRES_IN: z.custom<StringValue>(),
  REFRESH_TOKEN_EXPIRES_IN: z.custom<StringValue>(),
  NODE_ENV: z.string(),
});

const envParsed = envSchema.safeParse({
  APP_URL: process.env.APP_URL,
  NESTJS_API_URL: process.env.NESTJS_API_URL,
  NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  NESTJS_PROXY_URL: process.env.NESTJS_PROXY_URL,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
  NODE_ENV: process.env.NODE_ENV,
});

if (envParsed.success === false) {
  console.log("Invalid environment variables", envParsed.error.format());
}

export const envConfig = envParsed.data;

/**
 * Trả về URL backend mà trình duyệt có thể kết nối Socket.IO tới được.
 * Ưu tiên NEXT_PUBLIC_SOCKET_URL; nếu NESTJS_API_URL đang trỏ tới hostname nội bộ
 * Docker (`http://backend:3000`) thì tự đổi về `http://localhost:3002`.
 */
export function getBrowserSocketUrl(): string {
  const explicit = (
    process.env.NEXT_PUBLIC_SOCKET_URL ??
    envConfig?.NEXT_PUBLIC_SOCKET_URL ??
    ""
  )
    .trim()
    .replace(/\/$/, "");
  if (explicit) return explicit;

  const internalApi = (envConfig?.NESTJS_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (!internalApi) return "";

  try {
    const parsed = new URL(internalApi);
    if (parsed.hostname === "backend") {
      return "http://localhost:3002";
    }
  } catch {
    // Ignore invalid URL and return raw value
  }

  return internalApi;
}
