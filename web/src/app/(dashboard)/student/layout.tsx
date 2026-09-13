import { redirect } from "next/navigation";

import { StudentSidebar } from "@/components/dashboard/StudentSidebar";
import { getSessionUser } from "@/lib/auth-session";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Only students (and admins browsing as students) can access this
  if (user.role !== "student" && user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] min-w-0 bg-sand-100">
      <StudentSidebar />
      {/* main content — add bottom padding on mobile for the bottom nav */}
      <main className="min-w-0 flex-1 overflow-x-hidden pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
