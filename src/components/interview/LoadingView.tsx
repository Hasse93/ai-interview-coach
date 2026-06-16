"use client";

import { useEffect, useState } from "react";

const LOADING_STEPS = [
  "Reviewing the role and level…",
  "Thinking like an interviewer…",
  "Calibrating difficulty…",
  "Putting it together…",
];

export function LoadingView() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % LOADING_STEPS.length), 1400);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="glass grid min-h-[320px] place-items-center p-10 text-center">
      <div>
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-brand-400" />
        <p className="mt-5 text-sm text-slate-300 transition-opacity">{LOADING_STEPS[i]}</p>
        <p className="mt-1 text-xs text-slate-500">This usually takes a few seconds.</p>
      </div>
    </div>
  );
}
