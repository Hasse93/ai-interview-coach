# Graph Report - ai-interview-coach  (2026-06-18)

## Corpus Check
- 57 files · ~15,859 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 257 nodes · 491 edges · 20 communities (14 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `hasApiKey()` - 15 edges
3. `rateLimited()` - 13 edges
4. `complete()` - 12 edges
5. `🎯 AI Interview Coach` - 11 edges
6. `scripts` - 10 edges
7. `parseJson()` - 10 edges
8. `POST()` - 9 edges
9. `InterviewType` - 8 edges
10. `produceFeedback()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `hasApiKey()`  [EXTRACTED]
  src/app/api/chat/route.ts → src/lib/ai.ts
- `POST()` --calls--> `complete()`  [EXTRACTED]
  src/app/api/cv/route.ts → src/lib/ai.ts
- `POST()` --calls--> `hasApiKey()`  [EXTRACTED]
  src/app/api/cv/route.ts → src/lib/ai.ts
- `POST()` --calls--> `parseJson()`  [EXTRACTED]
  src/app/api/cv/route.ts → src/lib/ai.ts
- `POST()` --calls--> `rateLimited()`  [EXTRACTED]
  src/app/api/cv/route.ts → src/lib/rateLimit.ts

## Import Cycles
- None detected.

## Communities (20 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (32): CvAnalysisCard(), ScoreRing(), ChatView(), ChatViewProps, FeedbackCard(), HistorySidebar(), HistorySidebarProps, LOADING_STEPS (+24 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (34): POST(), streamHeaders(), POST(), produceFeedback(), BANKS, CV_SIGNALS, detectStar(), fallbackChat() (+26 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (27): dependencies, @anthropic-ai/sdk, bcryptjs, @google/genai, next, next-auth, pdf-parse, @prisma/client (+19 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (14): metadata, viewport, HeaderNav(), DashboardPage(), TYPE_LABEL, fetchHistory(), persistSession(), clearHistory() (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (10): { handlers, auth, signIn, signOut }, globalForPrisma, CurrentUser, getCurrentUser(), SaveSessionSchema, SignupSchema, GET(), GET() (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (13): GET(), activeProvider(), complete(), completeAnthropic(), completeGemini(), CompleteOpts, hasApiKey(), parseJson() (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (11): POST(), extractCvText(), normalize(), cosineSimilarity(), embed(), getExtractor(), semanticScore(), trySemanticScore() (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (12): 🎯 AI Interview Coach, 🗺️ Architecture, 📂 Architecture, Database (Neon Postgres), ☁️ Deploy, ✨ Features, 🚀 Getting started, 🧮 Machine learning — semantic matching (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.20
Nodes (10): scripts, build, db:migrate, db:push, dev, lint, postinstall, start (+2 more)

## Knowledge Gaps
- **91 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `description` (+86 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useUser()` connect `Community 3` to `Community 0`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `hasApiKey()` connect `Community 6` to `Community 1`, `Community 7`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _91 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0898989898989899 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10801393728222997 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.14855072463768115 - nodes in this community are weakly interconnected._