import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[0-9]/, "Password must contain at least 1 number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least 1 special character");

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required").max(100),
    email: z.string().email().optional(),
    phone: z
      .string()
      .regex(/^(\+234|0)[789][01]\d{8}$/, "Enter a valid Nigerian phone number")
      .optional(),
    state: z.string().min(2, "State is required"),
    lga: z.string().min(2, "LGA is required"),
    password: passwordSchema,
    otpCode: z.string().length(6, "Enter the 6-digit code"),
  })
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone is required",
    path: ["email"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().min(3, "Enter your email or phone"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const sendOtpSchema = z.object({
  identifier: z.string().min(3),
  purpose: z.enum(["register", "login", "password_reset"]),
});

export const verifyOtpSchema = z.object({
  identifier: z.string().min(3),
  purpose: z.enum(["register", "login", "password_reset"]),
  code: z.string().length(6, "Code must be 6 digits"),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(3),
});

export const resetPasswordSchema = z.object({
  identifier: z.string().min(3),
  code: z.string().length(6),
  newPassword: passwordSchema,
});
