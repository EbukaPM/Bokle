import { z } from "zod";

export const bulkMessageSchema = z.object({
  segment: z.enum(["all", "clients", "providers", "premium", "unverified_providers", "state"]),
  state: z.string().optional(),
  channel: z.enum(["sms", "email", "both"]),
  subject: z.string().max(150).optional(),
  message: z.string().min(1).max(1000),
});
