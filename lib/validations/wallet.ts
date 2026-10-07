import { z } from "zod";

export const topUpSchema = z.object({
  amount: z.number().positive().min(100, "Minimum top-up is ₦100"),
});

export const addBankAccountSchema = z.object({
  bankCode: z.string().min(1),
  bankName: z.string().min(1),
  accountNumber: z.string().length(10, "Account number must be 10 digits"),
});

export const withdrawSchema = z.object({
  bankAccountId: z.string().uuid(),
  amount: z.number().positive(),
});

export const subscribeSchema = z.object({
  plan: z.enum(["monthly", "quarterly", "annual"]),
  paymentMethod: z.enum(["wallet", "paystack"]),
});
