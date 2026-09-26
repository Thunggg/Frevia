import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string(),
  PORT: z.string(),
  NODE_ENV: z.string(),
});

const envParsed = envSchema.safeParse(process.env);

if (envParsed.success === false) {
  console.error('❌ Invalid environment variables', envParsed.error.format());

  throw new Error('Invalid environment variables.');
}

export const envConfig = envParsed.data;
