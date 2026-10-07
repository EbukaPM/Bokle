import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { withdrawSchema } from "@/lib/validations/wallet";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { getSetting } from "@/lib/settings";
import { requestWithdrawal } from "@/lib/wallet";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const body = await req.json();
    const { bankAccountId, amount } = withdrawSchema.parse(body);

    const account = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
    if (!account || account.userId !== user.id) return apiError("Bank account not found", 404);

    const minWithdrawal = await getSetting("min_withdrawal_amount", 1000);
    if (amount < minWithdrawal) return apiError(`Minimum withdrawal is ₦${minWithdrawal}`, 400);

    const fee = await getSetting("withdrawal_fee", 50);
    const withdrawalRequest = await requestWithdrawal(user.id, bankAccountId, amount, fee);

    return apiSuccess({ withdrawalRequest }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
