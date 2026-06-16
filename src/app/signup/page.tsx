"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { AuthShell } from "@/components/AuthShell";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not sign up");
      // Auto sign-in after successful registration.
      const signin = await signIn("credentials", { email, password, redirect: false });
      if (signin?.error) throw new Error("Account created — please sign in.");
      window.location.href = "/interview";
    } catch (err: any) {
      setError(err.message ?? "Could not sign up");
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Save your reports and track progress across all your devices.">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">{error}</p>}
        <div>
          <label className="label">Name <span className="font-normal normal-case text-slate-500">(optional)</span></label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sarmini" />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label">Password <span className="font-normal normal-case text-slate-500">(min 8 characters)</span></label>
          <input type="password" required minLength={8} className="field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <button disabled={loading} className="btn-primary w-full">{loading ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <a href="/login" className="font-semibold text-brand-300 hover:underline">Sign in</a>
      </p>
    </AuthShell>
  );
}
