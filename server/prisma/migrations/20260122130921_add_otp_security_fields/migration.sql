-- AlterTable
ALTER TABLE "users" ADD COLUMN     "otp_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "otp_cooldown_until" TIMESTAMP(3),
ADD COLUMN     "otp_resend_attempts" INTEGER NOT NULL DEFAULT 0;
