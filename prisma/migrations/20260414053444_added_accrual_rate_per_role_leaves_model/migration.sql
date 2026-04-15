/*
  Warnings:

  - You are about to drop the column `accrualRate` on the `Leaves` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Leaves" DROP COLUMN "accrualRate",
ADD COLUMN     "accrualRateManager" DOUBLE PRECISION,
ADD COLUMN     "accrualRateUser" DOUBLE PRECISION;
