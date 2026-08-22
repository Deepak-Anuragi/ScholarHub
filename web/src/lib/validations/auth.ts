import { z } from "zod";

// ── Regex constants ────────────────────────────────────────────────────────

const passwordRegex = {
  uppercase:   /[A-Z]/,
  lowercase:   /[a-z]/,
  number:      /[0-9]/,
  specialChar: /[!@#$%^&*()\-_=+[\]{}|;':",.<>?/\\`~]/,
  noSpaces:    /^\S+$/,
};

const emailRegex = {
  startsWithLetter: /^[a-zA-Z]/,
  hasDotInDomain:   /@[^@]+\.[^@]+$/,
};

export const phoneRegex     = /^[6-9][0-9]{9}$/;
export const cityStateRegex = /^[a-zA-Z\s]{2,50}$/;

// ── Password schema ────────────────────────────────────────────────────────

export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .max(15, "Password must be at most 15 characters")
  .regex(passwordRegex.noSpaces, "Password must not contain spaces")
  .regex(passwordRegex.uppercase, "Password must contain at least one uppercase letter (A-Z)")
  .regex(passwordRegex.lowercase, "Password must contain at least one lowercase letter (a-z)")
  .regex(passwordRegex.number, "Password must contain at least one number (0-9)")
  .regex(
    passwordRegex.specialChar,
    "Password must contain at least one special character (!@#$%^&* etc.)"
  );

// ── Email schema ───────────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .regex(emailRegex.startsWithLetter, "Email must start with a letter (a-z), not a number or symbol")
  .email("Please enter a valid email address (e.g. john@gmail.com)")
  .regex(emailRegex.hasDotInDomain, "Email domain must contain a dot (e.g. @gmail.com)")
  .refine((v) => !/\s/.test(v), "Email must not contain spaces")
  .transform((v) => v.toLowerCase().trim());

// ── Name schema ────────────────────────────────────────────────────────────

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be at most 50 characters")
  .regex(/^[a-zA-Z]/, "Name must start with a letter")
  .regex(/^[a-zA-Z][a-zA-Z\s.\-]*$/, "Name can only contain letters, spaces, dots, and hyphens")
  .regex(/\S$/, "Name must not end with a space")
  .refine((v) => !/\d/.test(v), "Name must not contain numbers")
  .transform((v) => v.trim());

// ── Phone schema ───────────────────────────────────────────────────────────

export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^\d+$/, "Phone number must contain only digits (no spaces or dashes)")
  .length(10, "Phone number must be exactly 10 digits")
  .regex(phoneRegex, "Phone number must start with 6, 7, 8, or 9");

// ── City schema ────────────────────────────────────────────────────────────

export const citySchema = z
  .string()
  .min(1, "City is required")
  .min(2, "City must be at least 2 characters")
  .max(50, "City must be at most 50 characters")
  .regex(cityStateRegex, "City name can only contain letters and spaces")
  .transform((v) => v.trim());

// ── State schema ───────────────────────────────────────────────────────────

export const stateSchema = z
  .string()
  .min(1, "State is required")
  .min(2, "State must be at least 2 characters")
  .max(50, "State must be at most 50 characters")
  .regex(cityStateRegex, "State name can only contain letters and spaces")
  .transform((v) => v.trim());

// ── Library name schema ────────────────────────────────────────────────────

export const libraryNameSchema = z
  .string()
  .min(1, "Library name is required")
  .min(3, "Library name must be at least 3 characters")
  .max(100, "Library name must be at most 100 characters")
  .regex(/^[a-zA-Z]/, "Library name must start with a letter")
  .regex(
    /^[a-zA-Z0-9\s\-&'.]+$/,
    "Library name can only contain letters, numbers, spaces, hyphens, and ampersands"
  )
  .regex(/\S$/, "Library name must not end with a space")
  .transform((v) => v.trim());

// ── Exam type schema ───────────────────────────────────────────────────────

export const examTypeSchema = z.enum(
  ["UPSC", "JEE", "NEET", "SSC", "BANKING", "BOARD", "ENTRANCE", "OTHER"],
  { error: () => "Please select a valid exam type" }
);

// ── Target year schema ─────────────────────────────────────────────────────

export const targetYearSchema = z
  .number()
  .int()
  .min(
    new Date().getFullYear(),
    `Target year must be ${new Date().getFullYear()} or later`
  )
  .max(new Date().getFullYear() + 10, "Target year is too far in the future")
  .optional();

// ═══════════════════════════════════════════════════════════════════════════
// Signup schemas — one per role
// ═══════════════════════════════════════════════════════════════════════════

export const studentSignupSchema = z
  .object({
    name:            nameSchema,
    email:           emailSchema,
    phone:           phoneSchema,
    password:        passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    city:            citySchema,
    state:           stateSchema,
    examType:        examTypeSchema,
    targetYear:      targetYearSchema,
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type StudentSignupInput = z.infer<typeof studentSignupSchema>;

export const ownerSignupSchema = z
  .object({
    name:            nameSchema,
    email:           emailSchema,
    phone:           phoneSchema,
    password:        passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    libraryName:     libraryNameSchema,
    city:            citySchema,
    state:           stateSchema,
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type OwnerSignupInput = z.infer<typeof ownerSignupSchema>;

export const adminSignupSchema = z
  .object({
    name:            nameSchema,
    email:           emailSchema,
    phone:           phoneSchema,
    password:        passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    adminSecret:     z.string().min(1, "Admin secret key is required"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AdminSignupInput = z.infer<typeof adminSignupSchema>;

export const loginSchema = z.object({
  email:    emailSchema,
  password: z.string().min(1, "Password is required"),
  role:     z.enum(["admin", "owner", "student"], {
    error: () => "Please select your account type",
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ── Password strength checker ──────────────────────────────────────────────

export type PasswordStrength = "empty" | "weak" | "medium" | "strong";

export function getPasswordStrength(password: string) {
  if (!password) {
    return {
      strength: "empty" as PasswordStrength,
      score: 0,
      checks: {
        minLength:   false,
        maxLength:   true,
        uppercase:   false,
        lowercase:   false,
        number:      false,
        specialChar: false,
        noSpaces:    true,
      },
    };
  }

  const checks = {
    minLength:   password.length >= 8,
    maxLength:   password.length <= 15,
    uppercase:   passwordRegex.uppercase.test(password),
    lowercase:   passwordRegex.lowercase.test(password),
    number:      passwordRegex.number.test(password),
    specialChar: passwordRegex.specialChar.test(password),
    noSpaces:    passwordRegex.noSpaces.test(password),
  };

  const passedCount = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedCount / 7) * 100);

  let strength: PasswordStrength = "weak";
  if (passedCount >= 6) strength = "strong";
  else if (passedCount >= 4) strength = "medium";

  return { strength, score, checks };
}
