# 🎯 AI Interview Coach

Practice realistic, role-specific job interviews with an AI coach. Upload your CV for instant strengths/weaknesses analysis, then drill with tailored questions (structured **or** free-flowing conversation), answer by voice or text, get scored feedback on every answer, and track your progress on a dashboard — all in a modern, polished UI.

Built as a full-stack portfolio project: **Next.js 14 · TypeScript · Gemini (primary) / Claude (fallback) · Tailwind CSS**.

![status](https://img.shields.io/badge/tests-28%20passing-brightgreen) ![next](https://img.shields.io/badge/Next.js-14-black) ![ai](https://img.shields.io/badge/AI-Gemini%20%7C%20Claude-5b6cff)

---

## ✨ Features

| | |
|---|---|
| 📄 **CV upload & analysis** | Upload a PDF/text CV → AI scores fit and lists strengths, gaps, and focus areas. Questions are then tailored to your CV. |
| 🧠 **Tailored questions** | Pick role, seniority, and interview type, or paste a job description. |
| 💬 **3 interview types** | Behavioral, Technical, and System Design. |
| 🎯💬 **Two practice modes** | **Structured** (Q → answer → scored feedback) or **Conversation** (free-flowing chat with an AI interviewer). |
| 🎙️ **Voice or text answers** | Answer out loud with built-in speech-to-text (Web Speech API) or type. |
| ⚡ **Instant scored feedback** | 0–100 score, strengths, improvements, STAR breakdown, and a model answer. |
| 🔁 **Adaptive follow-ups** | The coach reacts to your answer with a realistic follow-up. |
| 📊 **Performance report** | Overall score, dimension breakdown, and prioritized action items. |
| 📈 **Progress dashboard** | Score-trend chart, averages by interview type, and weakest-skills breakdown. |
| 🛟 **Demo mode** | Runs fully without an API key using a deterministic built-in engine. |

## 🏗️ Tech stack

- **Framework:** Next.js 14 (App Router) — full-stack React in one deployable unit
- **Language:** TypeScript (strict)
- **AI provider:** **Google Gemini** (`gemini-2.0-flash`) primary via `@google/genai`, **Anthropic Claude** (`claude-opus-4-8`) fallback via `@anthropic-ai/sdk` — selected automatically by which API key is present, with a graceful no-key deterministic fallback. Provider logic is isolated in `src/lib/ai.ts`.
- **CV parsing:** `pdf-parse` (server-side PDF → text)
- **Validation:** Zod schemas shared between client and API
- **Styling:** Tailwind CSS — glassmorphism, dark gradient theme, custom animations
- **Testing:** Vitest — 28 tests (unit + all 5 API routes)
- **Deployment:** Vercel (zero-config)

## 🚀 Getting started

```bash
npm install
cp .env.example .env.local   # optional — add GEMINI_API_KEY for live AI
npm run dev                  # http://localhost:3000
```

> Without an API key the app runs in **demo mode** — fully functional, using a deterministic question/feedback engine. Add a **free** `GEMINI_API_KEY` ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)) to `.env.local` to switch on live AI. Provider precedence: `GEMINI_API_KEY` → `ANTHROPIC_API_KEY` → demo.

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
│  ├─ interview/page.tsx    Setup → session/chat → report flow (client)
│  ├─ dashboard/page.tsx    Progress dashboard (trend chart, breakdowns)
│  └─ api/
│     ├─ cv/route.ts        Parse + analyze an uploaded CV
│     ├─ questions/route.ts Generate tailored questions
│     ├─ evaluate/route.ts  Score a single answer
│     ├─ chat/route.ts      Conversation-mode interviewer turns
│     └─ report/route.ts    Build the final report
├─ components/
│  ├─ ScoreRing.tsx         Animated SVG score gauge
│  └─ CvAnalysisCard.tsx    CV strengths/weaknesses card
└─ lib/
   ├─ ai.ts        Provider-agnostic client (Gemini→Claude) + JSON recovery
   ├─ prompts.ts   Prompt templates
   ├─ fallback.ts  Deterministic demo-mode engine
   ├─ cv.ts        PDF/text extraction
   ├─ types.ts     Zod schemas + shared types
   ├─ useSpeech.ts Web Speech API hook
   └─ storage.ts   Local history persistence
```

Every API route validates input with Zod and **falls back to the deterministic engine** if the model is unavailable or returns malformed JSON — so the UX never dead-ends.

## ☁️ Deploy

Push to GitHub and import into [Vercel](https://vercel.com/new) (framework auto-detected). Set `GEMINI_API_KEY` in the project's Environment Variables for live AI. That's it.

```bash
npm i -g vercel && vercel        # or deploy from the dashboard
```

## 🗺️ Roadmap ideas

- Postgres + Prisma for cross-device history & accounts
- Audio playback of model answers (TTS)
- Shareable report links
- Per-question scoring shown inline during conversation mode

---

Built with ❤️ by Sarmini.
