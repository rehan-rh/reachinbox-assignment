"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "▣",
  },
  {
    name: "Emails",
    href: "/dashboard",
    icon: "✉",
  },
  {
    name: "Compose",
    href: "/compose",
    icon: "+",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 text-white">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white font-bold text-slate-950">
          R
        </div>

        <span className="text-lg font-bold">
          ReachInbox
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Workspace
        </p>

        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-slate-950"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center text-base">
                  {item.icon}
                </span>

                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Settings */}
        <div className="mt-8">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Settings
          </p>

          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white"
          >
            <span className="flex h-6 w-6 items-center justify-center">
              ⚙
            </span>

            Settings
          </Link>
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-800 p-4">
        <div className="rounded-lg bg-slate-900 p-3">
          <p className="text-xs text-slate-500">
            Email Scheduler
          </p>

          <p className="mt-1 text-sm font-medium text-slate-300">
            ReachInbox
          </p>
        </div>
      </div>
    </aside>
  );
}