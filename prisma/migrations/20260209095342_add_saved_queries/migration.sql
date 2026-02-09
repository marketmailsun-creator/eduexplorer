-- CreateTable
CREATE TABLE "saved_queries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_queries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_queries_userId_idx" ON "saved_queries"("userId");

-- CreateIndex
CREATE INDEX "saved_queries_queryId_idx" ON "saved_queries"("queryId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_queries_userId_queryId_key" ON "saved_queries"("userId", "queryId");

-- AddForeignKey
ALTER TABLE "saved_queries" ADD CONSTRAINT "saved_queries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_queries" ADD CONSTRAINT "saved_queries_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
