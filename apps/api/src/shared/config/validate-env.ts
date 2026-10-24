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
  ACCESS_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URL: z.string(),
  NEXT_URL: z.string(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  STRIPE_SECRET_KEY: z.string().default('sk_test_dummy_key_frevia'),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .default('whsec_dummy_webhook_secret_frevia'),
  STRIPE_ACCOUNT_COUNTRY: z.string().default('US'),
  STRIPE_ACCOUNT_TYPE: z.enum(['standard', 'express']).default('standard'),
});

const envParsed = envSchema.safeParse(process.env);

if (envParsed.success === false) {
  console.error('❌ Invalid environment variables', envParsed.error.format());

  throw new Error('Invalid environment variables.');
}

export const envConfig = envParsed.data;
