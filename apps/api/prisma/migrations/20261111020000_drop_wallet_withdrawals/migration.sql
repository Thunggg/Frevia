-- Clean up any test withdrawal transactions before dropping table/columns
DELETE FROM "Transaction" WHERE "type" = 'WITHDRAWAL';

DROP TABLE IF EXISTS "WithdrawalRequest";
DROP TYPE IF EXISTS "WithdrawalMethod";
DROP TYPE IF EXISTS "WithdrawalStatus";

ALTER TABLE "User" DROP COLUMN IF EXISTS "walletBalance";

