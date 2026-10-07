import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { submitReportSchema } from "@/lib/validations/requests";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { sendNotification } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const profile = await prisma.providerProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return apiError("Provider profile not found", 404);

    const job = await prisma.serviceRequest.findUnique({ where: { id: params.id }, include: { category: true } });
    if (!job || job.assignedProviderId !== profile.id) return apiError("Job not found", 404);
    if (job.status !== "completed") {
      return apiError("Mark the job as completed before submitting a report", 400);
    }

    const body = await req.json();
    const data = submitReportSchema.parse(body);

    const minPhotos = job.category.minPhotosRequired;
    if (data.photoUrls.length < minPhotos) {
      return apiError(`At least ${minPhotos} photos are required for this check type`, 400);
    }

    const report = await prisma.report.create({
      data: {
        requestId: job.id,
        providerId: profile.id,
        reportType: job.requestType,
        completionTime: new Date(),
        checklistData: data.checklistData,
        clientQuestionsAnswers: data.clientQuestionsAnswers,
        notes: data.notes,
        photoUrls: data.photoUrls,
        isConcernFlagged: data.isConcernFlagged,
        concernNotes: data.concernNotes,
        overallAssessment: data.overallAssessment,
      },
    });

    await prisma.serviceRequest.update({ where: { id: job.id }, data: { status: "report_submitted" } });

    await prisma.providerProfile.update({
      where: { id: profile.id },
      data: { totalJobs: { increment: 1 } },
    });

    await sendNotification({
      userId: job.clientId,
      type: "report_submitted",
      title: job.requestType === "check_am" ? "Your Check Am report is ready" : "Your visit report is ready",
      body: "Review the report and confirm to release payment.",
      priority: "high",
    });

    if (data.isConcernFlagged) {
      const admins = await prisma.user.findMany({ where: { isAdmin: true } });
      for (const admin of admins) {
        await sendNotification({
          userId: admin.id,
          type: "concern_flagged",
          title: "Concern flagged on a report",
          body: `Report for request ${job.id} was flagged for review.`,
          priority: "high",
        });
      }
    }

    return apiSuccess({ report }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
