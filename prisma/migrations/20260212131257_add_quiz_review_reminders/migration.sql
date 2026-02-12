-- CreateTable
CREATE TABLE "quiz_review_reminders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "sendAt" TIMESTAMP(3) NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_review_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quiz_review_reminders_sendAt_idx" ON "quiz_review_reminders"("sendAt");

-- CreateIndex
CREATE INDEX "quiz_review_reminders_userId_idx" ON "quiz_review_reminders"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_review_reminders_userId_queryId_dayNumber_key" ON "quiz_review_reminders"("userId", "queryId", "dayNumber");

-- AddForeignKey
ALTER TABLE "quiz_review_reminders" ADD CONSTRAINT "quiz_review_reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_review_reminders" ADD CONSTRAINT "quiz_review_reminders_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
