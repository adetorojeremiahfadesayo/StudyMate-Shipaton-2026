"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  FileCheck2,
  Home,
  ListChecks,
  Sparkles,
  Upload,
} from "lucide-react";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  userEmail: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/recommendations", label: "Recommendations", icon: Sparkles },
  { href: "/courses", label: "Study Flow", icon: BookOpen },
  { href: "/courses/new", label: "New Upload", icon: Upload },
  { href: "/study-plan", label: "Study Plan", icon: ListChecks },
  { href: "/courses?focus=pdf", label: "Revision PDFs", icon: FileCheck2 },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  if (href === "/courses") {
    return pathname === "/courses" || (pathname.startsWith("/courses/") && pathname !== "/courses/new");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({ open, onClose, userEmail }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-16 items-center border-b border-gray-100 px-5">
          <Link href="/dashboard" className="text-xl font-bold text-purple-700">
            StudyMate
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-purple-50 text-purple-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-gray-100 p-4">
          <Link
            href="/demo"
            className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-[#13231f] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#244239]"
          >
            <Sparkles className="h-4 w-4" />
            Judge demo
          </Link>
          <p className="truncate text-xs font-medium text-gray-500">{userEmail}</p>
          <p className="mt-2 text-xs text-gray-400">Demo access enabled</p>
        </div>
      </aside>
    </>
  );
}
