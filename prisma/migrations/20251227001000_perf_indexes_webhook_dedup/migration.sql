ALTER TABLE "ReviewerProfile" ADD COLUMN "stripeConnectedAt" TIMESTAMP(3);

CREATE INDEX "ReviewerProfile_lastReviewDate_idx" ON "ReviewerProfile"("lastReviewDate");

CREATE INDEX "Track_paidAt_idx" ON "Track"("paidAt");

CREATE INDEX "Review_status_idx" ON "Review"("status");

CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StripeWebhookEvent_expiresAt_idx" ON "StripeWebhookEvent"("expiresAt");
