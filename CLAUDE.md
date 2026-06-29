# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kiroku** (記録 — "record") is a local-first, block-based note editor inspired by Notion. It is a single-page React app that runs entirely in the browser with no backend — all data is persisted in IndexedDB.

## Commands

```bash
npm run dev       # Start Vite dev server (default: http://localhost:5173)
npm run build     # Type-check (tsc -b) then bundle with Vite
npm run preview   # Preview the production build locally
npm run lint      # Run ESLint across all files
```

There are no tests yet (planned for Phase 10). When tests are added, the runner will be specified in `package.json`.

## Architecture

Kiroku follows a strict 5-layer architecture — each layer must only call the layer below it:

```
UI Components (React)         ← src/App.tsx, src/components/, src/hooks/, src/main.tsx (bootstrap)
     ↓
State (Redux Toolkit)         ← src/store/ (slices + persistence middleware)
     ↓
Business Logic (Services)     ← src/services/ (BlockEngine, PageEngine, SlashParser)
     ↓
Persistence (IndexedDB)       ← src/services/StorageService.ts via idb
     ↓
External APIs (Claude AI)     ← Phase 6+
```

### State Management

Three Redux slices in `src/store/`:

| Slice | File | Responsibility |
|---|---|---|
| `pages` | `pageSlice.ts` | Page list, active page tracking, **and all block data + block operations** (blocks are nested inside each page). Includes the `hydrate` action used to load persisted state on boot. |
| `editor` | `editorSlice.ts` | Transient editor state — currently only `focusedBlockId`, used for imperative focus handoff between blocks |
| `ui` | `uiSlice.ts` | Transient UI state (slash menu, AI loading, sidebar collapse) |

The store (`src/store/index.ts`) builds its root reducer with `combineReducers` and derives `RootState` from **the reducer**, not from `typeof store.getState`. This matters: the persistence middleware is typed `Middleware<unknown, RootState>` and is wired into the store, so deriving `RootState` from the store would create a circular type reference (store → middleware type → RootState → store) that collapses `RootState` to `any`. Deriving from `rootReducer` breaks the cycle.

> **Important:** block data lives in `pageSlice`, not `editorSlice`. Blocks are nested inside their page, so the block reducers (`addBlock`, `updateBlock`, `deleteBlock`, `moveBlock`, `insertAIBlocks`) operate on the active page's `blocks[]`. `editorSlice` holds only transient, non-persisted editor state. This keeps a single source of truth for all persistent data and avoids cross-slice synchronization.

Always use the typed hooks from `src/store/hooks.ts` — `useAppDispatch` and `useAppSelector` — never the raw `useDispatch`/`useSelector`.

### Data Model

Defined in `src/types/index.ts`:

- **`Page`** — Top-level unit with `id` (nanoid), `title`, `icon` (single emoji), `blocks[]`, timestamps
- **`Block`** — Atomic content unit with `id` (nanoid), `type: BlockType`, `content`, optional `properties: BlockProperties`
- **`BlockType`** — `"paragraph" | "heading_1" | "heading_2" | "heading_3" | "code" | "quote" | "todo" | "divider"`

A blank page is constructed in exactly one place: `createBlankPage()` in `src/services/PageEngine.ts`. The `createPage` reducer and the boot-time seed both call it — do not assemble a `Page` object inline anywhere else.

### Persistence (Phase 5 — complete)

`StorageService.ts` (in `src/services/`) wraps IndexedDB using the `idb` library. It exposes four async functions:

- `saveAll(pages)` / `loadAll()` — full page list serialization (the `pages` object store)
- `getLastActivePageId()` / `setLastActivePageId(id)` — remembers which page was open (the `meta` object store)

IndexedDB is not available in SSR or some test environments — `StorageService` degrades gracefully (returns empty data, logs errors without throwing).

The storage layer is wired to Redux through `src/store/persistenceMiddleware.ts`:

- **Load:** a module-scope bootstrap promise in `main.tsx` runs once (immune to StrictMode double-invoke), reads `loadAll()` + `getLastActivePageId()`, reconciles the saved id against the loaded list (falling back to the first page, or seeding a blank page via `createBlankPage()` when storage is empty), and dispatches a single atomic `hydrate({ list, activePageId })`. Render is gated behind this.
- **Save (content):** the middleware compares `pages.list` by reference before/after each action (Immer gives a new reference only on a real mutation) and, on change, calls a 500ms-debounced `saveAll`. Navigation actions don't touch `list`, so they trigger no content write.
- **Save (active page):** the middleware compares `activePageId` before/after and writes `setLastActivePageId` immediately on change.
- **Flush on hide:** `visibilitychange` (on `document`, guarded for `hidden`) and `pagehide` (on `window`) flush the pending debounced save. This is **best-effort** — `saveAll` is async and the browser may tear the page down before an IndexedDB write commits. Durability comes from the debounce; the flush is a backstop. The debounce utility lives in `src/utils/debounce.ts` (generic, trailing-edge, with `flush()`/`cancel()`).

## TypeScript Configuration

Strict mode is on with additional checks: `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`. The `any` type is effectively banned. All IDs are generated with `nanoid`, not `crypto.randomUUID`.

## Implementation Phases

The full roadmap is in `docs/KIROKU_PROJECT_INSTRUCTIONS.md`. Phases 1–5 are complete: foundation, core editing, slash commands, sidebar/page management, and persistence. The active phase is **Phase 6: AI Integration** — Claude API for AI block generation.

Notes for making changes:
- **Block components are one unified `TextBlock.tsx`** (routed by `Block.tsx`), not per-type files. Paragraph, headings, and quote get distinct styling via a `TYPE_CLASSNAMES` map; todo and code currently route there too and render as plain text (dedicated components deferred). `divider` renders as an `<hr>` directly in `Block.tsx`.
- **Slash command parsing** lives in `src/services/SlashParser.ts` — the public surface is `parseSlashInput(content)` and `filterCommands(query)`, plus the `SlashCommand` interface and `SLASH_COMMANDS` list. (There is no `parseSlashCommand`.)
- **Persistence is middleware-driven.** Don't call `StorageService` directly from components or reducers — content saves flow through `persistenceMiddleware`; loads flow through the `main.tsx` bootstrap → `hydrate`.
- **Phase 6:** Claude API integration for AI block generation
- **Phase 7:** Drag-and-drop block reordering
```