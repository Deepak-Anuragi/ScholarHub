"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// --- Types -------------------------------------------------------------------

export interface WishlistButtonProps {
  libraryId: string;
  initialWishlisted?: boolean;
  className?: string;
}

// --- Component ---------------------------------------------------------------

/**
 * Bookmark toggle that adds or removes a library from the Student's wishlist.
 *
 * - Optimistic update: flips state immediately, reverts on API error.
 * - Unauthenticated users are redirected to /auth/login on click.
 * - Visual states: filled green bookmark (wishlisted) vs. muted bookmark (not wishlisted).
 *
 * Requirement: 9.5
 */
export function WishlistButton({
  libraryId,
  initialWishlisted = false,
  className,
}: WishlistButtonProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    // Unauthenticated → redirect to login
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (pending) return;

    // Optimistic flip
    const next = !wishlisted;
    setWishlisted(next);
    setPending(true);

    try {
      if (next) {
        // Add to wishlist
        await api.post("/student/wishlist", { libraryId });
      } else {
        // Remove from wishlist
        await api.delete(`/student/wishlist/${libraryId}`);
      }
    } catch {
      // Revert on error
      setWishlisted(!next);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={wishlisted}
      disabled={authLoading || pending}
      onClick={() => void handleClick()}
      className={cn(
        "inline-flex items-center justify-center rounded-full p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        wishlisted
          ? "text-[#16a34a]"
          : "text-forest-900/40 hover:text-forest-900/70",
        className
      )}
    >
      <Bookmark
        className="size-5"
        aria-hidden
        fill={wishlisted ? "currentColor" : "none"}
      />
    </button>
  );
}
