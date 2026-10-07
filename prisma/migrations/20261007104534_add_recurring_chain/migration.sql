-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN     "recurring_parent_id" TEXT;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_recurring_parent_id_fkey" FOREIGN KEY ("recurring_parent_id") REFERENCES "service_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
