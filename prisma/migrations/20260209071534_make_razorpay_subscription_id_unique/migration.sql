/*
  Warnings:

  - A unique constraint covering the columns `[razorpaySubscriptionId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "users_razorpaySubscriptionId_key" ON "users"("razorpaySubscriptionId");
