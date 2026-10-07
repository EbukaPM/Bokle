import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true, type: "check_am" },
      orderBy: { name: "asc" },
    });
    return apiSuccess({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}
