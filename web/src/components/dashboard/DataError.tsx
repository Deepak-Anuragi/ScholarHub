"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Inline failure state for dashboard data fetches.
 *
 * Dashboard pages previously parsed error responses as data, so a 401 or a
 * dead backend rendered as a page full of zeros. Showing the failure — and a
 * way to retry — is the difference between "no bookings yet" and "we could not
 * reach the server", which look identical otherwise.
 */
export function DataError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-card border border-red-200 bg-red-50 px-5 py-8 text-center"
    >
      <AlertCircle className="mx-auto size-6 text-red-500" aria-hidden />
      <p className="mt-2 text-sm font-semibold text-red-800">
        Couldn&apos;t load this data
      </p>
      <p className="mt-1 text-sm text-red-700/80">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="mt-4 border-red-300 text-red-800 hover:bg-red-100"
        >
          <RefreshCw className="size-4" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  );
}
