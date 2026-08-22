"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import {
  ownerSignupSchema,
  type OwnerSignupInput,
} from "@/lib/validations/auth";
import { useAuth } from "@/components/providers/auth-provider";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordStrengthBar from "@/components/auth/PasswordStrengthBar";
import FormError from "@/components/auth/FormError";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

export default function OwnerSignupPage() {
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
  } = useForm<OwnerSignupInput>({
    resolver: zodResolver(ownerSignupSchema),
  });

  const password = watch("password", "");

  const onSubmit = async (data: OwnerSignupInput) => {
    setSubmitting(true);
    setServerError("");

    try {
      const res = await fetch("/api/auth/signup/owner", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name:        data.name,
          email:       data.email,
          phone:       data.phone,
          password:    data.password,
          libraryName: data.libraryName,
          city:        data.city,
          state:       data.state,
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
            setError(field as keyof OwnerSignupInput, { message: msgs[0] });
            hasFieldError = true;
          }
        });
        if (!hasFieldError) {
          setServerError(errs.general?.[0] ?? "Signup failed. Please try again.");
        }
        return;
      }

      await refresh();
      router.push("/owner");
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
        <Link
          href="/auth/signup"
          className="text-xs text-forest-900/50 hover:text-forest-900 transition-colors"
        >
          ← Back to role selection
        </Link>
        <p className="mt-3 text-sm font-semibold text-forest-900/70">Library owner account</p>
        <h2 className="mt-1 font-display text-2xl text-forest-900">
          Register your library
        </h2>
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
              placeholder="Suresh Patel"
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
            placeholder="suresh@gmail.com"
            className={inputCx(!!errors.email)}
          />
        </Field>

        {/* Library name */}
        <Field
          label="Library name"
          hint="This will be the public name of your library"
          error={errors.libraryName?.message}
        >
          <input
            {...register("libraryName")}
            type="text"
            placeholder="Sunrise Study Library"
            className={inputCx(!!errors.libraryName)}
          />
        </Field>

        {/* City + State */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" error={errors.city?.message}>
            <input
              {...register("city")}
              type="text"
              placeholder="Pune"
              className={inputCx(!!errors.city)}
            />
          </Field>
          <Field label="State" error={errors.state?.message}>
            <select {...register("state")} className={inputCx(!!errors.state)}>
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>

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
          Register as Library Owner
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
