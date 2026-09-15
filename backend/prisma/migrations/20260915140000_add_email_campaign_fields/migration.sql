-- AlterTable
ALTER TABLE "Email"
ADD COLUMN "campaignId" TEXT NOT NULL DEFAULT 'legacy-campaign',
ADD COLUMN "hourlyLimit" INTEGER NOT NULL DEFAULT 100;

-- CreateIndex
CREATE INDEX "Email_campaignId_idx" ON "Email"("campaignId");

-- Remove temporary database defaults
ALTER TABLE "Email"
ALTER COLUMN "campaignId" DROP DEFAULT;

ALTER TABLE "Email"
ALTER COLUMN "hourlyLimit" DROP DEFAULT;