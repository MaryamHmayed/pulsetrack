-- CreateEnum
CREATE TYPE "AssessmentDeliveryMode" AS ENUM ('EMAIL', 'PREVIEW');

-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "deliveryMode" "AssessmentDeliveryMode" NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "emailProviderId" TEXT,
ADD COLUMN     "questionnaireId" TEXT NOT NULL DEFAULT 'dsma-8',
ADD COLUMN     "questionnaireVersion" TEXT NOT NULL DEFAULT '1.0';
