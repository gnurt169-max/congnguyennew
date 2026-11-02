-- CreateTable
CREATE TABLE "payment_configs" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "bankId" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountHolder" TEXT,
    "isBankEnabled" BOOLEAN NOT NULL DEFAULT true,
    "momoPhone" TEXT,
    "momoName" TEXT,
    "isMomoEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_configs_pkey" PRIMARY KEY ("id")
);
