-- CreateTable
CREATE TABLE "VpsSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "isGenerated" BOOLEAN NOT NULL DEFAULT false,
    "lastGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VpsSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VpsSchedule_scheduledTime_isGenerated_idx" ON "VpsSchedule"("scheduledTime", "isGenerated");

-- CreateIndex
CREATE INDEX "VpsSchedule_userId_idx" ON "VpsSchedule"("userId");

-- CreateIndex
CREATE INDEX "VpsSchedule_categoryId_idx" ON "VpsSchedule"("categoryId");

-- AddForeignKey
ALTER TABLE "VpsSchedule" ADD CONSTRAINT "VpsSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VpsSchedule" ADD CONSTRAINT "VpsSchedule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
