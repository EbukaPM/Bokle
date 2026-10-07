// Double-entry wallet ledger (PRD Section 13).
// Every money movement is written inside a single Prisma transaction so
// balance + transaction row never diverge. Commission is credited to a
// dedicated platform system wallet (see prisma/seed.ts) rather than a bare
// counter, so the full ledger — client, provider, and platform — always
// nets to zero.

import { prisma } from "./db";
import { generateReference } from "./utils";
import { getSetting } from "./settings";
import { Prisma } from "@prisma/client";

export const PLATFORM_SYSTEM_EMAIL = "platform@bokle.internal";

export async function getOrCreateWallet(userId: string) {
  const existing = await prisma.wallet.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.wallet.create({ data: { userId } });
}

async function getPlatformWallet(tx: Prisma.TransactionClient) {
  const platformUser = await tx.user.findUnique({ where: { email: PLATFORM_SYSTEM_EMAIL } });
  if (!platformUser) throw new Error("Platform system user missing — run prisma/seed.ts");
  const wallet = await tx.wallet.findUnique({ where: { userId: platformUser.id } });
  if (!wallet) throw new Error("Platform wallet missing — run prisma/seed.ts");
  return wallet;
}

export async function creditTopUp(userId: string, amount: number, paystackRef: string) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const existing = await tx.walletTransaction.findUnique({ where: { reference: paystackRef } });
    if (existing) return { wallet, transaction: existing, duplicate: true };

    const balanceBefore = wallet.availableBalance;
    const balanceAfter = balanceBefore.plus(amount);

    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { availableBalance: balanceAfter },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "topup",
        amount,
        balanceBefore,
        balanceAfter,
        reference: paystackRef,
        description: "Wallet top-up via Paystack",
        paystackRef,
      },
    });

    return { wallet: updated, transaction, duplicate: false };
  });
}

export async function holdEscrow(clientUserId: string, requestId: string, amount: number) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId: clientUserId } });
    if (!wallet) throw new Error("Wallet not found");
    if (wallet.availableBalance.lessThan(amount)) {
      throw new Error("INSUFFICIENT_BALANCE");
    }

    const balanceBefore = wallet.availableBalance;
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: balanceBefore.minus(amount),
        escrowBalance: wallet.escrowBalance.plus(amount),
      },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "escrow_hold",
        amount,
        balanceBefore,
        balanceAfter: updated.availableBalance,
        reference: generateReference("ESCROW"),
        description: "Funds held in escrow for booking",
        requestId,
      },
    });

    return { wallet: updated, transaction };
  });
}

export async function releaseEscrow(requestId: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.serviceRequest.findUnique({
      where: { id: requestId },
      include: { assignedProvider: true },
    });
    if (!request) throw new Error("Request not found");
    if (!request.assignedProvider) throw new Error("No provider assigned");
    if (!request.quotedPrice) throw new Error("Request has no quoted price");

    const commissionRateKey =
      request.requestType === "check_am" ? "check_am_commission_rate" : "general_commission_rate";
    const commissionRate = await getSetting(commissionRateKey, 0.15);

    const amount = request.quotedPrice;
    const commission = amount.mul(commissionRate);
    const providerPayout = amount.minus(commission);

    const clientWallet = await tx.wallet.findUnique({ where: { userId: request.clientId } });
    const providerWallet = await tx.wallet.findUnique({
      where: { userId: request.assignedProvider.userId },
    });
    const platformWallet = await getPlatformWallet(tx);
    if (!clientWallet || !providerWallet) throw new Error("Wallet missing");

    const clientBalanceBefore = clientWallet.escrowBalance;
    const updatedClientWallet = await tx.wallet.update({
      where: { id: clientWallet.id },
      data: { escrowBalance: clientBalanceBefore.minus(amount) },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: clientWallet.id,
        type: "escrow_release",
        amount: amount.neg(),
        balanceBefore: clientBalanceBefore,
        balanceAfter: updatedClientWallet.escrowBalance,
        reference: generateReference("RELEASE"),
        description: "Escrow released on job confirmation",
        requestId,
      },
    });

    const providerBalanceBefore = providerWallet.availableBalance;
    const updatedProviderWallet = await tx.wallet.update({
      where: { id: providerWallet.id },
      data: { availableBalance: providerBalanceBefore.plus(providerPayout) },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: providerWallet.id,
        type: "earned",
        amount: providerPayout,
        balanceBefore: providerBalanceBefore,
        balanceAfter: updatedProviderWallet.availableBalance,
        reference: generateReference("EARN"),
        description: "Earnings from completed job",
        requestId,
      },
    });

    const platformBalanceBefore = platformWallet.availableBalance;
    const updatedPlatformWallet = await tx.wallet.update({
      where: { id: platformWallet.id },
      data: { availableBalance: platformBalanceBefore.plus(commission) },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: platformWallet.id,
        type: "commission",
        amount: commission,
        balanceBefore: platformBalanceBefore,
        balanceAfter: updatedPlatformWallet.availableBalance,
        reference: generateReference("COMM"),
        description: "Platform commission",
        requestId,
      },
    });

    await tx.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: "confirmed",
        confirmedAt: new Date(),
        platformFee: commission,
        providerPayout,
      },
    });

    return { commission, providerPayout };
  });
}

