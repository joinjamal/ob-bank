ALTER TABLE "accounts"
ADD COLUMN IF NOT EXISTS "pin_hash" TEXT NOT NULL DEFAULT '9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0';

CREATE TABLE IF NOT EXISTS "game_scores" (
  "id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "mode" TEXT NOT NULL DEFAULT 'solo',
  "score" INTEGER NOT NULL,
  "coins" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "game_scores_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "game_scores_account_id_score_idx" ON "game_scores"("account_id", "score");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'game_scores_account_id_fkey'
  ) THEN
    ALTER TABLE "game_scores"
    ADD CONSTRAINT "game_scores_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "game_scores" ENABLE ROW LEVEL SECURITY;
