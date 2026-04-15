-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "shift_id" INTEGER;

-- CreateTable
CREATE TABLE "Shifts" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "start_time" TIME(0) NOT NULL,
    "end_time" TIME(0) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shifts_title_key" ON "Shifts"("title");

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "Shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
