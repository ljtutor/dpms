/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Positions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Positions_title_key" ON "Positions"("title");
