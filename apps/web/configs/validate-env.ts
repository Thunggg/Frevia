import { StringValue } from "ms";
import { z } from "zod";

const envSchema = z.object({
  APP_URL: z.string(),
  NESTJS_API_URL: z.string(),
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
  NESTJS_PROXY_URL: process.env.NESTJS_PROXY_URL,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
  NODE_ENV: process.env.NODE_ENV,
});

if (envParsed.success === false) {
  console.log("Invalid environment variables", envParsed.error.format());
}

export const envConfig = envParsed.data;
