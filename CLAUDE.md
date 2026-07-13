# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kiroku** (記録 — "record") is a local-first, block-based note editor inspired by Notion. All note data is persisted in IndexedDB and never leaves the browser. The one exception is AI generation, which sends a prompt (and only the prompt) through a serverless proxy to an LLM provider.

## Commands

```bash
npm run dev       # Vite dev server ONLY — /api routes will 404. Use for pure-UI work.
vercel dev        # Frontend + serverless functions together on http://localhost:3000
npm run build     # Type-check all 3 TS projects (tsc -b) then bundle with Vite
npm run preview   # Preview the production build locally
npm run lint      # Run ESLint across all files
```

> **Use `vercel dev`, not `npm run dev`, when touching anything AI-related.** Plain Vite doesn't execute `/api` functions, so `/api/generate` will 404. Note `vercel dev` serves on port **3000**, not 5173.

Environment variables live in Vercel's env store (`vercel env add GEMINI_API_KEY`), not in a committed file. `vercel dev` pulls Development-scoped vars into memory automatically — no `vercel env pull` needed. Vars are read once at startup, so **restart `vercel dev` after changing them**. Note: Vercel does not permit *sensitive* variables in the Development environment, so `GEMINI_API_KEY` is stored as a regular variable.

There are no tests yet (planned for Phase 10).

## Architecture

Kiroku spans **two runtimes**. This is the single most important thing to understand about the codebase.

```
┌─ BROWSER (src/) ────────────────┐        ┌─ SERVER (api/, server/) ───────────┐
│  React → Redux → Services       │  HTTP  │  Route → AIService → LLMProvider   │
│  IndexedDB (all note data)      │ ─────► │  Holds the API key. Calls Gemini.  │
└─────────────────────────────────┘        └────────────────────────────────────┘
             └────────── shared/ (types both sides agree on) ──────────┘
```

| Zone | Contents | Runs on |
|---|---|---|
| `src/` | The 5-layer React app | User's browser |
| `api/` | Serverless function entry points (**each file = a public URL**) | Vercel (Node) |
| `server/` | Server-side logic the routes import (**not** public URLs) | Vercel (Node) |
| `shared/` | Types/constants both runtimes import | Both |

**Rules that follow from this split:**

- **Only route entry points go in `api/`.** Every file there automatically becomes a public endpoint. Helper code lives in `server/` so it isn't accidentally exposed.
- **`src/` must never import from `server/`.** Browser code importing server code drags Node-only globals (`process`) into the browser compile. Anything both sides need goes in `shared/`.
- **The API key lives server-side only.** Browser code ships to the user and is fully readable; server code is not. This is the entire reason the proxy exists.
- **Three TypeScript projects, three rule sets.** `tsconfig.app.json` (browser: DOM lib, `vite/client` types), `tsconfig.server.json` (Node: `node` types), `tsconfig.node.json` (Vite config). The root `tsconfig.json` compiles nothing — it's a table of contents whose `references` `tsc -b` builds in order. **Do not add `"node"` to `tsconfig.app.json`** — that would let browser code reference `process` without complaint, silencing the very error that protects the boundary.

### Browser layers (`src/`)

```
UI Components (React)         ← App.tsx, components/, hooks/, main.tsx (bootstrap)
     ↓
State (Redux Toolkit)         ← store/ (slices, thunks, persistence middleware)
     ↓
Services                      ← services/ (BlockEngine, PageEngine, SlashParser, AIClient)
     ↓
Persistence (IndexedDB)       ← services/StorageService.ts via idb
     ↓
Network boundary              ← POST /api/generate
```

### State Management

| Slice | File | Responsibility |
|---|---|---|
| `pages` | `pageSlice.ts` | Page list, active page, **and all block data + block operations**. Includes `hydrate` and `insertAIBlocks`. |
| `editor` | `editorSlice.ts` | Transient editor state — only `focusedBlockId` |
| `ui` | `uiSlice.ts` | Slash menu state, `aiLoading`, sidebar collapse |

Two circular-dependency traps have already been hit and fixed here — don't reintroduce them:

1. **`RootState` derives from `rootReducer`, not `typeof store.getState`.** The persistence middleware is typed `Middleware<unknown, RootState>` and is wired into the store; deriving `RootState` from the store closes a *type* cycle that collapses `RootState` to `any` inside the middleware.
2. **`createAppAsyncThunk` lives in `store/appThunk.ts`, not `store/index.ts`.** `index.ts → uiSlice → aiThunks → index.ts` is a *runtime* cycle (`ReferenceError: Cannot access 'uiReducer' before initialization`), because `uiSlice`'s `extraReducers` import the thunk, which imported the helper back from `index.ts`. `appThunk.ts` is a leaf module that only `import type`s back — and types erase at runtime, so the cycle breaks.

