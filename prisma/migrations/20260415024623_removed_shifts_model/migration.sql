/*
  Warnings:

  - You are about to drop the column `shiftId` on the `CompanyInformation` table. All the data in the column will be lost.
  - You are about to drop the `Shifts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CompanyInformation" DROP CONSTRAINT "CompanyInformation_shiftId_fkey";

-- AlterTable
ALTER TABLE "CompanyInformation" DROP COLUMN "shiftId";

-- DropTable
DROP TABLE "Shifts";
