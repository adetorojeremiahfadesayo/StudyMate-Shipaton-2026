import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "StudyMate Demo",
  description: "StudyMate demo access.",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-slate-900/95 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {children}
      </div>
    </section>
  );
}
