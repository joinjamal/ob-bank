CREATE TABLE IF NOT EXISTS "families" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "parents" (
  "id" TEXT NOT NULL,
  "family_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "password_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "accounts"
ADD COLUMN IF NOT EXISTS "family_id" TEXT;

ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "accounts_name_key";

CREATE UNIQUE INDEX IF NOT EXISTS "parents_email_key" ON "parents"("email");
CREATE INDEX IF NOT EXISTS "parents_family_id_idx" ON "parents"("family_id");
CREATE INDEX IF NOT EXISTS "accounts_family_id_idx" ON "accounts"("family_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'parents_family_id_fkey'
  ) THEN
    ALTER TABLE "parents"
    ADD CONSTRAINT "parents_family_id_fkey"
    FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'accounts_family_id_fkey'
  ) THEN
    ALTER TABLE "accounts"
    ADD CONSTRAINT "accounts_family_id_fkey"
    FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

WITH family_row AS (
  INSERT INTO "families" ("id", "name", "updated_at")
  SELECT gen_random_uuid()::text, 'Jamal Family', CURRENT_TIMESTAMP
  WHERE NOT EXISTS (SELECT 1 FROM "families" WHERE "name" = 'Jamal Family')
  RETURNING "id"
),
target_family AS (
  SELECT "id" FROM family_row
  UNION
  SELECT "id" FROM "families" WHERE "name" = 'Jamal Family'
  LIMIT 1
)
UPDATE "accounts"
SET "family_id" = (SELECT "id" FROM target_family)
WHERE "name" IN ('Basil', 'Osama') AND "family_id" IS NULL;

INSERT INTO "parents" ("id", "family_id", "name", "email", "password_hash", "updated_at")
SELECT gen_random_uuid()::text, "id", 'Jamal', 'jamal@obbank.local', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', CURRENT_TIMESTAMP
FROM "families"
WHERE "name" = 'Jamal Family'
  AND NOT EXISTS (SELECT 1 FROM "parents" WHERE "name" = 'Jamal');

ALTER TABLE "families" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "parents" ENABLE ROW LEVEL SECURITY;
