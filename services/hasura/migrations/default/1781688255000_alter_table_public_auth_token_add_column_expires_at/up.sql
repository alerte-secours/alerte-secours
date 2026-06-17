ALTER TABLE "public"."auth_token" ADD COLUMN IF NOT EXISTS "expires_at" timestamptz;
