/*
  Warnings:

  - Added the required column `noOfDays` to the `LeaveRequests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LeaveRequests" ADD COLUMN     "noOfDays" INTEGER NOT NULL;
