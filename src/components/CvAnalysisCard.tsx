import { ScoreRing } from "./ScoreRing";
import type { CvAnalysis } from "@/lib/types";

export function CvAnalysisCard({ analysis }: { analysis: CvAnalysis }) {
  return (
    <div className="glass animate-fade-up mt-4 p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <ScoreRing score={analysis.fitScore} label="CV fit" />
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-accent-400">
            CV analysis
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{analysis.summary}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Column title="Strengths" tone="accent" items={analysis.strengths} mark="+" />
        <Column title="Gaps to address" tone="amber" items={analysis.weaknesses} mark="→" />
      </div>

      {analysis.focusAreas.length > 0 && (
        <div className="mt-5">
          <h4 className="text-sm font-semibold text-brand-300">Prepare these before you interview</h4>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {analysis.focusAreas.map((f, i) => (
              <span key={i} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
      <p className="mt-5 rounded-lg bg-brand-500/10 px-3 py-2 text-xs text-brand-200">
        ✓ Your interview questions will now be tailored to this CV.
      </p>
    </div>
  );
}

function Column({
  title, tone, items, mark,
}: {
  title: string;
  tone: "accent" | "amber";
  items: string[];
  mark: string;
}) {
  const color = tone === "accent" ? "text-accent-400" : "text-amber-300";
  return (
    <div>
      <h4 className={`text-sm font-semibold ${color}`}>{title}</h4>
      <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
        {items.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span className={color}>{mark}</span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
