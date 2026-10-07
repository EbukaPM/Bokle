import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { savedSubjectSchema } from "@/lib/validations/subjects";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const subjects = await prisma.savedSubject.findMany({
      where: { clientId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess({ subjects });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const body = await req.json();
    const data = savedSubjectSchema.parse(body);

    const subject = await prisma.savedSubject.create({ data: { clientId: user.id, ...data } });
    return apiSuccess({ subject }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
