-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "birthday" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CalendarReminder" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "time" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderShare" (
    "id" SERIAL NOT NULL,
    "reminderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarReminder_ownerId_date_idx" ON "CalendarReminder"("ownerId", "date");

-- CreateIndex
CREATE INDEX "ReminderShare_userId_idx" ON "ReminderShare"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderShare_reminderId_userId_key" ON "ReminderShare"("reminderId", "userId");

-- AddForeignKey
ALTER TABLE "CalendarReminder" ADD CONSTRAINT "CalendarReminder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderShare" ADD CONSTRAINT "ReminderShare_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "CalendarReminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderShare" ADD CONSTRAINT "ReminderShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
