"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import PasswordInput from "@/components/auth/PasswordInput";
import FormError from "@/components/auth/FormError";
import FormSuccess from "@/components/auth/FormSuccess";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      setServerError("Invalid or missing password reset token. Please request a new link.");
      return;
    }

    setSubmitting(true);
    setServerError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password: data.password }),
      });

      const json = (await res.json()) as {
        success: boolean;
        message?: string;
        errors?: Record<string, string[]>;
      };

      if (json.success) {
        setSuccessMsg(
          json.message ?? "Password reset successful! You can now sign in with your new password."
        );
      } else {
        setServerError(
          json.errors?.general?.[0] ??
          json.errors?.token?.[0] ??
          "Password reset failed. The token may be expired or invalid."
        );
      }
    } catch {
      setServerError("Unable to connect. Please check your internet connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token && !successMsg) {
    return (
      <div className="grid gap-6">
        <div>
          <p className="text-sm font-semibold text-red-500">Invalid Link</p>
          <h2 className="mt-1 font-display text-2xl text-forest-900">
            Missing Reset Token
          </h2>
          <p className="mt-2 text-sm text-forest-900/70">
            The password reset link appears to be invalid or incomplete. Please request a new password reset link.
          </p>
        </div>
        <Link
          href="/auth/forgot-password"
          className="flex h-11 w-full items-center justify-center rounded-full bg-forest-700 text-sm font-semibold text-sand-100 transition hover:bg-forest-900"
        >
          Request New Reset Link
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <Link
          href="/auth/login"
          className="text-xs text-forest-900/50 hover:text-forest-900 transition-colors"
        >
          ← Back to sign in
        </Link>
        <p className="mt-3 text-sm font-semibold text-forest-900/70">Account recovery</p>
        <h2 className="mt-1 font-display text-2xl text-forest-900">
          Set New Password
        </h2>
        <p className="mt-1 text-sm text-forest-900/60">
          Enter your new password below to reset your account credentials.
        </p>
      </div>

      {successMsg ? (
        <div className="grid gap-4">
          <FormSuccess message={successMsg} />
          <Link
            href="/auth/login"
            className="flex h-11 w-full items-center justify-center rounded-full bg-forest-700 text-sm font-semibold text-sand-100 transition hover:bg-forest-900"
          >
            Sign In with New Password
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
          <FormError message={serverError} />

          {/* New Password */}
          <div className="grid gap-1.5">
            <span className="text-sm font-semibold text-forest-900">New Password</span>
            <PasswordInput
              {...register("password")}
              autoComplete="new-password"
              placeholder="Enter new password"
              error={errors.password?.message}
            />
          </div>

          {/* Confirm Password */}
          <div className="grid gap-1.5">
            <span className="text-sm font-semibold text-forest-900">Confirm New Password</span>
            <PasswordInput
              {...register("confirmPassword")}
              autoComplete="new-password"
              placeholder="Re-enter new password"
              error={errors.confirmPassword?.message}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-forest-700 text-sm font-semibold text-sand-100 transition hover:bg-forest-900 disabled:opacity-60"
          >
            {isSubmitting && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-sand-100/40 border-t-sand-100" />
            )}
            Reset Password
          </button>
        </form>
      )}

      <p className="text-sm text-forest-900/70">
        Remembered your password?{" "}
        <Link href="/auth/login" className="font-semibold text-forest-900 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-40 items-center justify-center">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-forest-700 border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
