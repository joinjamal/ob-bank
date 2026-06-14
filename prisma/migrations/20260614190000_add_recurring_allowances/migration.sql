CREATE TYPE "AllowanceFrequency" AS ENUM ('Daily', 'Weekly', 'Monthly');

CREATE TABLE IF NOT EXISTS "recurring_allowances" (
  "id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "frequency" "AllowanceFrequency" NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "day_of_week" INTEGER,
  "day_of_month" INTEGER,
  "next_run_at" TIMESTAMP(3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recurring_allowances_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "recurring_allowances_account_id_idx" ON "recurring_allowances"("account_id");
CREATE INDEX IF NOT EXISTS "recurring_allowances_active_next_run_at_idx" ON "recurring_allowances"("active", "next_run_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recurring_allowances_account_id_fkey'
  ) THEN
    ALTER TABLE "recurring_allowances"
    ADD CONSTRAINT "recurring_allowances_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "recurring_allowances" ENABLE ROW LEVEL SECURITY;
