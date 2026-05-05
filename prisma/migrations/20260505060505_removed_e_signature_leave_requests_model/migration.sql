/*
  Warnings:

  - You are about to drop the column `eSignature` on the `LeaveRequests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmployeeInformation" ADD COLUMN     "eSignature" TEXT;

-- AlterTable
ALTER TABLE "LeaveRequests" DROP COLUMN "eSignature";
