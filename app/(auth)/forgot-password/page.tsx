"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/fetcher";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/api/v1/auth/forgot-password", { identifier });
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/api/v1/auth/reset-password", { identifier, code, newPassword });
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
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
          <p className="text-text-secondary mt-1">Reset your password</p>
        </div>

        {step === 1 ? (
          <form onSubmit={requestCode} className="space-y-4">
            <Input
              label="Email or phone number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            {error && <p role="alert" className="text-sm text-error">{error}</p>}
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Send reset code
            </Button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
            <p className="text-sm text-text-secondary">Enter the code sent to {identifier} and your new password.</p>
            <Input
              label="Verification code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
            <Input
              type="password"
              label="New password"
              hint="At least 8 characters, 1 number, 1 special character"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            {error && <p role="alert" className="text-sm text-error">{error}</p>}
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Reset password
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-text-secondary mt-6">
          <Link href="/login" className="text-primary-dark font-medium">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
