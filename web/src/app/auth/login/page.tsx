"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { getDashboardPath } from "@/lib/auth";
import { useAuth } from "@/components/providers/auth-provider";
import PasswordInput from "@/components/auth/PasswordInput";
import FormError from "@/components/auth/FormError";

type Role = "student" | "owner" | "admin";

const ROLES: { value: Role; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "owner",   label: "Library Owner" },
  { value: "admin",   label: "Admin" },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, refresh } = useAuth();

  const [role, setRole]             = useState<Role>("student");
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  // Already logged in → go straight to their dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(getDashboardPath(user.role));
    }
  }, [authLoading, user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { role: "student" },
  });

  const onSubmit = async (data: LoginInput) => {
    setSubmitting(true);
    setServerError("");

    try {
      const res = await fetch("/api/auth/login", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ email: data.email, password: data.password, role }),
      });

      const json = (await res.json()) as {
        success: boolean;
        user?: { role: Role };
        errors?: Record<string, string[]>;
      };

      if (!json.success) {
        setServerError(
          json.errors?.general?.[0] ??
          json.errors?.email?.[0] ??
          "Login failed. Please try again."
        );
        return;
      }

      // Refresh the auth context so the provider picks up the new cookie
      await refresh();
      router.push(getDashboardPath(role));
      router.refresh();
    } catch {
      setServerError("Unable to connect. Please check your internet and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="grid gap-6">
      {/* Heading */}
      <div>
        <p className="text-sm font-semibold text-forest-900/70">Welcome back</p>
        <h2 className="mt-2 font-display text-2xl text-forest-900">
          Sign in to Scholar&apos;s Hub
        </h2>
      </div>

      {/* Role tabs */}
      <div
        className="flex rounded-xl border border-line p-1 gap-1"
        role="tablist"
        aria-label="Account type"
      >
        {ROLES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={role === value}
            onClick={() => setRole(value)}
            className={[
              "flex-1 rounded-lg py-2 text-xs font-semibold transition-colors",
              role === value
                ? "bg-forest-700 text-sand-100"
                : "text-forest-900/60 hover:text-forest-900",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <FormError message={serverError} />

        {/* Email */}
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

        {/* Password */}
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-forest-900">Password</span>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-forest-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            {...register("password")}
            autoComplete="current-password"
            placeholder="Enter your password"
            error={errors.password?.message}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-forest-700 text-sm font-semibold text-sand-100 transition hover:bg-forest-900 disabled:opacity-60"
        >
          {isSubmitting && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-sand-100/40 border-t-sand-100" />
          )}
          Sign in as {ROLES.find((r) => r.value === role)?.label}
        </button>
      </form>

      <p className="text-sm text-forest-900/70">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="font-semibold text-forest-900 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
