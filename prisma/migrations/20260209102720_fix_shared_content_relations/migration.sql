/*
  Warnings:

  - You are about to drop the column `contentId` on the `shared_content` table. All the data in the column will be lost.
  - Added the required column `queryId` to the `shared_content` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "shared_content" DROP CONSTRAINT "shared_content_contentId_fkey";

-- AlterTable
ALTER TABLE "shared_content" DROP COLUMN "contentId",
ADD COLUMN     "queryId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "shared_content_queryId_idx" ON "shared_content"("queryId");

-- AddForeignKey
ALTER TABLE "shared_content" ADD CONSTRAINT "shared_content_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
