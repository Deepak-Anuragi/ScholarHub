import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { getSessionUser } from "@/lib/auth-session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "admin") redirect("/");

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] bg-sand-100">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden pb-20 lg:pb-0">{children}</main>
    </div>
  );
}
