"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Navbar, { type DashboardUser } from "./Navbar";
import Sidebar from "./Sidebar";

type DashboardShellProps = {
  children: ReactNode;
  user: DashboardUser | null;
  isDemoMode: boolean;
};

const routeTitles: Record<string, string> = {
  "/dashboard": "Home",
  "/courses": "Study Flow",
  "/courses/new": "New Upload",
  "/study-plan": "Study Plan",
  "/recommendations": "Recommendations",
};

function getPageTitle(pathname: string) {
  if (routeTitles[pathname]) {
    return routeTitles[pathname];
  }

  if (pathname.startsWith("/courses")) {
    if (pathname.includes("/materials")) return "Upload";
    if (pathname.includes("/learn")) return "Learn";
    if (pathname.includes("/exam-prep") || pathname.includes("/past-questions")) return "Exam Prep";
    if (pathname.includes("/report")) return "Revision PDF";
    return "Study Flow";
  }

  return "Dashboard";
}

export default function DashboardShell({
  children,
  user,
  isDemoMode,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const resolvedUser =
    user ??
    (isDemoMode
      ? {
          email: "demo@student.studymate.local",
          fullName: "Demo Student",
        }
      : null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userEmail={resolvedUser?.email ?? "No email available"}
      />

      <div className="min-h-screen lg:pl-[240px]">
        <Navbar
          title={getPageTitle(pathname)}
          user={resolvedUser}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