export async function refundEscrow(requestId: string, portion: "full" | "partial" = "full", partialAmount?: number) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request || !request.quotedPrice) throw new Error("Request not found or has no price");

    const refundAmount = portion === "full" ? request.quotedPrice : new Prisma.Decimal(partialAmount ?? 0);

    const clientWallet = await tx.wallet.findUnique({ where: { userId: request.clientId } });
    if (!clientWallet) throw new Error("Wallet not found");

    const balanceBefore = clientWallet.escrowBalance;
    const updated = await tx.wallet.update({
      where: { id: clientWallet.id },
      data: {
        escrowBalance: balanceBefore.minus(refundAmount),
        availableBalance: clientWallet.availableBalance.plus(refundAmount),
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: clientWallet.id,
        type: "refund",
        amount: refundAmount,
        balanceBefore,
        balanceAfter: updated.escrowBalance,
        reference: generateReference("REFUND"),
        description: `${portion === "full" ? "Full" : "Partial"} refund — dispute resolution`,
        requestId,
      },
    });

    await tx.serviceRequest.update({
      where: { id: requestId },
      data: { status: "refunded" },
    });

    return { refundAmount };
  });
}

// Deducts the wallet immediately on request (preventing double-spend across
// concurrent withdrawal requests) and creates a pending WithdrawalRequest +
// matching pending ledger row. Admin processing (lib/withdrawals.ts) either
// completes it (marks success) or fails it (refunds the wallet).
export async function requestWithdrawal(userId: string, bankAccountId: string, amount: number, fee: number) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error("Wallet not found");

    const total = new Prisma.Decimal(amount).plus(fee);
    if (wallet.availableBalance.lessThan(total)) throw new Error("INSUFFICIENT_BALANCE");

    const balanceBefore = wallet.availableBalance;
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { availableBalance: balanceBefore.minus(total) },
    });

    const withdrawalRequest = await tx.withdrawalRequest.create({
      data: {
        userId,
        bankAccountId,
        amount,
        fee,
        netAmount: amount,
        status: "pending",
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "payout",
        amount: total.neg(),
        balanceBefore,
        balanceAfter: updated.availableBalance,
        reference: generateReference("WD"),
        description: "Withdrawal request submitted",
        status: "pending",
      },
    });

    return withdrawalRequest;
  });
}

export async function refundFailedWithdrawal(withdrawalRequestId: string) {
  return prisma.$transaction(async (tx) => {
    const wr = await tx.withdrawalRequest.findUnique({ where: { id: withdrawalRequestId } });
    if (!wr) throw new Error("Withdrawal request not found");

    const wallet = await tx.wallet.findUnique({ where: { userId: wr.userId } });
    if (!wallet) throw new Error("Wallet not found");

    const total = wr.amount.plus(wr.fee);
    const balanceBefore = wallet.availableBalance;
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { availableBalance: balanceBefore.plus(total) },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "refund",
        amount: total,
        balanceBefore,
        balanceAfter: updated.availableBalance,
        reference: generateReference("WDREFUND"),
        description: "Withdrawal failed — funds returned to wallet",
      },
    });

    await tx.withdrawalRequest.update({ where: { id: withdrawalRequestId }, data: { status: "failed" } });
  });
}

