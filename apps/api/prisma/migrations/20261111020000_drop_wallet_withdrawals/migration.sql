-- Clean up any test withdrawal transactions before dropping table/columns
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Transaction') THEN
    DELETE FROM "Transaction" WHERE "type" = 'WITHDRAWAL';
  END IF;
END $$;

DROP TABLE IF EXISTS "WithdrawalRequest";
DROP TYPE IF EXISTS "WithdrawalMethod";
DROP TYPE IF EXISTS "WithdrawalStatus";

ALTER TABLE "User" DROP COLUMN IF EXISTS "walletBalance";

