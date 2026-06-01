import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  RETELL_API_KEY: z.string(),
  RETELL_WEBHOOK_SECRET: z.string(),

  ANTHROPIC_API_KEY: z.string(),

  WHATSAPP_API_TOKEN: z.string(),
  WHATSAPP_PHONE_NUMBER_ID: z.string(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string(),

  N8N_WEBHOOK_URL: z.string().url(),
  N8N_API_KEY: z.string().optional(),

  AIRTABLE_API_KEY: z.string().optional(),
  AIRTABLE_BASE_ID: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Ungültige Umgebungsvariablen:", parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
