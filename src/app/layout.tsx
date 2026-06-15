import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Interview Coach — Practice. Get feedback. Get hired.",
  description:
    "Practice realistic, role-specific interviews with an AI coach. Get instant scored feedback, STAR analysis, model answers, and a full performance report.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 sm:px-8">
          <header className="flex items-center justify-between py-6">
            <a href="/" className="flex items-center gap-2.5 font-semibold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-lg shadow-lg shadow-brand-500/40">
                🎯
              </span>
              <span className="text-lg tracking-tight">
                Interview<span className="text-brand-400">Coach</span>
              </span>
            </a>
            <a href="/interview" className="btn-ghost hidden sm:inline-flex">
              Start practicing
            </a>
          </header>
          <main className="flex-1 pb-16">{children}</main>
          <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
            Built with Next.js · Claude · Tailwind — a portfolio project by Sarmini.
          </footer>
        </div>
      </body>
    </html>
  );
}
