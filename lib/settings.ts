import { prisma } from "./db";

// Admin-configurable platform settings (PRD Section 6.5 / 9).
// Seed keys: general_commission_rate, check_am_commission_rate,
// escrow_auto_release_hours, min_withdrawal_amount, withdrawal_fee,
// premium_price_monthly, premium_price_quarterly, premium_price_annual.

const cache = new Map<string, { value: string; cachedAt: number }>();
const CACHE_TTL_MS = 30_000;

export async function getSetting(key: string, fallback: number | string): Promise<number> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return parseFloat(cached.value);
  }

  const row = await prisma.platformSetting.findUnique({ where: { key } });
  const value = row?.value ?? String(fallback);
  cache.set(key, { value, cachedAt: Date.now() });
  return parseFloat(value);
}

export async function getSettingRaw(key: string, fallback = ""): Promise<string> {
  const row = await prisma.platformSetting.findUnique({ where: { key } });
  return row?.value ?? fallback;
}

export async function updateSetting(key: string, value: string, adminId: string, description?: string) {
  const existing = await prisma.platformSetting.findUnique({ where: { key } });

  const updated = await prisma.platformSetting.upsert({
    where: { key },
    create: { key, value, description, updatedBy: adminId },
    update: { value, updatedBy: adminId },
  });

  cache.delete(key);

  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action: "update_setting",
      targetType: "platform_setting",
      targetId: key,
      oldValue: existing ? { value: existing.value } : undefined,
      newValue: { value },
    },
  });

  return updated;
}

export async function getAllSettings() {
  return prisma.platformSetting.findMany({ orderBy: { key: "asc" } });
}
