-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'GENERATING', 'GENERATED', 'DOWNLOADING', 'DEPLOYING', 'DEPLOYED', 'FAILED');

-- CreateTable
CREATE TABLE "GenerationTask" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "style" TEXT,
    "mood" TEXT,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "sunoAudioUrl" TEXT,
    "sunoImageUrl" TEXT,
    "sunoVideoUrl" TEXT,
    "audioUrl" TEXT,
    "imageUrl" TEXT,
    "duration" INTEGER,
    "lastCheckedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "autoDeploy" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GenerationTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GenerationTask_taskId_key" ON "GenerationTask"("taskId");

-- CreateIndex
CREATE INDEX "GenerationTask_status_lastCheckedAt_idx" ON "GenerationTask"("status", "lastCheckedAt");

-- CreateIndex
CREATE INDEX "GenerationTask_scheduleId_idx" ON "GenerationTask"("scheduleId");

-- CreateIndex
CREATE INDEX "GenerationTask_createdAt_idx" ON "GenerationTask"("createdAt");
