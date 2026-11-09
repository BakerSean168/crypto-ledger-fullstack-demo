-- Lesson migration: legacy transactions had no timestamp. Sample values below
-- are synthetic teaching fixtures, not actual blockchain execution times.
-- Idempotent to support both first-time Docker init and existing demo volumes.
BEGIN;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

UPDATE transactions
SET created_at = CASE id
    WHEN 1 THEN TIMESTAMPTZ '2026-11-01 10:00:00+00'
    WHEN 2 THEN TIMESTAMPTZ '2026-11-03 13:30:00+00'
    WHEN 3 THEN TIMESTAMPTZ '2026-11-05 09:00:00+00'
    WHEN 4 THEN TIMESTAMPTZ '2026-11-06 17:45:00+00'
    ELSE TIMESTAMPTZ '2026-11-07 12:00:00+00'
END
WHERE created_at IS NULL;

ALTER TABLE transactions ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE transactions ALTER COLUMN created_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_wallet_created
    ON transactions (LOWER(wallet_address), created_at DESC, id DESC);

COMMIT;
