/*
  Warnings:

  - You are about to drop the column `age` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "age",
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'free';

-- CreateIndex
CREATE INDEX "content_contentType_idx" ON "content"("contentType");
