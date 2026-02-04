/*
  Warnings:

  - You are about to drop the column `metadata` on the `queries` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "queries" DROP COLUMN "metadata";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3);
