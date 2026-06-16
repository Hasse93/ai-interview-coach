# 🎯 AI Interview Coach

Practice realistic, role-specific job interviews with an AI coach. Upload your CV for instant strengths/weaknesses analysis, then drill with tailored questions (structured **or** free-flowing conversation), answer by voice or text, get scored feedback on every answer, and track your progress on a dashboard — all in a modern, polished UI.

Built as a full-stack portfolio project: **Next.js 14 · TypeScript · Gemini (primary) / Claude (fallback) · Tailwind CSS**.

**▶️ Live demo: [aiinterviewcoach.me](https://aiinterviewcoach.me)**

![status](https://img.shields.io/badge/tests-34%20passing-brightgreen) ![next](https://img.shields.io/badge/Next.js-14-black) ![ai](https://img.shields.io/badge/AI-Gemini%20%7C%20Claude-5b6cff) ![deploy](https://img.shields.io/badge/deployed-Vercel-black)

---

## 🗺️ Architecture

<p align="center"><img src="docs/architecture.svg" alt="AI Interview Coach architecture diagram" width="680"></p>

Requests flow top-down: the React frontend calls **Next.js API routes** (every call passes through **Zod validation** + **rate limiting**), which branch into an **AI path** — Gemini primary → Claude fallback → demo engine — and a **data path** — Auth.js → Prisma → SQLite/Postgres.

---

## ✨ Features

| | |
|---|---|
| 📄 **CV upload & analysis** | Upload a PDF/text CV → AI scores fit and lists strengths, gaps, and focus areas. Questions are then tailored to your CV. |
| 🧮 **Semantic matching (local ML)** | An on-device embedding model + cosine similarity scores **CV ↔ role fit** and **answer ↔ question relevance** — no API, no cost, works even when the LLM is rate-limited. |
| 🧠 **Tailored questions** | Pick role, seniority, and interview type, or paste a job description. |
| 💬 **3 interview types** | Behavioral, Technical, and System Design. |
| 🎯💬 **Two practice modes** | **Structured** (Q → answer → scored feedback) or **Conversation** (free-flowing chat with an AI interviewer). |
| 🎙️ **Voice or text answers** | Answer out loud with built-in speech-to-text (Web Speech API) or type. |
| ⚡ **Instant scored feedback** | 0–100 score, strengths, improvements, STAR breakdown, and a model answer. |
| 🔁 **Adaptive follow-ups** | The coach reacts to your answer with a realistic follow-up. |
| 📊 **Performance report** | Overall score, dimension breakdown, and prioritized action items. |
| 📈 **Progress dashboard** | Score-trend chart, averages by interview type, and weakest-skills breakdown. |
| 👤 **Accounts & cross-device sync** | Sign up (email + password) to save reports to a database and pick up on any device. Logged-out users fall back to localStorage. |
| 📱 **Installable PWA** | Responsive down to mobile, with a web app manifest + icons so it can be "Add to Home Screen" installed. |
| 🛟 **Demo mode** | Runs fully without an API key **or** database using deterministic engines + localStorage. |

## 🏗️ Tech stack

- **Framework:** Next.js 14 (App Router) — full-stack React in one deployable unit
- **Language:** TypeScript (strict)
- **AI provider:** **Google Gemini** (`gemini-2.0-flash`) primary via `@google/genai`, **Anthropic Claude** (`claude-opus-4-8`) fallback via `@anthropic-ai/sdk` — selected automatically by which API key is present, with a graceful no-key deterministic fallback. Provider logic is isolated in `src/lib/ai.ts`.
- **Auth:** Auth.js (NextAuth v5) — email/password credentials, JWT sessions, `bcryptjs` hashing
- **Database:** **PostgreSQL** (Neon) via **Prisma ORM** — pooled (PgBouncer) connection at runtime, direct connection for migrations
- **Machine learning:** **Transformers.js** (`@xenova/transformers`) running `all-MiniLM-L6-v2` sentence embeddings **locally** + cosine similarity — for semantic CV/role matching and answer relevance (`src/lib/embeddings.ts`). No external API, no cost.
- **CV parsing:** `pdf-parse` (server-side PDF → text)
- **PWA:** Next.js `manifest.webmanifest` + SVG app icon, mobile-responsive layout
- **Validation:** Zod schemas shared between client and API
- **Styling:** Tailwind CSS — glassmorphism, dark gradient theme, custom animations
- **Testing:** Vitest — 28 tests (unit + API routes)
- **Deployment:** Vercel (zero-config)

## 🚀 Getting started

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL + DIRECT_URL (Neon), AUTH_SECRET, GEMINI_API_KEY
npx prisma migrate deploy     # apply the schema to your database
npm run dev                   # http://localhost:3000
```

> **No API key needed** to start — the app runs in **demo mode** using a deterministic engine. Add a **free** `GEMINI_API_KEY` ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)) for live AI. Provider precedence: `GEMINI_API_KEY` → `ANTHROPIC_API_KEY` → demo.
>
> **Accounts are optional** — without a database/`AUTH_SECRET` the app still works and saves history to `localStorage`. With them, sign-up enables cross-device sync.

### Database (Neon Postgres)

1. Create a free database at [Neon](https://neon.tech).
2. Set `DATABASE_URL` to the **pooled** connection string (host contains `-pooler`) and `DIRECT_URL` to the **direct** one (same string without `-pooler`).
3. Run `npx prisma migrate deploy` to create the tables.

## 🧪 Testing

```bash
npm test
```

Covers JSON parsing/recovery, the deterministic scoring engine, and all three API route handlers (validation + happy path).

## 📂 Architecture

```
prisma/schema.prisma         User + InterviewReport models
src/
├─ app/
│  ├─ page.tsx              Landing page
│  ├─ interview/page.tsx    Setup → session/chat → report flow (client)
│  ├─ dashboard/page.tsx    Progress dashboard (trend chart, breakdowns)
│  ├─ login,signup/page.tsx Auth pages
│  ├─ manifest.ts, icon.svg PWA manifest + app icon
│  └─ api/
│     ├─ auth/[...nextauth] Auth.js handler
│     ├─ signup/route.ts    Create account (bcrypt)
│     ├─ me/route.ts        Current-user lookup
│     ├─ sessions/route.ts  Save / list reports (DB, auth-guarded)
│     ├─ cv/route.ts        Parse + analyze an uploaded CV
│     ├─ questions/route.ts Generate tailored questions
│     ├─ evaluate/route.ts  Score a single answer
│     ├─ chat/route.ts      Conversation-mode interviewer turns
│     └─ report/route.ts    Build the final report
├─ components/   ScoreRing, CvAnalysisCard, HeaderNav, AuthShell
└─ lib/
   ├─ ai.ts        Provider-agnostic client (Gemini→Claude) + JSON recovery
   ├─ auth.ts      Auth.js config (credentials + JWT)
   ├─ db.ts        Prisma client singleton
   ├─ session.ts   Safe getCurrentUser() wrapper
   ├─ history.ts   DB-or-localStorage history layer
   ├─ prompts.ts   Prompt templates
   ├─ fallback.ts  Deterministic demo-mode engine
   ├─ cv.ts        PDF/text extraction
   ├─ types.ts     Zod schemas + shared types
   ├─ useSpeech.ts Web Speech API hook
   ├─ useUser.ts   Client auth-state hook
   └─ storage.ts   Local history persistence
```

Every API route validates input with Zod and **falls back to the deterministic engine** if the model is unavailable or returns malformed JSON — so the UX never dead-ends.

## ☁️ Deploy

Push to GitHub and import into [Vercel](https://vercel.com/new) (framework auto-detected). Set `GEMINI_API_KEY` in the project's Environment Variables for live AI. That's it.

```bash
npm i -g vercel && vercel        # or deploy from the dashboard
```

## 🧮 Machine learning — semantic matching

Beyond the LLM, the app runs a **classic ML pipeline locally** (no API, no cost):

1. Text (a CV, or a candidate's answer) is encoded into a **384-dimension embedding vector** by `all-MiniLM-L6-v2`, run in-process with **Transformers.js**.
2. **Cosine similarity** between vectors produces a 0–100 score.

It powers two features:
- **CV ↔ role fit** — how semantically close your CV is to the target role.
- **Answer ↔ question relevance** — an "on-topic" score for each answer (e.g. an on-topic React answer scored **57%** vs **2%** for an off-topic one in testing).

The model loads lazily and is cached; every call **degrades gracefully** (returns `null`) if the model is unavailable, so it never blocks a response — and it keeps working even when the LLM is rate-limited. Code: [`src/lib/embeddings.ts`](src/lib/embeddings.ts).

> **Production note:** the model (~23 MB) loads at runtime, which adds cold-start time on serverless. For heavy traffic, precompute embeddings or move them to a dedicated embedding service; the call sites are isolated in one module.

## ⚡ Scaling & performance

The app is a stateless Next.js full-stack app, so the web/API tier auto-scales on Vercel. The work that's been done and the known limits:

**Implemented**
- **Streaming responses** — conversation mode streams the interviewer's reply token-by-token (Server-driven `ReadableStream`), so it feels instant instead of waiting on a spinner.
- **Rate limiting** — every AI route is guarded by a sliding-window limiter (`src/lib/rateLimit.ts`) to protect quota and curb abuse. Returns `429` with `Retry-After`.
- **Graceful degradation** — if the AI provider is unavailable or quota is hit, routes fall back to a deterministic engine instead of erroring.
- **Informative loading states** to reduce perceived latency on the non-streamed (structured JSON) calls.

**For real production traffic, switch these on:**
1. **Paid Gemini tier** — the free tier is ~10–15 requests/minute *shared across all users*; the biggest bottleneck under load. A paid key raises this to thousands/min.
2. **Pooled database connection** — serverless can exhaust Postgres connections. Use Neon's **pooled** endpoint (the `-pooler` host) for `DATABASE_URL`, e.g. `...@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require`.
3. **Distributed rate limiting** — the in-memory limiter is per-instance; for a global limit across serverless instances, swap in Upstash Redis (`@upstash/ratelimit`) at the same call site.

**Why CV analysis / question generation take a few seconds:** that's LLM generation time — the model reads the input and writes a full structured response token-by-token (CV analysis is slowest: long input + long output + PDF parsing). Network round-trips and serverless cold starts add a little. Streaming hides this for conversational replies; the structured JSON calls need the full response before rendering their cards, so they show a progress indicator instead.

## 🗺️ Roadmap ideas

- Postgres + Prisma for cross-device history & accounts
- Audio playback of model answers (TTS)
- Shareable report links
- Per-question scoring shown inline during conversation mode

---

Built with ❤️ by Hussam Sarmini.
