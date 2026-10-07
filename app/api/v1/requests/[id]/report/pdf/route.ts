import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { generateReportPdf } from "@/lib/pdf";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Not authenticated", 401);

  const request = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
    include: { category: true, client: true, assignedProvider: { include: { user: true } } },
  });
  if (!request) return apiError("Request not found", 404);

  const isClient = request.clientId === user.id;
  const isProvider = request.assignedProvider?.userId === user.id;
  if (!isClient && !isProvider) return apiError("Request not found", 404);

  const report = await prisma.report.findFirst({ where: { requestId: params.id }, orderBy: { submittedAt: "desc" } });
  if (!report) return apiError("Report not yet submitted", 404);

  const pdfBuffer = await generateReportPdf({
    request,
    report,
    clientName: request.client.fullName,
    providerName: request.assignedProvider?.user.fullName || "Unassigned",
  });

  return new Response(Uint8Array.from(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="bokle-report-${params.id}.pdf"`,
    },
  });
}
