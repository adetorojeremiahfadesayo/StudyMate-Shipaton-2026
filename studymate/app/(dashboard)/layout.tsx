import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/shared/DashboardShell";
import { IS_DEMO_MODE } from "@/lib/demo-auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user && !IS_DEMO_MODE) {
    redirect("/login");
  }

  return (
    <DashboardShell
      user={
        session?.user
          ? {
              email: session.user.email ?? null,
              fullName: typeof session.user.user_metadata?.full_name === "string" ? session.user.user_metadata.full_name : null,
            }
          : null
      }
      isDemoMode={IS_DEMO_MODE}
    >
      {children}
    </DashboardShell>
  );
}
