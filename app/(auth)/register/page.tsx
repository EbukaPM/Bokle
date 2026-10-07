"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { NG_STATES } from "@/lib/data/ng-states";
import { api } from "@/lib/fetcher";
import { ApiError } from "@/lib/fetcher";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const step1Schema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    identifier: z.string().min(3, "Enter your email or phone"),
    state: z.string().min(1, "Select your state"),
    lga: z.string().min(2, "LGA is required"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[0-9]/, "Must include a number")
      .regex(/[^a-zA-Z0-9]/, "Must include a special character"),
  });

type Step1Values = z.infer<typeof step1Schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Values>({ resolver: zodResolver(step1Schema) });

  async function onStep1Submit(values: Step1Values) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await api.post("/api/v1/auth/send-otp", { identifier: values.identifier, purpose: "register" });
      setStep1Data(values);
      setStep(2);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!step1Data) return;
    setServerError(null);
    setIsSubmitting(true);
    try {
      const isEmail = step1Data.identifier.includes("@");
      await api.post("/api/v1/auth/register", {
        fullName: step1Data.fullName,
        email: isEmail ? step1Data.identifier : undefined,
        phone: !isEmail ? step1Data.identifier : undefined,
        state: step1Data.state,
        lga: step1Data.lga,
        password: step1Data.password,
        otpCode,
      });
      router.push("/dashboard");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary-dark">
            Bokle
          </Link>
          <p className="text-text-secondary mt-1">
            Step {step} of 2 — {step === 1 ? "Create your account" : "Verify your contact"}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-4" noValidate>
            <Input label="Full name" {...register("fullName")} error={errors.fullName?.message} />
            <Input
              label="Email or phone number"
              placeholder="you@example.com or 080..."
              {...register("identifier")}
              error={errors.identifier?.message}
            />
            <Select
              label="State"
              options={NG_STATES}
              placeholder="Select your state"
              {...register("state")}
              error={errors.state?.message}
            />
            <Input label="LGA" {...register("lga")} error={errors.lga?.message} />
            <Input
              type="password"
              label="Password"
              hint="At least 8 characters, 1 number, 1 special character"
              {...register("password")}
              error={errors.password?.message}
            />
            {serverError && (
              <p role="alert" className="text-sm text-error">
                {serverError}
              </p>
            )}
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Continue
            </Button>

            <GoogleSignInButton />
          </form>
        ) : (
          <form onSubmit={onStep2Submit} className="space-y-4" noValidate>
            <p className="text-sm text-text-secondary">
              We sent a 6-digit code to <strong>{step1Data?.identifier}</strong>.
            </p>
            <Input
              label="Verification code"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
            />
            {serverError && (
              <p role="alert" className="text-sm text-error">
                {serverError}
              </p>
            )}
            <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={otpCode.length !== 6}>
              Create account
            </Button>
            <button
              type="button"
              className="text-sm text-primary-dark underline w-full text-center"
              onClick={() => setStep(1)}
            >
              Go back
            </button>
          </form>
        )}

        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-dark font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
