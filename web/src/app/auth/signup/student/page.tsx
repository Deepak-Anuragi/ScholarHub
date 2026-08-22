"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import {
  studentSignupSchema,
  type StudentSignupInput,
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

const EXAM_TYPES = [
  { value: "UPSC",     label: "UPSC" },
  { value: "JEE",      label: "JEE" },
  { value: "NEET",     label: "NEET" },
  { value: "SSC",      label: "SSC" },
  { value: "BANKING",  label: "Banking" },
  { value: "BOARD",    label: "Board Exam" },
  { value: "ENTRANCE", label: "Entrance Exam" },
  { value: "OTHER",    label: "Other" },
] as const;

const currentYear = new Date().getFullYear();

export default function StudentSignupPage() {
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
  } = useForm<StudentSignupInput>({
    resolver: zodResolver(studentSignupSchema),
  });

  const password = watch("password", "");

  const onSubmit = async (data: StudentSignupInput) => {
    setSubmitting(true);
    setServerError("");

    try {
      const res = await fetch("/api/auth/signup/student", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name:       data.name,
          email:      data.email,
          phone:      data.phone,
          password:   data.password,
          city:       data.city,
          state:      data.state,
          examType:   data.examType,
          targetYear: data.targetYear,
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
            setError(field as keyof StudentSignupInput, { message: msgs[0] });
            hasFieldError = true;
          }
        });
        if (!hasFieldError) {
          setServerError(errs.general?.[0] ?? "Signup failed. Please try again.");
        }
        return;
      }

      await refresh();
      router.push("/student");
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
        <p className="mt-3 text-sm font-semibold text-forest-900/70">Student account</p>
        <h2 className="mt-1 font-display text-2xl text-forest-900">
          Create your account
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <FormError message={serverError} />

        {/* Name + Phone row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.name?.message}>
            <input
              {...register("name")}
              type="text"
              autoComplete="name"
              placeholder="Rahul Sharma"
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
        <Field
          label="Email address"
          hint="Must start with a letter"
          error={errors.email?.message}
        >
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            placeholder="rahul@gmail.com"
            className={inputCx(!!errors.email)}
          />
        </Field>

        {/* City + State row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" error={errors.city?.message}>
            <input
              {...register("city")}
              type="text"
              placeholder="Mumbai"
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

        {/* Exam type + Target year */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preparing for" error={errors.examType?.message}>
            <select {...register("examType")} className={inputCx(!!errors.examType)}>
              <option value="">Select exam</option>
              {EXAM_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Target year (optional)" error={errors.targetYear?.message}>
            <input
              {...register("targetYear", {
                setValueAs: (v: string) => (v === "" ? undefined : Number(v)),
              })}
              type="number"
              min={currentYear}
              max={currentYear + 10}
              placeholder={String(currentYear + 1)}
              className={inputCx(!!errors.targetYear)}
            />
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
          Create Student Account
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

// ── Helpers ────────────────────────────────────────────────────────────────

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
