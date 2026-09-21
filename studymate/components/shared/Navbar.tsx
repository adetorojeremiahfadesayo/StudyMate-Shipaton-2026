"use client";

import Link from "next/link";
import { Menu, Sparkles } from "lucide-react";

export type DashboardUser = {
  email: string | null;
  fullName: string | null;
};

type NavbarProps = {
  title: string;
  user: DashboardUser | null;
  onMenuClick: () => void;
};

function getAvatarLetter(user: DashboardUser | null) {
  const source = user?.fullName || user?.email || "U";
  return source.trim().charAt(0).toUpperCase() || "U";
}

export default function Navbar({ title, user, onMenuClick }: NavbarProps) {
  const avatarLetter = getAvatarLetter(user);

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-100 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/recommendations"
            className="hidden items-center gap-2 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:border-violet-200 sm:inline-flex"
          >
            <Sparkles className="h-4 w-4" />
            Next step
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
            {avatarLetter}
          </div>
        </div>
      </div>
    </header>
  );
}
