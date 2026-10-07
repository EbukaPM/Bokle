import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  bio: z.string().max(300).optional(),
  state: z.string().optional(),
  lga: z.string().optional(),
  neighbourhood: z.string().max(150).optional(),
  avatarUrl: z.string().url().optional(),
});

export const switchRoleSchema = z.object({
  role: z.enum(["client", "provider"]),
});

export const providerProfileSchema = z.object({
  hourlyRate: z.number().positive().optional(),
  perVisitRate: z.number().positive().optional(),
  coverageRadiusKm: z.number().int().positive().max(50).optional(),
  acceptsCheckAm: z.boolean().optional(),
  categoryIds: z.array(z.string().min(1)).optional(),
});

export const providerVerificationSchema = z.object({
  idDocumentUrl: z.string().url(),
  selfieUrl: z.string().url(),
});

export const providerAvailabilitySchema = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })
);
