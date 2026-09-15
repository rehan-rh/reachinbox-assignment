"use client";

import { useState } from "react";

interface HeaderProps {
  name: string;
  email: string;
  avatar?: string | null;
  onLogout: () => void;
}

export default function Header({
  name,
  email,
  avatar,
  onLogout,
}: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Email Campaigns
        </h1>

        <p className="text-sm text-slate-500">
          Manage and monitor your outreach
        </p>
      </div>

      {/* User section */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-slate-100"
        >
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-9 w-9 rounded-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="hidden text-left md:block">
            <p className="text-sm font-medium text-slate-900">
              {name}
            </p>

            <p className="max-w-48 truncate text-xs text-slate-500">
              {email}
            </p>
          </div>

          <span className="text-slate-400">
            ▾
          </span>
        </button>

        {/* Dropdown */}
        {showMenu && (
          <div className="absolute right-0 top-14 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            <div className="border-b border-slate-100 px-3 py-3">
              <p className="text-sm font-medium text-slate-900">
                {name}
              </p>

              <p className="mt-1 truncate text-xs text-slate-500">
                {email}
              </p>
            </div>

            <button
              onClick={onLogout}
              className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}