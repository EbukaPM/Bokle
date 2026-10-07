import { z } from "zod";

export const createGeneralRequestSchema = z.object({
  categoryId: z.string().min(1),
  subjectId: z.string().uuid().optional(),
  subjectDescription: z.string().max(500).optional(),
  serviceAddress: z.string().min(5, "Service address is required"),
  serviceState: z.string().optional(),
  serviceLga: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  preferredDate: z.string(), // ISO date
  preferredTime: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.enum(["daily", "weekly", "monthly"]).optional(),
  specialInstructions: z.string().max(500).optional(),
});

export type CreateGeneralRequestInput = z.infer<typeof createGeneralRequestSchema>;

export const createCheckAmRequestSchema = z.object({
  categoryId: z.string().min(1),
  subjectId: z.string().uuid().optional(),
  subjectDescription: z.string().max(1000).optional(),
  clientQuestions: z.array(z.string().max(300)).max(10).default([]),
  serviceAddress: z.string().min(5, "Location of what is to be checked is required"),
  serviceState: z.string().optional(),
  serviceLga: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  preferredDate: z.string(),
  reportDeadlineHours: z.number().int().positive(),
  referenceFileUrls: z.array(z.string().url()).max(5).default([]),
  specialInstructions: z.string().max(500).optional(),
});

export type CreateCheckAmRequestInput = z.infer<typeof createCheckAmRequestSchema>;

export const updateRequestStatusSchema = z.object({
  status: z.enum(["accepted", "en_route", "on_site", "completed"]),
});

export const submitReportSchema = z.object({
  checklistData: z.record(z.string(), z.any()),
  clientQuestionsAnswers: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  notes: z.string().max(1500).optional(),
  photoUrls: z.array(z.string().url()).min(1),
  isConcernFlagged: z.boolean().default(false),
  concernNotes: z.string().max(1000).optional(),
  overallAssessment: z.string().optional(),
});

export const raiseDisputeSchema = z.object({
  reason: z.string().min(10, "Please describe the issue"),
  evidenceUrls: z.array(z.string().url()).max(5).default([]),
});
