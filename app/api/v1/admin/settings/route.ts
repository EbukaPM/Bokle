import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/admin";
import { getAllSettings, updateSetting } from "@/lib/settings";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return apiError("Forbidden — super-admin only", 403);

    const settings = await getAllSettings();
    return apiSuccess({ settings });
  } catch (err) {
    return handleApiError(err);
  }
}

const updateSettingsSchema = z.object({
  updates: z.array(z.object({ key: z.string().min(1), value: z.string().min(1) })).min(1),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return apiError("Forbidden — super-admin only", 403);

    const body = await req.json();
    const { updates } = updateSettingsSchema.parse(body);

    const results = [];
    for (const { key, value } of updates) {
      results.push(await updateSetting(key, value, admin.id));
    }

    return apiSuccess({ settings: results });
  } catch (err) {
    return handleApiError(err);
  }
}
