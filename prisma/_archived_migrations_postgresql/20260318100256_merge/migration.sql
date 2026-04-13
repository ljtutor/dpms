-- AlterTable (idempotent for reset/replay)
ALTER TABLE "TimeEntry" ADD COLUMN IF NOT EXISTS "isLate" BOOLEAN;
