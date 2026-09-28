import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string(),
});

const envParsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

console.log(envParsed.data);

if (envParsed.success === false) {
  console.log("Invalid environment variables", envParsed.error.format());
}

export const envConfig = envParsed.data;
