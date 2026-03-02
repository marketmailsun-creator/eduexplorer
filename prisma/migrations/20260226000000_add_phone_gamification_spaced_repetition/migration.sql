-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'COMPLETED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable: add phone auth + gamification fields to users
ALTER TABLE "users"
  ADD COLUMN "phone"          TEXT,
  ADD COLUMN "phoneVerified"  TIMESTAMP(3),
  ADD COLUMN "totalXP"        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "currentStreak"  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "longestStreak"  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastActiveDate" TIMESTAMP(3);

-- CreateTable: user_streaks
CREATE TABLE "user_streaks" (
    "id"                     TEXT NOT NULL,
    "userId"                 TEXT NOT NULL,
    "currentStreak"          INTEGER NOT NULL DEFAULT 0,
    "longestStreak"          INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate"         TIMESTAMP(3),
    "weekBonusLastAwardedAt" TIMESTAMP(3),
    "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"              TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: xp_transactions
CREATE TABLE "xp_transactions" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "amount"    INTEGER NOT NULL,
    "reason"    TEXT NOT NULL,
    "metadata"  JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: achievements
CREATE TABLE "achievements" (
    "id"          TEXT NOT NULL,
    "code"        TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "xpReward"    INTEGER NOT NULL DEFAULT 0,
    "iconName"    TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable: user_achievements
CREATE TABLE "user_achievements" (
    "id"            TEXT NOT NULL,
    "userId"        TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable: challenges
CREATE TABLE "challenges" (
    "id"              TEXT NOT NULL,
    "challengerId"    TEXT NOT NULL,
    "challengeeId"    TEXT NOT NULL,
    "queryId"         TEXT NOT NULL,
    "groupId"         TEXT NOT NULL,
    "status"          "ChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "challengerScore" INTEGER,
    "challengeeScore" INTEGER,
    "challengerTime"  INTEGER,
    "challengeeTime"  INTEGER,
    "expiresAt"       TIMESTAMP(3) NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt"     TIMESTAMP(3),

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable: xp_redemptions
CREATE TABLE "xp_redemptions" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "xpAmount"    INTEGER NOT NULL,
    "status"      "RedemptionStatus" NOT NULL DEFAULT 'PENDING',
    "voucherCode" TEXT,
    "adminNote"   TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt"  TIMESTAMP(3),

    CONSTRAINT "xp_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: flashcard_progress
CREATE TABLE "flashcard_progress" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "contentId"    TEXT NOT NULL,
    "cardIndex"    INTEGER NOT NULL,
    "easeFactor"   DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval"     INTEGER NOT NULL DEFAULT 0,
    "repetitions"  INTEGER NOT NULL DEFAULT 0,
    "dueDate"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewed" TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flashcard_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "user_streaks_userId_key" ON "user_streaks"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_key" ON "achievements"("code");

-- CreateIndex
CREATE INDEX "xp_transactions_userId_createdAt_idx" ON "xp_transactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "user_achievements_userId_idx" ON "user_achievements"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "challenges_challengeeId_status_idx" ON "challenges"("challengeeId", "status");

-- CreateIndex
CREATE INDEX "challenges_challengerId_status_idx" ON "challenges"("challengerId", "status");

-- CreateIndex
CREATE INDEX "xp_redemptions_userId_status_idx" ON "xp_redemptions"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "flashcard_progress_userId_contentId_cardIndex_key" ON "flashcard_progress"("userId", "contentId", "cardIndex");

-- CreateIndex
CREATE INDEX "flashcard_progress_userId_dueDate_idx" ON "flashcard_progress"("userId", "dueDate");

-- AddForeignKey
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey"
  FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_challengerId_fkey"
  FOREIGN KEY ("challengerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_challengeeId_fkey"
  FOREIGN KEY ("challengeeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_queryId_fkey"
  FOREIGN KEY ("queryId") REFERENCES "queries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_redemptions" ADD CONSTRAINT "xp_redemptions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_progress" ADD CONSTRAINT "flashcard_progress_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_progress" ADD CONSTRAINT "flashcard_progress_contentId_fkey"
  FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
