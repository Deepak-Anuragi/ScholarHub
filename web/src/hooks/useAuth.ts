"use client";

/**
 * useRequireAuth — route-protection hook for dashboard pages.
 *
 * Usage in a client dashboard page:
 *
 *   const { user, isLoading, logout } = useRequireAuth('student');
 *   if (isLoading) return <Spinner />;
 *   if (!user) return null; // redirect already fired
 *
 * Note: The server-side layouts already redirect unauthenticated users
 * via getSessionUser() + next/navigation redirect(), so this hook is
 * mainly used when you need the user object client-side, or to guard
 * client-only pages that don't have a server layout.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { getDashboardPath, type UserRole } from "@/lib/auth";

export function useRequireAuth(requiredRole?: UserRole) {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/auth/login");
      return;
    }

    // If a specific role is required and this user has a different role,
    // send them to their own dashboard instead.
    if (requiredRole && user.role !== requiredRole) {
      router.push(getDashboardPath(user.role));
    }
  }, [isLoading, user, requiredRole, router]);

  return { user: user ?? null, isLoading, logout };
}
