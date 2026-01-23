-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "is_rejected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status_admin" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "status_faculty" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "student_id" TEXT;

-- AlterTable
ALTER TABLE "internship_offers" ADD COLUMN     "admin_approval_status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "admin_approved_at" TIMESTAMP(3),
ADD COLUMN     "faculty_approval_status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "faculty_approved_at" TIMESTAMP(3),
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending_faculty';

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
