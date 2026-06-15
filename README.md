# 🎯 AI Interview Coach

Practice realistic, role-specific job interviews with an AI coach. Get instant, scored feedback on every answer, STAR-method analysis, model answers, adaptive follow-ups, and a full performance report — all in a modern, polished UI.

Built as a full-stack portfolio project: **Next.js 14 · TypeScript · Claude · Tailwind CSS**.

![status](https://img.shields.io/badge/tests-passing-brightgreen) ![next](https://img.shields.io/badge/Next.js-14-black) ![claude](https://img.shields.io/badge/AI-Claude-5b6cff)

---

## ✨ Features

| | |
|---|---|
| 🧠 **Tailored questions** | Pick role, seniority, and interview type, or paste a job description to tailor the questions. |
| 💬 **3 interview modes** | Behavioral, Technical, and System Design. |
| 🎙️ **Voice or text answers** | Answer out loud with built-in speech-to-text (Web Speech API) or type. |
| ⚡ **Instant scored feedback** | 0–100 score, strengths, improvements, STAR breakdown, and a model answer. |
| 🔁 **Adaptive follow-ups** | The coach reacts to your answer with a realistic follow-up. |
| 📊 **Performance report** | Overall score, dimension breakdown, and prioritized action items. |
| 📈 **Progress tracking** | Sessions saved locally so you can watch your scores climb. |
| 🛟 **Demo mode** | Runs fully without an API key using a deterministic built-in engine. |

## 🏗️ Tech stack

- **Framework:** Next.js 14 (App Router) — full-stack React in one deployable unit
- **Language:** TypeScript (strict)
- **AI:** Anthropic Claude (`claude-opus-4-8`) via `@anthropic-ai/sdk`, with a graceful no-key fallback
- **Validation:** Zod schemas shared between client and API
- **Styling:** Tailwind CSS — glassmorphism, dark gradient theme, custom animations
- **Testing:** Vitest (unit + API route tests)
- **Deployment:** Vercel (zero-config)

## 🚀 Getting started

```bash
npm install
cp .env.example .env.local   # optional — add your ANTHROPIC_API_KEY for live AI
npm run dev                  # http://localhost:3000
```

> Without an API key the app runs in **demo mode** — fully functional, using a deterministic question/feedback engine. Add `ANTHROPIC_API_KEY` to `.env.local` to switch on live Claude generation.

## 🧪 Testing

```bash
npm test
```

Covers JSON parsing/recovery, the deterministic scoring engine, and all three API route handlers (validation + happy path).

## 📂 Architecture

```
src/
├─ app/
│  ├─ page.tsx              Landing page
│  ├─ interview/page.tsx    Setup → session → report flow (client)
│  └─ api/
│     ├─ questions/route.ts Generate tailored questions
│     ├─ evaluate/route.ts  Score a single answer
│     └─ report/route.ts    Build the final report
├─ components/ScoreRing.tsx Animated SVG score gauge
└─ lib/
   ├─ ai.ts        Claude client + JSON recovery
   ├─ prompts.ts   Prompt templates
   ├─ fallback.ts  Deterministic demo-mode engine
   ├─ types.ts     Zod schemas + shared types
   ├─ useSpeech.ts Web Speech API hook
   └─ storage.ts   Local history persistence
```

Every API route validates input with Zod and **falls back to the deterministic engine** if the model is unavailable or returns malformed JSON — so the UX never dead-ends.

## ☁️ Deploy

Push to GitHub and import into [Vercel](https://vercel.com/new) (framework auto-detected). Set `ANTHROPIC_API_KEY` in the project's Environment Variables for live AI. That's it.

```bash
npm i -g vercel && vercel        # or deploy from the dashboard
```

## 🗺️ Roadmap ideas

- Postgres + Prisma for cross-device history & accounts
- Resume upload (PDF parse) to auto-tailor questions
- Audio playback of model answers (TTS)
- Shareable report links

---

Built with ❤️ by Sarmini.
