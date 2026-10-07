import { prisma } from "./db";
import { getSetting } from "./settings";

// Help Me Check Am — fee calculation (PRD Section 6.3). Checker matching
// lives in lib/matching.ts (shared with the general marketplace).

export async function calculateCheckAmPrice(categoryId: string) {
  const category = await prisma.serviceCategory.findUnique({ where: { id: categoryId } });
  if (!category) throw new Error("Category not found");

  const commissionRate = await getSetting("check_am_commission_rate", 0.2);
  const baseFee = category.baseFee.toNumber();
  const platformFee = baseFee * commissionRate;

  return {
    baseFee,
    platformFee,
    totalPrice: baseFee + platformFee,
  };
}
