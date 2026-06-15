-- CreateTable
CREATE TABLE "JobPhoto" (
    "id" SERIAL NOT NULL,
    "jobId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "originalName" TEXT,
    "contentType" TEXT,
    "size" INTEGER,
    "uploadedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobPhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JobPhoto" ADD CONSTRAINT "JobPhoto_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
