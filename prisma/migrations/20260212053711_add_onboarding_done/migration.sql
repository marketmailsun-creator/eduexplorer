-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboardingDone" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "comment_likes_commentId_idx" ON "comment_likes"("commentId");

-- CreateIndex
CREATE INDEX "comment_likes_userId_idx" ON "comment_likes"("userId");
