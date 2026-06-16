"use client";

import { signOut } from "next-auth/react";
import { useUser } from "@/lib/useUser";

export function HeaderNav() {
  const { user, loading } = useUser();

  return (
    <nav className="flex items-center gap-1.5 sm:gap-2">
      <a href="/dashboard" className="rounded-lg px-2.5 py-2 text-sm text-slate-300 transition hover:text-white sm:px-3">
        Dashboard
      </a>
      {loading ? (
        <span className="h-9 w-20 animate-pulse rounded-xl bg-white/5" />
      ) : user ? (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className="hidden max-w-[140px] truncate text-sm text-slate-400 sm:inline"
            title={user.email}
          >
            {user.name || user.email}
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-500/30 text-sm font-semibold text-brand-200 sm:hidden">
            {(user.name || user.email).charAt(0).toUpperCase()}
          </span>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-ghost px-3 py-2 text-sm">
            Sign out
          </button>
        </div>
      ) : (
        <>
          <a href="/login" className="rounded-lg px-2.5 py-2 text-sm text-slate-300 transition hover:text-white sm:px-3">
            Sign in
          </a>
          <a href="/interview" className="btn-primary px-3 py-2 text-sm sm:px-4">
            Practice
          </a>
        </>
      )}
    </nav>
  );
}
