"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import FormError from "@/components/auth/FormError";
import FormSuccess from "@/components/auth/FormSuccess";

export default function ForgotPasswordPage() {
  const [serverError, setServerError]   = useState("");
  const [successMsg, setSuccessMsg]     = useState("");
  const [isSubmitting, setSubmitting]   = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setSubmitting(true);
    setServerError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ email: data.email }),
      });

      const json = (await res.json()) as { success: boolean; message?: string };

      if (json.success) {
        setSuccessMsg(
          json.message ??
          "If an account exists with this email, a reset link will be sent."
        );
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } catch {
      setServerError("Unable to connect. Please check your internet and try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
          Forgot your password?
        </h2>
        <p className="mt-1 text-sm text-forest-900/60">
          Enter your email and we&apos;ll send a reset link if an account exists.
        </p>
      </div>

      {successMsg ? (
        <div className="grid gap-4">
          <FormSuccess message={successMsg} />
          <Link
            href="/auth/login"
            className="flex h-11 w-full items-center justify-center rounded-full border border-forest-700 text-sm font-semibold text-forest-700 transition hover:bg-forest-700/5"
          >
            Return to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
          <FormError message={serverError} />

          <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
            Email address
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder="john@gmail.com"
              className={[
                "h-11 rounded-xl border bg-white px-3 text-sm text-forest-900",
                "outline-none transition focus:ring-2 focus:ring-forest-700/30",
                errors.email
                  ? "border-red-400 focus:border-red-500"
                  : "border-line focus:border-forest-700",
              ].join(" ")}
            />
            {errors.email && (
              <p className="text-xs font-normal text-red-500">{errors.email.message}</p>
            )}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-forest-700 text-sm font-semibold text-sand-100 transition hover:bg-forest-900 disabled:opacity-60"
          >
            {isSubmitting && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-sand-100/40 border-t-sand-100" />
            )}
            Send Reset Link
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