> **General rule:** shared helpers belong in leaf modules that import nothing back. The composition root (`store/index.ts`) is the worst place for them, because everything already points at it.

Always use the typed hooks from `src/store/hooks.ts` (`useAppDispatch`/`useAppSelector`), never raw `useDispatch`/`useSelector`.

### Data Model

`Block` and `Page` are defined in `src/types/index.ts` (browser-only). `BlockType`, `BlockProperties`, and `BlockIntent` live in `shared/types.ts` because the server needs them.

- **`Block`** — a live entity in the store: `id` (nanoid), `type`, `content`, optional `properties`, `createdAt`.
- **`BlockIntent`** — a *description* of a block: just `{ type, content }`. **No id, no timestamps.** This is the shape that crosses the network.

The distinction is deliberate and load-bearing: **the server returns intents; only the browser mints Blocks** — always via `createBlock()` in `BlockEngine.ts`, which stamps `defaultPropertiesFor(type)`. There is no second path for creating a block. A blank page is likewise constructed in exactly one place: `createBlankPage()` in `PageEngine.ts`.

### Persistence (Phase 5)

`StorageService.ts` wraps IndexedDB via `idb`. Wired to Redux through `persistenceMiddleware.ts`:

- **Load:** a module-scope bootstrap promise in `main.tsx` runs once (immune to StrictMode double-invoke), reconciles the saved page id, and dispatches a single atomic `hydrate({ list, activePageId })`. Render is gated behind it.
- **Save (content):** middleware compares `pages.list` **by reference** (Immer gives a new ref only on a real mutation) and calls a 500ms-debounced `saveAll`.
- **Save (active page):** immediate `setLastActivePageId` on change.
- **Flush on hide:** `visibilitychange` + `pagehide` flush the pending save. Best-effort — IndexedDB writes are async and may lose the race against teardown.

Never call `StorageService` directly from components or reducers.

## AI Integration (Phase 6 — complete)

Typing `/ai <topic>` + Enter in any block inserts validated AI-generated blocks after it.

### The request chain

```
TextBlock (Enter handler)        provider: "gemini"  ← the ONLY hardcoded provider choice
  → generateAIBlocks (thunk)     aiLoading flips via pending / fulfilled / rejected
    → AIClient.generateBlocks    browser: POST { prompt, provider }
      ══════════════ network ══════════════
      → api/generate.ts          validates input; 400 on bad request
        → getProvider(name)      factory: name → concrete provider
          → AIService.generateBlocks   retry loop (3 attempts, linear backoff)
            → GeminiProvider     raw fetch to Gemini; JSON mode + responseSchema
            → validateBlocks     untrusted JSON → BlockIntent[] (or throw)
      ◄────── { blocks } or { error } ──────
  → createBlock() per intent → insertAIBlocks
```

**Contract:** request `{ prompt: string, provider: ProviderName }` → response `{ blocks: BlockIntent[] }` or `{ error: string }`. Both ends must stay in lockstep.

> Note there are **two** functions named `generateBlocks` — one in `src/services/AIClient.ts` (browser; makes the HTTP call) and one in `server/AIService.ts` (server; runs the pipeline). They are on opposite sides of the network and do *not* call each other directly.

### Key design decisions

- **Serverless proxy over a browser-side key.** Notes stay local; only the prompt crosses the wire. The key never ships to the client.
- **Provider-agnostic by construction.** `LLMProvider` is the interface, `GeminiProvider` the only implementation, `getProvider` the factory. The thunk, client, and endpoint all speak `ProviderName` — **nothing between the component and the factory knows Gemini exists.** Adding a provider touches exactly two places, both marked `@NOTE` (`shared/providers.ts` and `getProvider.ts`).
- **`PROVIDER_NAMES` is one source of truth.** The `as const` array generates both the compile-time `ProviderName` union *and* the runtime `isProviderName()` guard, so the two can never drift.
- **LLM output is untrusted input.** `validateBlocks` takes `unknown`, narrows via `Record<string, unknown>`, checks every field, and **constructs fresh objects from verified fields only** — it never passes the model's raw object through. Policy is **reject-all**: one malformed block invalidates the whole batch (which the retry loop then rerolls). An empty array is also a failure.
- **Structured output does the structural work; the prompt does the judgment.** Gemini's `responseSchema` makes an invalid `type` nearly impossible. `SYSTEM_PROMPT` handles what a schema can't express — which block type suits which content, block count, leading with a heading. **When output quality is off, tune the prompt, not the schema.**
- **Errors throw; they don't return `null`.** Every layer (`GeminiProvider`, `validateBlocks`, `AIService`, `AIClient`) throws on failure. This is precisely why the retry loop needs only a *single* `catch` for network, HTTP, parse, and validation failures alike.
- **`unknown` at every boundary.** Gemini's response, the request body, caught errors — all enter as `unknown` and must be proven before use. `any` would disable the checks that make these boundaries safe.
- **Toasts are a view concern.** The thunk's `rejected` case only flips `aiLoading` off. The **component** dispatches with `.unwrap()`, catches the rejection, and calls `toast.error`. **Redux never imports Toastify.**

