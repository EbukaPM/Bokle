import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { createTransferRecipient, initiateTransfer } from "@/lib/paystack";
import { refundFailedWithdrawal } from "@/lib/wallet";
import { sendNotification } from "@/lib/notifications";

const schema = z.object({ action: z.enum(["approve", "reject"]), adminNotes: z.string().optional() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const body = await req.json();
    const { action, adminNotes } = schema.parse(body);

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: params.id },
      include: { bankAccount: true, user: true },
    });
    if (!withdrawal || withdrawal.status !== "pending") return apiError("Withdrawal not pending", 400);

    if (action === "reject") {
      await refundFailedWithdrawal(withdrawal.id);
      await prisma.withdrawalRequest.update({ where: { id: params.id }, data: { adminNotes, status: "failed" } });
      await sendNotification({
        userId: withdrawal.userId,
        type: "withdrawal_failed",
        title: "Withdrawal rejected",
        body: adminNotes || "Your withdrawal request was rejected. Funds have been returned to your wallet.",
        priority: "high",
      });
      return apiSuccess({ status: "failed" });
    }

    await prisma.withdrawalRequest.update({ where: { id: params.id }, data: { status: "processing" } });

    try {
      const recipient = await createTransferRecipient({
        name: withdrawal.bankAccount.accountName,
        accountNumber: withdrawal.bankAccount.accountNumber,
        bankCode: withdrawal.bankAccount.bankCode,
      });
      const transfer = await initiateTransfer({
        amountKobo: Math.round(withdrawal.netAmount.toNumber() * 100),
        recipientCode: recipient.data.recipient_code,
        reason: "Bokle provider withdrawal",
      });

      const updated = await prisma.withdrawalRequest.update({
        where: { id: params.id },
        data: { status: "completed", paystackTransferCode: transfer.data.transfer_code, processedAt: new Date(), adminNotes },
      });

      await sendNotification({
        userId: withdrawal.userId,
        type: "withdrawal_processed",
        title: "Withdrawal processed",
        body: `₦${withdrawal.netAmount} has been sent to your ${withdrawal.bankAccount.bankName} account.`,
        priority: "high",
      });

      return apiSuccess({ withdrawal: updated });
    } catch (transferErr) {
      await refundFailedWithdrawal(withdrawal.id);
      return apiError(`Transfer failed: ${(transferErr as Error).message}. Funds returned to provider's wallet.`, 502);
    }
  } catch (err) {
    return handleApiError(err);
  }
}
