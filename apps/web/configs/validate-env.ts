import { StringValue } from "ms";
import { z } from "zod";

const envSchema = z.object({
  NESTJS_API_URL: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.custom<StringValue>(),
  REFRESH_TOKEN_EXPIRES_IN: z.custom<StringValue>(),
  NODE_ENV: z.string(),
});

const envParsed = envSchema.safeParse({
  NESTJS_API_URL: process.env.NESTJS_API_URL,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
  NODE_ENV: process.env.NODE_ENV,
});

if (envParsed.success === false) {
  console.log("Invalid environment variables", envParsed.error.format());
}

export const envConfig = envParsed.data;
