-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "address" TEXT,
ADD COLUMN     "employmentStatus" TEXT DEFAULT 'ACTIVE',
ADD COLUMN     "profileImage" TEXT;
