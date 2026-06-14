ALTER TABLE "parents"
ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "parent_sessions" (
  "id" TEXT NOT NULL,
  "parent_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "parent_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "parent_sessions_token_hash_key" ON "parent_sessions"("token_hash");
CREATE INDEX IF NOT EXISTS "parent_sessions_parent_id_idx" ON "parent_sessions"("parent_id");
CREATE INDEX IF NOT EXISTS "parent_sessions_expires_at_idx" ON "parent_sessions"("expires_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'parent_sessions_parent_id_fkey'
  ) THEN
    ALTER TABLE "parent_sessions"
    ADD CONSTRAINT "parent_sessions_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "parent_password_resets" (
  "id" TEXT NOT NULL,
  "parent_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "parent_password_resets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "parent_password_resets_token_hash_key" ON "parent_password_resets"("token_hash");
CREATE INDEX IF NOT EXISTS "parent_password_resets_parent_id_idx" ON "parent_password_resets"("parent_id");
CREATE INDEX IF NOT EXISTS "parent_password_resets_expires_at_idx" ON "parent_password_resets"("expires_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'parent_password_resets_parent_id_fkey'
  ) THEN
    ALTER TABLE "parent_password_resets"
    ADD CONSTRAINT "parent_password_resets_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "parent_email_verifications" (
  "id" TEXT NOT NULL,
  "parent_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "parent_email_verifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "parent_email_verifications_token_hash_key" ON "parent_email_verifications"("token_hash");
CREATE INDEX IF NOT EXISTS "parent_email_verifications_parent_id_idx" ON "parent_email_verifications"("parent_id");
CREATE INDEX IF NOT EXISTS "parent_email_verifications_expires_at_idx" ON "parent_email_verifications"("expires_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'parent_email_verifications_parent_id_fkey'
  ) THEN
    ALTER TABLE "parent_email_verifications"
    ADD CONSTRAINT "parent_email_verifications_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "family_access_links" (
  "id" TEXT NOT NULL,
  "family_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "label" TEXT NOT NULL DEFAULT 'Kid device link',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "expires_at" TIMESTAMP(3),
  "last_used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "family_access_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "family_access_links_token_hash_key" ON "family_access_links"("token_hash");
CREATE INDEX IF NOT EXISTS "family_access_links_family_id_idx" ON "family_access_links"("family_id");
CREATE INDEX IF NOT EXISTS "family_access_links_active_idx" ON "family_access_links"("active");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'family_access_links_family_id_fkey'
  ) THEN
    ALTER TABLE "family_access_links"
    ADD CONSTRAINT "family_access_links_family_id_fkey"
    FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "kid_pin_attempts" (
  "id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "family_id" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "kid_pin_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "kid_pin_attempts_account_id_created_at_idx" ON "kid_pin_attempts"("account_id", "created_at");
CREATE INDEX IF NOT EXISTS "kid_pin_attempts_family_id_created_at_idx" ON "kid_pin_attempts"("family_id", "created_at");

ALTER TABLE "parent_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "parent_password_resets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "parent_email_verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "family_access_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "kid_pin_attempts" ENABLE ROW LEVEL SECURITY;
