import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type");
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true, ...(type ? { type: type as "general" | "check_am" } : {}) },
      orderBy: { name: "asc" },
    });
    return apiSuccess({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}
