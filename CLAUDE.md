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
UI Components (React)         ← src/App.tsx, src/components/, src/hooks/
     ↓
State (Redux Toolkit)         ← src/store/
     ↓
Business Logic (Services)     ← src/services/
     ↓
Persistence (IndexedDB)       ← src/services/StorageService.ts via idb
     ↓
External APIs (Claude AI)     ← Phase 6+
```

### State Management

Three Redux slices in `src/store/`:

| Slice | File | Responsibility |
|---|---|---|
| `pages` | `pageSlice.ts` | Page list, active page tracking, **and all block data + block operations** (blocks are nested inside each page) |
| `editor` | `editorSlice.ts` | Transient editor state — currently only `focusedBlockId`, used for imperative focus handoff between blocks |
| `ui` | `uiSlice.ts` | Transient UI state (slash menu, AI loading, sidebar collapse) |

> **Important:** block data lives in `pageSlice`, not `editorSlice`. Blocks are nested inside their page, so the block reducers (`addBlock`, `updateBlock`, `deleteBlock`, `moveBlock`, `insertAIBlocks`) operate on the active page's `blocks[]`. `editorSlice` holds only transient, non-persisted editor state. This keeps a single source of truth for all persistent data and avoids cross-slice synchronization.

Always use the typed hooks from `src/store/hooks.ts` — `useAppDispatch` and `useAppSelector` — never the raw `useDispatch`/`useSelector`.

### Data Model

Defined in `src/types/index.ts`:

- **`Page`** — Top-level unit with `id` (nanoid), `title`, `icon` (single emoji), `blocks[]`, timestamps
- **`Block`** — Atomic content unit with `id` (nanoid), `type: BlockType`, `content`, optional `properties: BlockProperties`
- **`BlockType`** — `"paragraph" | "heading_1" | "heading_2" | "heading_3" | "code" | "quote" | "todo" | "divider"`

### Persistence

`StorageService.ts` (in `src/services/`) wraps IndexedDB using the `idb` library. It exposes four async functions:

- `saveAll(pages)` / `loadAll()` — full page list serialization
- `getLastActivePageId()` / `setLastActivePageId(id)` — remembers which page was open

IndexedDB is not available in SSR or some test environments — `StorageService` degrades gracefully (returns empty data, logs errors without throwing). It exists and works, but is **not yet wired to the store** — that wiring is Phase 5.

## TypeScript Configuration

Strict mode is on with additional checks: `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`. The `any` type is effectively banned. All IDs are generated with `nanoid`, not `crypto.randomUUID`.

## Implementation Phases

The full roadmap is in `docs/KIROKU_PROJECT_INSTRUCTIONS.md`. Phases 1–4 are complete: foundation, core editing, slash commands, and sidebar/page management. The active phase is **Phase 5: Persistence** — wiring Redux state changes to `StorageService` via middleware.

Notes for making changes:
- **Block components are one unified `TextBlock.tsx`** (routed by `Block.tsx`), not per-type files. Paragraph, headings, and quote get distinct styling via a `TYPE_CLASSNAMES` map; todo and code currently route there too and render as plain text (dedicated components deferred). `divider` renders as an `<hr>` directly in `Block.tsx`.
- **Slash command parsing** lives in `src/services/SlashParser.ts` — the public surface is `parseSlashInput(content)` and `filterCommands(query)`, plus the `SlashCommand` interface and `SLASH_COMMANDS` list. (There is no `parseSlashCommand`.)
- **Phase 6:** Claude API integration for AI block generation
- **Phase 7:** Drag-and-drop block reordering