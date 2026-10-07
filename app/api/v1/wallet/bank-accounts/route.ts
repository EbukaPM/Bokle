import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { addBankAccountSchema } from "@/lib/validations/wallet";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { resolveBankAccount } from "@/lib/paystack";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const accounts = await prisma.bankAccount.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return apiSuccess({ accounts });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const body = await req.json();
    const { bankCode, bankName, accountNumber } = addBankAccountSchema.parse(body);

    const resolved = await resolveBankAccount(accountNumber, bankCode);
    const accountName = resolved.data.account_name;

    const existingCount = await prisma.bankAccount.count({ where: { userId: user.id } });

    const account = await prisma.bankAccount.create({
      data: {
        userId: user.id,
        bankCode,
        bankName,
        accountNumber,
        accountName,
        isDefault: existingCount === 0,
      },
    });

    return apiSuccess({ account }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
