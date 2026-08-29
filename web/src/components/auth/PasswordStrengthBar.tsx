"use client";

import { Check, Circle } from "lucide-react";
import { getPasswordStrength } from "@/lib/validations/auth";

interface Props {
  password: string;
}

export default function PasswordStrengthBar({ password }: Props) {
  const { strength, score, checks } = getPasswordStrength(password);

  if (!password) return null;

  const config = {
    weak:   { bar: "bg-red-500",    label: "Weak",   text: "text-red-600"    },
    medium: { bar: "bg-yellow-500", label: "Medium", text: "text-yellow-600" },
    strong: { bar: "bg-green-600",  label: "Strong", text: "text-green-700"  },
    empty:  { bar: "bg-gray-200",   label: "",       text: "text-gray-400"   },
  }[strength];

  const items = [
    { label: "At least 8 characters",            done: checks.minLength   },
    { label: "At most 15 characters",            done: checks.maxLength   },
    { label: "At least 1 uppercase letter (A-Z)", done: checks.uppercase  },
    { label: "At least 1 lowercase letter (a-z)", done: checks.lowercase  },
    { label: "At least 1 number (0-9)",           done: checks.number     },
    { label: "At least 1 special character",      done: checks.specialChar },
    { label: "No spaces",                         done: checks.noSpaces   },
  ];

  return (
    <div className="mt-2 space-y-2">
      {/* Bar + label */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-all duration-300 ${config.bar}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${config.text}`}>
          {config.label}
        </span>
      </div>

      {/* Checklist */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {items.map(({ label, done }) => (
          <li key={label} className="flex items-center gap-1.5 text-xs">
            <span className={done ? "text-green-600" : "text-gray-300"} aria-hidden>
              {done ? <Check className="size-3.5" /> : <Circle className="size-3.5" />}
            </span>
            <span className={done ? "text-green-700" : "text-forest-900/50"}>
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
