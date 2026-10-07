import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyOtp, hashPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, code, newPassword } = resetPasswordSchema.parse(body);

    const result = await verifyOtp(identifier, "password_reset", code);
    if (!result.ok) return apiError(result.reason || "Invalid code", 400);

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });
    if (!user) return apiError("Account not found", 404);

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return apiSuccess({ reset: true });
  } catch (err) {
    return handleApiError(err);
  }
}