### Gotchas that have already bitten

- **`.unwrap()` without `await` catches nothing.** A dispatched thunk returns a promise; without `await`, the `try` block exits before it rejects, and the rejection surfaces as an unhandled console error instead of reaching your `catch`. The handler must be `async`.
- **Call `e.preventDefault()` before the first `await`** in async event handlers.
- **Reducers must stay pure.** `createBlock` uses `nanoid()` and `Date.now()` — both impure — so blocks are minted in the **thunk** and the finished `Block[]` is dispatched into `insertAIBlocks`.
- **Optimistic clear.** The `/ai …` text is cleared *before* awaiting the thunk, so the UI responds instantly rather than appearing frozen for the duration of generation.
- **Never log the API key.** It has been leaked twice (a raw `console.log`, and a screenshot of `.env.local`) and rotated both times. Log presence (`key ? "yes" : "no"`), never the value.

### Failure modes (all handled)

| Failure | Caught by | User sees |
|---|---|---|
| Malformed JSON body | `api/generate.ts` (parse guard) | 400 → toast |
| Missing/empty prompt, unknown provider | `api/generate.ts` (input guards) | 400 → toast |
| Missing API key | `getProvider` | throws → 502 → toast |
| Gemini 4xx/5xx (503 overload, 429 quota) | `GeminiProvider` | retried 3×, then 502 → toast |
| Malformed or empty JSON from the model | `validateBlocks` | retried 3×, then 502 → toast |

Server-side errors are `console.error`'d in full (visible in the `vercel dev` terminal), but the client only ever receives a generic message — internal detail is never leaked to the browser.

## TypeScript Configuration

Strict mode with `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, and `verbatimModuleSyntax` (so type-only imports **must** use `import type`). `any` is effectively banned — use `unknown` and narrow. All IDs come from `nanoid`, never `crypto.randomUUID`.

## Implementation Phases

Phases 1–6 are complete: foundation, core editing, slash commands, sidebar/pages, persistence, **AI integration**. Full roadmap in `docs/KIROKU_PROJECT_INSTRUCTIONS.md`.

- **Phase 7 (next):** Drag-and-drop block reordering (`moveBlock` already exists in `pageSlice`)
- **Phase 8:** Markdown export
- **Phase 9:** Polish — `React.memo`, paste handler, edge cases
- **Phase 10:** Testing + deployment

### Deliberately deferred (with reasons)

These were considered and scoped out. They are decisions, not oversights:

- **Streaming responses.** Would require replacing parse-then-validate with incremental JSON parsing and rebuilding the response path around SSE. A loading indicator solves perceived latency at a fraction of the cost and risk.
- **Concurrent AI generations.** One at a time, gated on the global `aiLoading` flag. Concurrency would raise insertion-ordering and rate-limit questions for an interaction users rarely want. Revisiting it means moving to a per-block loading model.
- **A provider picker UI.** The plumbing is already provider-agnostic; only the component's hardcoded `"gemini"` would change. Pointless while `PROVIDER_NAMES` has one entry.
- **Zod for request validation.** Hand-rolled guards are ~6 lines and zero dependencies. Zod is the natural upgrade when the request schema grows (noted in `api/generate.ts`).
- **Exponential backoff + jitter.** Backoff is currently linear (`attempt * 500ms`). Fine for solo usage; the real pattern is worth adopting under actual traffic.
- **Vercel AI Gateway.** Evaluated as the managed alternative to the hand-built provider layer. Because `AIService` depends on the `LLMProvider` interface rather than a concrete provider, a `GatewayProvider` could be swapped in without touching anything else.

## Notes for making changes

- **Block components are one unified `TextBlock.tsx`** (routed by `Block.tsx`). `divider` renders as an `<hr>` in `Block.tsx`.
- **Slash parsing** lives in `SlashParser.ts`: `parseSlashInput(content)` → `{ query, isAIPrompt }`, and `filterCommands(query)`. The `/ai` trigger uses `parseSlashInput`; the slash *menu* uses `filterCommands`.
- **Typing a space closes the slash menu**, which is why `/ai some topic` reaches the plain Enter handler rather than the menu's Enter handler.
- **Assets in `public/`** are served from the root path (`/orange-cat.png`) — no import needed.