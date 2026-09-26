import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string(),
  DIRECT_URL: z.string(),
  NODE_ENV: z.string(),
  OTP_EXPIRES_IN: z.string(),
  OTP_ATTEMPT_WINDOW: z.string(),
  EMAIL_USERNAME: z.string(),
  EMAIL_PASSWORD: z.string(),
});

const envParsed = envSchema.safeParse(process.env);

if (envParsed.success === false) {
  console.error('❌ Invalid environment variables', envParsed.error.format());

  throw new Error('Invalid environment variables.');
}

export const envConfig = envParsed.data;
