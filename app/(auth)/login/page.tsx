"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/fetcher";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Logo } from "@/components/layout/Logo";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_auth_failed: "Google sign-in failed. Please try again or use your email/phone.",
  google_not_configured: "Google sign-in isn't available right now.",
  account_suspended: "This account has been suspended. Contact support.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(
    () => OAUTH_ERROR_MESSAGES[searchParams.get("error") || ""] || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await api.post("/api/v1/auth/login", values);
      router.push(searchParams.get("next") || "/dashboard");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input label="Email or phone number" {...register("identifier")} error={errors.identifier?.message} />
      <Input type="password" label="Password" {...register("password")} error={errors.password?.message} />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" {...register("rememberMe")} className="h-4 w-4 rounded border-border" />
          Remember me
        </label>
        <Link href="/forgot-password" className="text-sm text-primary-dark font-medium">
          Forgot password?
        </Link>
      </div>
      {serverError && (
        <p role="alert" className="text-sm text-error">
          {serverError}
        </p>
      )}
      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Log in
      </Button>

      <GoogleSignInButton />
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <Logo size={36} />
          </div>
          <p className="text-text-secondary mt-3">Welcome back</p>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-text-secondary mt-6">
          New to Bokle?{" "}
          <Link href="/register" className="text-primary-dark font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
