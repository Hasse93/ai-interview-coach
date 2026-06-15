const FEATURES = [
  {
    icon: "🧠",
    title: "Tailored questions",
    body: "Pick a role, level, and interview type — or paste a job description. The AI crafts realistic, progressively harder questions.",
  },
  {
    icon: "🎙️",
    title: "Answer by voice or text",
    body: "Speak your answer like a real interview using built-in speech-to-text, or type it out. Your call.",
  },
  {
    icon: "⚡",
    title: "Instant scored feedback",
    body: "Every answer gets a 0–100 score, strengths, fixes, STAR analysis, and a model answer you can learn from.",
  },
  {
    icon: "🔁",
    title: "Adaptive follow-ups",
    body: "The coach reacts to what you said and asks the follow-up a real interviewer would — keeping you on your toes.",
  },
  {
    icon: "📊",
    title: "Performance report",
    body: "Finish with an overall scorecard, dimension breakdown, and a prioritized list of what to work on next.",
  },
  {
    icon: "📈",
    title: "Track your progress",
    body: "Sessions are saved locally so you can watch your scores climb over time across roles and interview types.",
  },
];

const STEPS = [
  { n: "1", t: "Set up", d: "Choose role, seniority, and interview type." },
  { n: "2", t: "Practice", d: "Answer AI questions by voice or text." },
  { n: "3", t: "Improve", d: "Get scored feedback and a final report." },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-24">
      {/* Hero */}
      <section className="relative pt-10 text-center sm:pt-20">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-slate-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent-400" />
            Powered by Claude
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Ace your next interview with an{" "}
            <span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">
              AI coach
            </span>{" "}
            in your corner.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-slate-300">
            Practice realistic, role-specific interviews. Get instant, honest feedback on every
            answer — and a full performance report when you finish.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="/interview" className="btn-primary w-full sm:w-auto">
              Start a mock interview →
            </a>
            <a href="#features" className="btn-ghost w-full sm:w-auto">
              See how it works
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-500">No sign-up · Works instantly · Free to use</p>
        </div>
      </section>

      {/* Steps */}
      <section className="grid gap-5 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} className="glass p-6">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/20 text-brand-300 font-bold">
              {s.n}
            </div>
            <h3 className="mt-4 text-lg font-semibold">{s.t}</h3>
            <p className="mt-1.5 text-sm text-slate-400">{s.d}</p>
          </div>
        ))}
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Everything you need to walk in prepared
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass p-6 transition hover:border-brand-400/40">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="glass relative overflow-hidden p-10 text-center sm:p-16">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 animate-float rounded-full bg-brand-500/20 blur-3xl" />
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready when you are.</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-300">
          One click and you&apos;re in a mock interview. The only thing between you and a stronger
          answer is practice.
        </p>
        <a href="/interview" className="btn-primary mt-8">
          Start practicing now →
        </a>
      </section>
    </div>
  );
}
