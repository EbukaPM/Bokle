import { z } from "zod";

export const savedSubjectSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  subjectType: z.enum(["person", "property", "vehicle", "other"]),
  name: z.string().max(100).optional(),
  relationship: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  state: z.string().optional(),
  lga: z.string().optional(),
  notes: z.string().max(500).optional(),
});
