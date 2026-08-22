import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

export const configSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL must be specified'),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN must be specified'),
  ATTENDANCE_TIMEZONE: z.string().default('Asia/Kolkata'),
  ATTENDANCE_LATE_AFTER: z.string().default('09:00'),
});

export type Config = z.infer<typeof configSchema>;

/**
 * Pure function to validate environment configuration.
 * Can be tested in isolation with various mock environments.
 */
export function validateConfig(env: Record<string, unknown>): Config {
  return configSchema.parse(env);
}

// Global configuration instance evaluated at startup
let config: Config;
try {
  config = validateConfig(process.env);
} catch (error: any) {
  console.error('❌ Environment configuration validation failed:');
  if (error instanceof z.ZodError) {
    console.error(JSON.stringify(error.format(), null, 2));
  } else {
    console.error(error.message || error);
  }
  process.exit(1);
}

export { config };
