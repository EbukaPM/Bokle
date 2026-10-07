import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { trainingModuleSchema } from "@/lib/validations/training";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const modules = await prisma.trainingModule.findMany({
      include: { category: true, _count: { select: { progress: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return apiSuccess({ modules });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const body = await req.json();
    const data = trainingModuleSchema.parse(body);

    const module_ = await prisma.trainingModule.create({ data });
    return apiSuccess({ module: module_ }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
