"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import {
  adminSignupSchema,
  type AdminSignupInput,
} from "@/lib/validations/auth";
import { useAuth } from "@/components/providers/auth-provider";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordStrengthBar from "@/components/auth/PasswordStrengthBar";
import FormError from "@/components/auth/FormError";

// This page is intentionally unlisted — not linked from the public UI.
// Access via: /auth/signup/admin (only platform owners know this URL)

export default function AdminSignupPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<AdminSignupInput>({
    resolver: zodResolver(adminSignupSchema),
  });

  const password = watch("password", "");

  const onSubmit = async (data: AdminSignupInput) => {
    setSubmitting(true);
    setServerError("");

    try {
      const res = await fetch("/api/auth/signup/admin", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name:        data.name,
          email:       data.email,
          phone:       data.phone,
          password:    data.password,
          adminSecret: data.adminSecret,
        }),
      });

      const json = (await res.json()) as {
        success: boolean;
        errors?: Record<string, string[]>;
      };

      if (!json.success) {
        const errs = json.errors ?? {};
        let hasFieldError = false;
        (Object.keys(errs) as string[]).forEach((field) => {
          if (field === "general") return;
          const msgs = errs[field];
          if (msgs?.[0]) {
            setError(field as keyof AdminSignupInput, { message: msgs[0] });
            hasFieldError = true;
          }
        });
        if (!hasFieldError) {
          setServerError(errs.general?.[0] ?? "Signup failed. Please try again.");
        }
        return;
      }

      await refresh();
      router.push("/admin");
      router.refresh();
    } catch {
      setServerError("Unable to connect. Please check your internet and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-forest-900/70">Admin access</p>
        <h2 className="mt-1 font-display text-2xl text-forest-900">
          Create admin account
        </h2>
        <p className="mt-1 text-sm text-forest-900/60">
          This page is for platform administrators only.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <FormError message={serverError} />

        {/* Name + Phone */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.name?.message}>
            <input
              {...register("name")}
              type="text"
              autoComplete="name"
              placeholder="Admin Name"
              className={inputCx(!!errors.name)}
            />
          </Field>
          <Field
            label="Phone number"
            hint="10-digit Indian mobile number"
            error={errors.phone?.message}
          >
            <input
              {...register("phone")}
              type="tel"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="9876543210"
              className={inputCx(!!errors.phone)}
            />
          </Field>
        </div>

        {/* Email */}
        <Field label="Email address" error={errors.email?.message}>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            placeholder="admin@scholarshub.in"
            className={inputCx(!!errors.email)}
          />
        </Field>

        {/* Admin secret */}
        <Field
          label="Admin authorization key"
          hint="Contact the platform owner for this key."
          error={errors.adminSecret?.message}
        >
          <PasswordInput
            {...register("adminSecret")}
            autoComplete="off"
            placeholder="Enter admin authorization key"
            error={errors.adminSecret?.message}
          />
        </Field>

        {/* Password */}
        <Field label="Password" error={errors.password?.message}>
          <PasswordInput
            {...register("password")}
            autoComplete="new-password"
            placeholder="Create a strong password"
          />
          <PasswordStrengthBar password={password} />
        </Field>

        {/* Confirm password */}
        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <PasswordInput
            {...register("confirmPassword")}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            error={errors.confirmPassword?.message}
          />
        </Field>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-forest-700 text-sm font-semibold text-sand-100 transition hover:bg-forest-900 disabled:opacity-60"
        >
          {isSubmitting && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-sand-100/40 border-t-sand-100" />
          )}
          Create Admin Account
        </button>
      </form>

      <p className="text-sm text-forest-900/70">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-forest-900 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function inputCx(hasError: boolean) {
  return [
    "h-11 w-full rounded-xl border bg-white px-3 text-sm text-forest-900",
    "outline-none transition focus:ring-2 focus:ring-forest-700/30",
    hasError
      ? "border-red-400 focus:border-red-500"
      : "border-line focus:border-forest-700",
  ].join(" ");
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
      {label}
      {hint && <span className="text-xs font-normal text-forest-900/50">{hint}</span>}
      {children}
      {error && <p className="text-xs font-normal text-red-500">{error}</p>}
    </label>
  );
}
