-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('LIKE_NEW_99', 'EXCELLENT_90_95', 'REFURBISHED_FULL', 'FAIR_80');

-- CreateEnum
CREATE TYPE "ProductAvailability" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD');

-- CreateEnum
CREATE TYPE "LiquidationStatus" AS ENUM ('PENDING', 'APPRAISING', 'CONTACTED', 'INSPECTED', 'COMPLETED', 'REJECTED');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "availability" "ProductAvailability" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "condition" "ProductCondition" DEFAULT 'REFURBISHED_FULL',
ADD COLUMN     "inspection_checklist" JSONB,
ADD COLUMN     "original_price" DECIMAL(15,2),
ADD COLUMN     "refurbish_details" TEXT,
ADD COLUMN     "test_video_url" TEXT;

-- CreateTable
CREATE TABLE "liquidation_submissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email" TEXT,
    "bakery_name" TEXT,
    "workshop_address" TEXT NOT NULL,
    "province" TEXT,
    "district" TEXT,
    "machine_type" TEXT NOT NULL,
    "brand_model" TEXT,
    "usage_years" INTEGER,
    "power_supply" "PowerType" NOT NULL DEFAULT 'THREE_PHASE_380V',
    "current_status" TEXT NOT NULL,
    "expected_price" DECIMAL(15,2),
    "images" JSONB,
    "video_url" TEXT,
    "status" "LiquidationStatus" NOT NULL DEFAULT 'PENDING',
    "appraised_price" DECIMAL(15,2),
    "technician_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquidation_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "liquidation_submissions_code_key" ON "liquidation_submissions"("code");

-- CreateIndex
CREATE INDEX "liquidation_submissions_code_idx" ON "liquidation_submissions"("code");

-- CreateIndex
CREATE INDEX "liquidation_submissions_phone_number_idx" ON "liquidation_submissions"("phone_number");

-- CreateIndex
CREATE INDEX "liquidation_submissions_status_idx" ON "liquidation_submissions"("status");
