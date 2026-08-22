"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, Props>(
  ({ error, className = "", ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className="space-y-1">
        <div className="relative">
          <input
            {...props}
            ref={ref}
            type={show ? "text" : "password"}
            className={[
              "h-11 w-full rounded-xl border bg-white px-3 pr-10 text-sm text-forest-900",
              "outline-none transition focus:ring-2 focus:ring-forest-700/30",
              error
                ? "border-red-400 focus:border-red-500"
                : "border-line focus:border-forest-700",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={show ? "Hide password" : "Show password"}
            onClick={() => setShow((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-900/40 hover:text-forest-900/70 transition-colors"
          >
            {show ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {error && (
          <p className="flex items-center gap-1 text-xs text-red-500">
            <span aria-hidden>⚠</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
