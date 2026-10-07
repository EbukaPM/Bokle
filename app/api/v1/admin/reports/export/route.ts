import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { apiError } from "@/lib/api";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))];
  return lines.join("\n");
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return apiError("Forbidden", 403);

  const transactions = await prisma.walletTransaction.findMany({
    include: { wallet: { include: { user: { select: { fullName: true, email: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const rows = transactions.map((t) => ({
    id: t.id,
    date: t.createdAt.toISOString(),
    user: t.wallet.user.fullName,
    email: t.wallet.user.email,
    type: t.type,
    amount: t.amount.toString(),
    balanceAfter: t.balanceAfter?.toString() ?? "",
    reference: t.reference,
    status: t.status,
  }));

  const csv = toCsv(rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="bokle-transactions-${Date.now()}.csv"`,
    },
  });
}
