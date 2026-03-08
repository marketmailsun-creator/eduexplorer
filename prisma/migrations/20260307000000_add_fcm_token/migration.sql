-- AlterTable: add FCM (Firebase Cloud Messaging) token field to users
-- Used for native Android/iOS push notifications via Capacitor + Firebase
ALTER TABLE "users" ADD COLUMN "fcmToken" TEXT;
