-- CreateEnum
CREATE TYPE "TimeEntryEditRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "TimeEntryEditRequest" (
    "id" SERIAL NOT NULL,
    "timeEntryId" INTEGER NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "proposedClockIn" TIMESTAMP(3) NOT NULL,
    "proposedKind" TEXT NOT NULL,
    "proposedTaskDescription" TEXT,
    "employeeNote" TEXT,
    "status" "TimeEntryEditRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "reviewerComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntryEditRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TimeEntryEditRequest" ADD CONSTRAINT "TimeEntryEditRequest_timeEntryId_fkey" FOREIGN KEY ("timeEntryId") REFERENCES "TimeEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntryEditRequest" ADD CONSTRAINT "TimeEntryEditRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntryEditRequest" ADD CONSTRAINT "TimeEntryEditRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "TimeEntryEditRequest_status_idx" ON "TimeEntryEditRequest"("status");

-- CreateIndex
CREATE INDEX "TimeEntryEditRequest_timeEntryId_idx" ON "TimeEntryEditRequest"("timeEntryId");

-- CreateIndex
CREATE INDEX "TimeEntryEditRequest_requesterId_idx" ON "TimeEntryEditRequest"("requesterId");
