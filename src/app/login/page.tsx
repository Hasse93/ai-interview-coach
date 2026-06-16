"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { AuthShell } from "@/components/AuthShell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    window.location.href = "/interview";
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to sync your interview history across devices.">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">{error}</p>}
        <div>
          <label className="label">Email</label>
          <input type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" required className="field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <button disabled={loading} className="btn-primary w-full">{loading ? "Signing in…" : "Sign in"}</button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-400">
        New here?{" "}
        <a href="/signup" className="font-semibold text-brand-300 hover:underline">Create an account</a>
      </p>
    </AuthShell>
  );
}
