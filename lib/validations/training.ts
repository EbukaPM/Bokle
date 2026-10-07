import { z } from "zod";

export const trainingModuleSchema = z.object({
  title: z.string().min(2).max(150),
  description: z.string().max(300).optional(),
  content: z.string().min(1),
  categoryId: z.string().optional(),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
