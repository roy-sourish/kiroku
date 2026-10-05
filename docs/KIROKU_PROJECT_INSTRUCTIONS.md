# Kiroku — Block-Based Note Editor
## Complete Project Implementation Guide

---

## Project Overview

**Kiroku** (記録 — Japanese for "record") is a local-first, block-based note editor inspired by Notion. It's a React application that stores all note data in the browser's IndexedDB. A small serverless backend exists for one purpose only: proxying AI generation requests so the API key never reaches the browser. The editor supports multiple pages, eight block types, AI-powered content generation, drag-and-drop reordering, and (next) Markdown export.

### What You'll Build

A production-ready note-taking application featuring:
- Multi-page document management with sidebar navigation
- Block-based editor supporting 8 block types (paragraph, three heading levels, code, todo, quote, divider)
- Slash command menu for quick block insertion and transformation
- AI content generation through a serverless proxy (Gemini today; provider-agnostic by design)
- Drag-and-drop block reordering with mouse, touch, and keyboard
- Markdown export
- Local-first architecture with IndexedDB persistence
- Keyboard-first navigation with accessibility in mind

### Why This Project Matters

This project demonstrates **product engineering skills** that product-based companies value:
- **State management** at scale (Redux Toolkit with middleware and async thunks)
- **Local-first architecture** (IndexedDB, offline-first design)
- **Type-safe development** (TypeScript strict mode throughout, `unknown` at every trust boundary)
- **AI integration** (serverless proxy, structured output, untrusted-output validation, retries)
- **UX engineering** (keyboard navigation, `contentEditable` handling, drag-and-drop)
- **System design thinking** (two runtimes, layered architecture, separation of concerns)

---

## Tech Stack

### Core Technologies
- **React 19** — UI framework with hooks
- **TypeScript** (strict mode) — Full type safety across the codebase
- **Redux Toolkit** — State management with slices, middleware, and async thunks
- **Tailwind CSS 4** — Styling
- **IndexedDB** (via `idb`) — Client-side persistence
- **Vite** — Build tool and dev server
- **Vercel** — Hosting and serverless functions (`api/`)

### Supporting Libraries
- **nanoid** — Unique ID generation for pages and blocks
- **@dnd-kit/react** — Drag-and-drop reordering (Phase 7)
- **react-toastify** — Error notifications
- **Gemini API** — AI generation, called with raw `fetch` from the server (Phase 6)

### Development Tools
- **ESLint** — Code quality
- **Vitest** — Unit testing framework (Phase 10)
- **TypeScript strict mode** — `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`; `any` effectively banned

---

## System Architecture

Kiroku spans **two runtimes**: the browser app and a serverless backend. `shared/` holds the types both agree on.

```
┌─ BROWSER (src/) ────────────────┐        ┌─ SERVER (api/, server/) ───────────┐
│  React → Redux → Services       │  HTTP  │  Route → AIService → LLMProvider   │
│  IndexedDB (all note data)      │ ─────► │  Holds the API key. Calls Gemini.  │
└─────────────────────────────────┘        └────────────────────────────────────┘
             └────────── shared/ (types both sides agree on) ──────────┘
```

Inside the browser, each layer only calls the layer below it:

```
┌─────────────────────────────────────────┐
│  Layer 1: UI Components (React)         │  ← What users see
├─────────────────────────────────────────┤
│  Layer 2: State Management (Redux)      │  ← In-memory truth
├─────────────────────────────────────────┤
│  Layer 3: Business Logic (Services)     │  ← Pure functions + the network client
├─────────────────────────────────────────┤
│  Layer 4: Persistence (IndexedDB)       │  ← Durable storage
├─────────────────────────────────────────┤
│  Layer 5: Network boundary              │  ← POST /api/generate (serverless proxy)
└─────────────────────────────────────────┘
```

### Layer 1: UI Components
**Location:** `src/components/` and `src/hooks/`

- **App.tsx** — Root layout (header, sidebar, editor regions) and the `<ToastContainer />`
- **Sidebar.tsx** — Page list + "New Page" button; subscribes to page IDs only (via `selectPageIds` + `shallowEqual`) so it never re-renders on block edits
- **PageListItem.tsx** — A single page row: select-to-activate, active highlight, and a two-click delete confirm (local state + timer, no Redux)
- **PageTitle.tsx** — Editable page title as a controlled `<input>`, dispatching `renamePage`
- **EditorCanvas.tsx** — Main editing surface: icon + `PageTitle`, the `DragDropProvider` around the block list, the empty-state CTA, the AI loading indicator, and auto-focus for a blank new page
- **SortableBlock.tsx** — Drag-and-drop wrapper around each block: calls `useSortable` and renders the gutter drag handle. Contains all per-block drag code
- **Block.tsx** — Block type router (a `switch` on `block.type`, with a `never` exhaustiveness check)
- **blocks/TextBlock.tsx** — One unified component for all text-bearing block types (paragraph, heading_1/2/3, quote, todo, code), styled via a `TYPE_CLASSNAMES` map. Also hosts the slash-menu keyboard handling and the `/ai` trigger. `divider` renders as an `<hr>` in `Block.tsx`
- **SlashMenu.tsx** — Command palette for block insertion/transformation
- **AILoadingIndicator.tsx** — Animated mascot with rotating phrases during generation
- **hooks/useBlockFocus.ts** — Imperatively focuses a block when it becomes the `focusedBlockId`, then clears the signal
- **hooks/useSlashConfirm.ts** — Encapsulates the transform-vs-insert logic when a slash command is confirmed

> **Note on block components:** the original plan called for per-type files (`ParagraphBlock`, `HeadingBlock`, etc.). These were consolidated into a single `TextBlock` because the text-bearing types differ only in styling, not behaviour. **`todo` and `code` currently render as plain text** — dedicated `TodoBlock` (checkbox) and `CodeBlock` (monospace, language) components are planned for Phase 9. Because dragging lives in `SortableBlock` above the router, new block components inherit drag-and-drop automatically.

### Layer 2: State Management
**Location:** `src/store/`

- **pageSlice.ts** — The persistent data slice. Owns the pages array, `activePageId`, **and all block data + block operations** (blocks are nested inside each page).
  - Page actions: `hydrate`, `createPage`, `deletePage`, `renamePage`, `setActivePage`, `setPageIcon`
  - Block actions: `addBlock`, `updateBlock`, `deleteBlock`, `moveBlock`, `insertAIBlocks`
  - Selectors: `selectActivePageBlocks`, `selectPageIds`
- **editorSlice.ts** — Transient editor state only: `focusedBlockId`.
  - Actions: `setFocusedBlockId`, `clearFocusedBlockId`
- **uiSlice.ts** — Transient UI state (never persisted)
  - State: `slashMenuOpen`, `slashMenuPosition`, `slashMenuBlockId`, `slashMenuMode`, `slashMenuStartIndex`, `slashSelectedIndex`, `slashConfirmRequest`, `aiLoading`, `sidebarCollapsed`
  - Actions: `openSlashMenu`, `closeSlashMenu`, `setSlashSelectedIndex`, `requestSlashConfirm`, `clearSlashConfirmRequest`, `setAILoading`, `toggleSidebar`
  - `aiLoading` is driven by the `generateAIBlocks` thunk lifecycle via `extraReducers`
- **aiThunks.ts** — `generateAIBlocks`: calls the AI client, mints `Block`s from the returned intents, dispatches `insertAIBlocks`
- **appThunk.ts** — `createAppAsyncThunk`, a typed helper kept in a leaf module to avoid a runtime import cycle
- **persistenceMiddleware.ts** — Debounced auto-save to IndexedDB
- **hooks.ts** — Typed `useAppDispatch` / `useAppSelector`
- **index.ts** — Store configuration; `RootState` derives from the root reducer

> **Key decision — block data lives in `pageSlice`, not `editorSlice`.** Blocks are nested inside their page, so there is exactly one home for persistent data. `editorSlice` holds only transient, non-persisted editor state. This eliminates the cross-slice synchronisation a separate block store would need.

> **Key decision — block actions target ids, not positions.** `addBlock({ afterId })`, `insertAIBlocks({ afterId })`, and `moveBlock({ activeId, overId })` all identify blocks by id. Ids stay correct when the list changes; indexes don't.

### Layer 3: Business Logic
**Location:** `src/services/`

- **BlockEngine.ts** — Block factory: `createBlock(type, content?, properties?)` and `defaultPropertiesFor(type)` (`{ checked: false }` for todo, `{ language: "plaintext" }` for code). The **only** place a `Block` is created
- **PageEngine.ts** — `createBlankPage()`, the only place a blank page is constructed
- **SlashParser.ts** — `parseSlashInput(content)` → `{ query, isAIPrompt } | null` (detects `/ai `), `filterCommands(query)`, and the `SLASH_COMMANDS` list
- **AIClient.ts** — `generateBlocks(prompt, provider)`: the browser side of the AI call (`POST /api/generate`)
- **ExportService.ts** *(Phase 8 — not yet built)* — `exportToMarkdown(blocks): string`

### Layer 4: Persistence
**Location:** `src/services/StorageService.ts` + `src/store/persistenceMiddleware.ts`

- **StorageService.ts** — IndexedDB wrapper (via `idb`): `loadAll`, `saveAll`, `getLastActivePageId`, `setLastActivePageId`. Degrades gracefully on read failure (returns empty); throws on write failure with a `cause`
- **persistenceMiddleware.ts** — Compares `pages.list` **by reference** before and after each action (Immer only creates a new reference on a real change) and calls a 500ms-debounced `saveAll`. Saves the active page id immediately. Flushes the pending save on `visibilitychange` / `pagehide` (best-effort)
- **Bootstrap** (`main.tsx`) — A module-scope promise loads pages and the saved page id once, seeds a blank page on empty storage, and dispatches a single atomic `hydrate`. Rendering waits for it

### Layer 5: Network Boundary and Server
**Locations:** `api/`, `server/`, `shared/`

- **api/generate.ts** — The only AI endpoint. Validates the request body (400 on bad input), picks a provider through the factory, runs the pipeline, returns `{ blocks }` or `{ error }` (502 on failure; details are logged server-side only)
- **server/AIService.ts** — `SYSTEM_PROMPT`, `BLOCK_ARRAY_SCHEMA`, and `generateBlocks(prompt, provider)` with a 3-attempt retry loop and linear backoff
- **server/llm/LLMProvider.ts** — Vendor-neutral provider interface
- **server/llm/GeminiProvider.ts** — Raw `fetch` to Gemini with JSON mode + response schema
- **server/llm/getProvider.ts** — Factory from `ProviderName` to a provider; reads the API key from the server environment
- **server/llm/blockValidator.ts** — `validateBlocks(unknown): BlockIntent[]`, rejecting the whole batch on any malformed block
- **shared/types.ts** — `BlockType`, `BlockProperties`, `BlockIntent`
- **shared/providers.ts** — `PROVIDER_NAMES`, the derived `ProviderName` type, and the `isProviderName` runtime guard

---

## Data Model

**Sources of truth:** `shared/types.ts` (crosses the network) and `src/types/index.ts` (browser only).

### Page Entity
```typescript
interface Page {
  id: string;           // nanoid() — primary key
  title: string;        // Editable, defaults to "Untitled"
  icon: string;         // Single emoji character (default "📄")
  blocks: Block[];      // Ordered array
  createdAt: number;    // Date.now() timestamp
  updatedAt: number;    // Updated on every block change
}
```

### Block Entity
```typescript
interface Block {
  id: string;                    // nanoid() — React key
  type: BlockType;               // See union below
  content: string;               // Raw text (empty for divider)
  properties?: BlockProperties;  // Optional metadata
  createdAt: number;             // Timestamp
}

type BlockType =
  | 'paragraph'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'code'
  | 'quote'
  | 'todo'
  | 'divider';

interface BlockProperties {
  language?: string;     // Code blocks only
  checked?: boolean;     // Todo blocks only
  aiGenerated?: boolean; // True if created by AI
}
```

### BlockIntent (network shape)
```typescript
interface BlockIntent {
  type: BlockType;
  content: string;
  properties?: BlockProperties;
}
```

A `BlockIntent` is a **description** of a block, with no id and no timestamps. The server returns intents; the browser turns them into real `Block`s through `createBlock()`. There is no other way to create a block.

### Design Decisions
- **Blocks as array, not linked list** — Simpler reordering with array splice
- **Blocks nested in Page** — No foreign keys needed for a local-only app; all persistent data under one slice
- **`content` always a string** — Syntax highlighting is a rendering concern
- **No nested blocks** — Flat structure keeps the AI prompt and drag-and-drop simple

---

## Implementation Phases

### Phase 1: Foundation ✅ Complete
**Goal:** Set up project, data structures, and basic Redux store

1. Initialize Vite + React + TypeScript project
2. Set up folder structure following the layered architecture
3. Define TypeScript interfaces (`Page`, `Block`, `BlockType`, `BlockProperties`)
4. Create Redux store with slices
5. Implement `StorageService` with `idb`
6. Create basic App shell

**Deliverable:** App loads, TypeScript compiles, Redux DevTools works

---

### Phase 2: Core Editing ✅ Complete
**Goal:** Build the block editor with keyboard navigation

1. Implement `pageSlice` page actions
2. Implement block CRUD — **in `pageSlice`**, not a separate `editorSlice` (single source of truth)
3. Build `EditorCanvas` with `contentEditable` handling
4. Block components — **unified into a single `TextBlock`** routed by `Block.tsx`
5. Implement `BlockEngine.createBlock()` + `defaultPropertiesFor()`
6. Handle Enter (new block) and Backspace (delete empty block)
7. Cursor/focus handling via `editorSlice.focusedBlockId` + `useBlockFocus`

**Deliverable:** Can create pages, type text, create new blocks with Enter

---

### Phase 3: Slash Commands ✅ Complete
**Goal:** Command palette for block insertion / type switching

1. `SlashParser` — `parseSlashInput()` + `filterCommands()`
2. `SlashMenu` with keyboard navigation
3. Slash-menu state in `uiSlice`
4. Cursor-position tracking for menu placement (with an element-rect fallback for empty blocks)
5. Filtering as the user types after `/`
6. Transform (empty block) vs. insert (non-empty block preceded by a space)

**Implementation notes:** `SlashMenu` and `TextBlock` are siblings without shared refs, so a mouse-click confirmation is coordinated through a `slashConfirmRequest` Redux signal. Close conditions: Space, Escape, Backspace past the `/`, click-outside, Confirm/Enter, and (since Phase 7) the start of any drag. Only Confirm cleans up the block text.

**Deliverable:** Typing `/` opens the menu; selecting transforms or inserts a block

---

### Phase 4: Sidebar & Pages ✅ Complete
**Goal:** Multi-page document management

1. `Sidebar` showing the page list
2. Page switching (`setActivePage`)
3. "New Page" button (`createPage`)
4. Page rename — a controlled `<input>` in `PageTitle`
5. Emoji picker for page icons — **deferred** (`setPageIcon` exists, unwired)
6. Page deletion with a two-click confirm
7. Last-page deletion shows an empty-state CTA rather than auto-creating a page

**Implementation notes:** the sidebar avoids re-rendering on every keystroke by subscribing to page IDs (`selectPageIds` + `shallowEqual`); each `PageListItem` subscribes to its own fields as primitives.

**Deliverable:** Create multiple pages, switch between them, rename and delete

---

### Phase 5: Persistence ✅ Complete
**Goal:** Auto-save to IndexedDB

1. `hydrate` reducer — one atomic action setting `list` and `activePageId`
2. `createBlankPage()` in `PageEngine` as the single blank-page factory
3. Module-scope bootstrap in `main.tsx` (immune to StrictMode double-invoke); render gated behind it
4. Generic trailing-edge `debounce` utility with `flush()` and `cancel()`
5. Persistence middleware: reference-equality save gating, 500ms debounce, immediate active-page save
6. Flush on `visibilitychange` (document) and `pagehide` (window)

**Implementation notes:** `RootState` must derive from `combineReducers`, not `typeof store.getState` — otherwise a type cycle collapses it to `any` inside the middleware. Flush-on-hide is best-effort: IndexedDB writes are async and can lose the race against page teardown.

**Deliverable:** Data persists across browser refresh, auto-saves on edits

---

### Phase 6: AI Integration ✅ Complete
**Goal:** Generate structured blocks from a prompt

1. Serverless proxy on Vercel (`api/generate.ts`) so the key stays server-side
2. Provider-agnostic layer: `LLMProvider` interface, `GeminiProvider`, `getProvider` factory, `shared/providers.ts`
3. Structured output: Gemini JSON mode + `responseSchema`, plus a `SYSTEM_PROMPT` for judgment
4. `validateBlocks` treating model output as untrusted input (reject-all policy)
5. Retry loop: 3 attempts, linear backoff
6. `generateAIBlocks` async thunk; blocks minted in the thunk (reducers stay pure)
7. `/ai <topic>` trigger with optimistic clearing, toast on failure (`.unwrap()` + `await`), animated loading indicator

**Implementation notes:** a runtime circular import (`index.ts → uiSlice → aiThunks → index.ts`) was fixed by moving `createAppAsyncThunk` to a leaf module. Browser code importing server code (`Cannot find name 'process'`) was fixed by moving shared types to `shared/`. **The model `gemini-2.5-flash` is deprecated by Google** — migrating is a one-constant change in `GeminiProvider.ts`.

**Deliverable:** Typing `/ai [prompt]` generates validated blocks after the trigger block

---

### Phase 7: Drag & Drop ✅ Complete
**Goal:** Block reordering with mouse, touch, and keyboard

1. Reshape `moveBlock` to the intent-shaped `{ activeId, overId }` ("the active block takes the over block's slot")
2. Install `@dnd-kit/react`
3. `SortableBlock` wrapper with a handle-only drag (`handleRef`) in the left gutter, visible on hover or focus
4. `DragDropProvider` in `EditorCanvas`; `onDragEnd` translates the library's positions into `moveBlock`
5. `onDragStart` closes the slash menu
6. Dragging disabled while AI is generating
7. Tested: every direction, Escape, keyboard-only drag, dividers, 50+ blocks with auto-scroll, persistence across reload

**Implementation notes:**
- **Library choice.** The legacy `@dnd-kit/core` + `/sortable` line was the original plan. `@dnd-kit/react` (0.5.x, pre-1.0) was chosen instead because it is the maintained, recommended line. Because `moveBlock` takes ids, the switch required no reducer change; all drag code lives in two files.
- **Optimistic sorting moves the real DOM.** `@dnd-kit/react` reorders DOM nodes during a drag without telling Redux. Without a dispatch on drop, the screen and store disagree (and a reload reverts the order). `onDragEnd` therefore always dispatches.
- **Positions → ids.** The library reports `initialIndex` and `index`, not an "over" block. `overId = blocks[index].id`, read from the store's pre-move order, is exactly the block whose slot is taken. A safety check (`blocks[initialIndex].id === activeId`) refuses the move if the store and library ever disagree.
- **The `+ 1` bug.** The first `moveBlock` inserted at `toIndex + 1` (copied from `addBlock`'s "after" behaviour). It passed the first test because `splice` clamps out-of-range indexes and appends, so moving to the end looked correct. A move to the middle exposed it.
- **Suppressed `mousedown`.** dnd-kit calls `preventDefault()` on `pointerdown`, which suppresses the compatibility `mousedown` the slash menu's click-outside listener relies on. Cleanup was moved to `onDragStart`, which also covers keyboard drags.
- **Prevent + detect.** Dragging is disabled during AI generation (prevention) and the safety check refuses inconsistent drops (detection).

**Known limitations:** caret is not restored after a pointer drop (text is preserved). No `DragOverlay` — it would render a second editable `TextBlock` with the same id.

**Deliverable:** Blocks can be dragged to reorder them; order persists

---

### Phase 8: Export ← Next
**Goal:** Markdown export

1. Implement `ExportService.exportToMarkdown(blocks)` as a pure function
2. Map each block type to Markdown:
   - paragraph → plain text
   - heading_1 / 2 / 3 → `#` / `##` / `###`
   - code → triple-backtick fence with `properties.language`
   - todo → `- [ ]` / `- [x]` from `properties.checked`
   - quote → `> text`
   - divider → `---`
3. "Export .md" button in the editor header
4. Trigger a browser download with a filename derived from the page title
5. Copy-to-clipboard option (nice to have)

**Deliverable:** Clicking Export downloads a `.md` file with correct formatting

---

### Phase 9: Polish & Optimization
**Goal:** Performance and UX refinements

1. Dedicated `TodoBlock` (checkbox toggling `checked`) and `CodeBlock` (monospace, `language`)
2. Keyboard block movement (e.g. Alt+↑/↓) — the component looks up the neighbour's id for `moveBlock`
3. `React.memo` on block rows
4. Paste handler (plain text only, no rich HTML)
5. Caret restoration after a drag (optional)
6. Loading/empty states and edge cases
7. Accessibility audit (keyboard nav, ARIA labels, focus management)

**Deliverable:** Smooth, responsive editor with no jank

---

### Phase 10: Testing & Deployment
**Goal:** Production readiness

1. Unit tests for services (`BlockEngine`, `SlashParser`, `ExportService`, `validateBlocks`, `debounce`)
2. Integration tests for Redux slices and the AI thunk
3. E2E tests for critical flows
4. CI pipeline (GitHub Actions)
5. Deploy to Vercel
6. README and demo GIF / video

**Deliverable:** Deployed app with >80% test coverage on services

---

## Critical Implementation Details

### 1. ContentEditable Handling

**The challenge:** `contentEditable` requires managing the caret, normalising browser quirks, and intercepting keys. Kiroku's key trick: **the DOM owns what's on screen while typing; Redux is a shadow copy updated via `onInput`.** React sets `innerText` once on mount and never writes content back, which keeps the caret from jumping.

```typescript
// Normalise browser quirks in handleInput
const raw = divRef.current?.innerText ?? "";
const normalized = raw === "\n" ? "" : raw.replace(/\u00a0/g, " ");
// empty contenteditable returns "\n"; trailing spaces become non-breaking \u00a0
```

Focus is handed between blocks through `editorSlice.focusedBlockId`, which `useBlockFocus` consumes and then clears. Paste handling (plain text only) is planned for Phase 9.

### 2. Persistence Middleware (Phase 5)

```typescript
export const persistenceMiddleware: Middleware<unknown, RootState> =
  (store) => (next) => (action) => {
    const prevList = store.getState().pages.list;
    const result = next(action);
    const nextList = store.getState().pages.list;

    if (prevList !== nextList) debouncedSave(nextList);  // reference equality
    return result;
  };
```

Reference equality works because Immer returns a new `list` only when something in it actually changed. Transient `editor` and `ui` updates never trigger a save.

### 3. AI Generation Through a Proxy (Phase 6)

**Why a proxy:** any key in browser code (including a `VITE_` variable) is readable by every visitor. The key lives only in Vercel's environment; the browser sends just the prompt.

```
Browser: POST /api/generate { prompt, provider }
Server:  validate input → getProvider(name) → AIService.generateBlocks
         → GeminiProvider (JSON mode + responseSchema) → JSON.parse → validateBlocks
         ← { blocks: BlockIntent[] } or { error }
Browser: intents.map(createBlock) → insertAIBlocks({ blocks, afterId })
```

**Structured output vs. prompt:** the response schema guarantees the shape (an invalid `type` is nearly impossible); `SYSTEM_PROMPT` handles judgment (which type suits which content, block count). Tune the prompt for quality issues, not the schema.

**Untrusted output:** `validateBlocks` takes `unknown`, guards each item, and builds **fresh** objects from verified fields only:

```typescript
if (item === null || typeof item !== "object") throw ...;   // guard first
const candidate = item as Record<string, unknown>;          // then narrow
// check type + content...
blocks.push({ type: candidate.type as BlockType, content: candidate.content });
```

**Failure convention:** every layer throws instead of returning `null`, so the retry loop needs a single `catch` for network, HTTP, parse, and validation failures.

### 4. Drag-and-Drop with Optimistic Sorting (Phase 7)

```typescript
const handleOnDragEnd = (event: DragEndEvent) => {
  if (event.canceled) return;
  const { source } = event.operation;
  if (!isSortable(source)) return;

  const { initialIndex, index } = source;
  if (initialIndex === index) return;

  const activeId = String(source.id);                  // who moved
  if (blocks[initialIndex]?.id !== activeId) return;   // store and library must agree
  const overId = blocks[index]?.id;                    // whose slot it takes (pre-move order)
  if (!overId) return;

  dispatch(moveBlock({ activeId, overId }));
};
```

```typescript
// pageSlice.moveBlock — "take the target's slot"
const blockToMove = blocks[fromIndex];   // read BEFORE removing
if (!blockToMove) return;
blocks.splice(fromIndex, 1);
blocks.splice(toIndex, 0, blockToMove);  // toIndex, NOT toIndex + 1
```

### 5. Slash Menu Positioning

An empty `contentEditable` has no text geometry, so `getBoundingClientRect()` on the selection returns zeros. Fall back to the element's own rect:

```typescript
const rect = selection.getRangeAt(0).getBoundingClientRect();
if (rect.top !== 0 || rect.left !== 0) return { top: rect.bottom, left: rect.left };
const el = ref.current.getBoundingClientRect();         // empty block fallback
return { top: el.bottom, left: el.left };
```

---

## Testing Strategy

### Unit Tests (Vitest)
- **BlockEngine** — `createBlock()` for all types; `defaultPropertiesFor()`
- **SlashParser** — `parseSlashInput()` (`/`, `/ai `, mid-word non-trigger) and `filterCommands()`
- **validateBlocks** — not-an-array, null items, bad `type`, non-string `content`, empty array, extra fields stripped
- **debounce** — trailing fire, `flush`, `cancel`
- **isProviderName** — rejects unknown strings and non-strings
- **ExportService** — Markdown for each block type (Phase 8)

### Integration Tests
- **pageSlice.moveBlock** — down to the end, up to the start, **down by one (middle)**, same-id no-op, unknown-id no-op, `updatedAt` bumped
- **pageSlice.insertAIBlocks** — inserts after `afterId`; appends when null or unknown
- **AIService.generateBlocks** — retries a failing fake `LLMProvider`, rethrows after exhaustion
- **api/generate** — 400 on missing prompt / unknown provider / malformed JSON; 502 on provider failure
- **generateAIBlocks** — `aiLoading` true → false on success and failure

### E2E Tests (Playwright)
1. Create page → type → refresh → content persists
2. Type `/` → select heading → block transforms
3. Type `/ai prompt` → loading indicator → blocks appear after the trigger
4. Drag a block → order changes → survives reload; Escape mid-drag → no change
5. Keyboard drag: Tab to handle → Space → Arrow → Space
6. Export → download → file contains correct Markdown (Phase 8)

---

## Optimization Checklist

### Performance
- [x] Debounce IndexedDB writes (500ms), gated by reference equality
- [x] Sidebar subscribes to page IDs only; rows select primitives
- [x] `block.id` as React key (on `SortableBlock`, the outermost mapped element)
- [ ] `React.memo` on block rows (Phase 9)
- [ ] Virtualize the block list for 100+ blocks
- [ ] Resize the mascot image (1024px source rendered small)

### UX
- [x] Cursor/focus handoff after Enter/Backspace
- [x] Slash menu positioned at the cursor, with empty-block fallback
- [x] Empty state for no active page
- [x] AI loading indicator and toast notifications for errors
- [x] Drag handle visible on hover and on keyboard focus
- [ ] Caret restoration after drag (Phase 9, optional)

### Edge Cases
- [x] Deleting the last page → empty-state CTA
- [x] First load seeds one default page
- [x] AI JSON parsing/validation failures retried, then reported
- [x] Slash menu closes when a drag starts
- [x] No dragging during AI generation
- [ ] Paste handler strips rich HTML (Phase 9)
- [ ] IndexedDB unavailable → warning banner
- [ ] `AIClient` tolerates non-JSON error bodies (e.g. an HTML 404)
- [ ] Network timeout via `AbortController`

---

## Environment Setup

```bash
npm install
npm run dev                      # editor only, http://localhost:5173 (/api not served)

vercel link                      # once
vercel env add GEMINI_API_KEY    # once, Development environment
vercel dev                       # editor + /api, http://localhost:3000

npm run build                    # tsc -b (app, node, server) + vite build
npm run preview
npm run lint
```

**Never** place the API key in a `VITE_` variable or anywhere under `src/`. Restart `vercel dev` after changing environment variables.

---

## Project Milestones

| Milestone | Description | Status |
|-----------|-------------|--------|
| **M1: Foundation** | Project setup, TypeScript definitions | ✅ Done |
| **M2: Basic Editor** | Single-page editing with blocks | ✅ Done |
| **M3: Slash Commands** | Command palette working | ✅ Done |
| **M4: Multi-page** | Sidebar navigation | ✅ Done |
| **M5: Persistence** | IndexedDB integration | ✅ Done |
| **M6: AI Generation** | Proxy + validated generation | ✅ Done |
| **M7: Drag & Drop** | Block reordering | ✅ Done |
| **M8: Export** | Markdown download | 🔄 Next |
| **M9: Polish** | Block components, performance, a11y | Planned |
| **M10: Production** | Tests + deployment | Planned |

---

## Success Metrics

### Technical
- **Type coverage:** 100% (no `any` types)
- **Test coverage:** >80% for services, >60% overall
- **Bundle size:** <500kb gzipped
- **First contentful paint:** <1.5s

### User Experience
- **Block edit latency:** <16ms (60fps)
- **IndexedDB write debounce:** 500ms
- **Slash menu filter:** <50ms
- **Drag:** smooth at 50+ blocks

### Code Quality
- **ESLint errors:** 0
- **TypeScript errors:** 0

---

## Resources

- [Redux Toolkit docs](https://redux-toolkit.js.org/)
- [dnd kit (React)](https://dndkit.com/react/quickstart)
- [Gemini API docs](https://ai.google.dev/gemini-api/docs)
- [Vercel Functions](https://vercel.com/docs/functions)
- [contentEditable on MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/contentEditable)
- [Using IndexedDB on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)

---

## Mentorship Notes

1. **Architectural thinking** — Why two runtimes? Why one slice for persistent data? Why ids instead of positions? Practise explaining each.
2. **Trade-offs** — IndexedDB vs. localStorage; one `TextBlock` vs. per-type files; legacy vs. pre-1.0 dnd-kit; proxy vs. browser key. The *deviations from the original plan* are your best interview stories.
3. **Debugging skills** — Predict before you run; change one variable at a time; don't trust a single passing case.
4. **Code review mindset** — Read your own diff before every commit.
5. **Keep docs honest** — a reference that lies is worse than no reference.

---

**Document Version:** 1.2
**Last Updated:** 2026-10-05 (reflects code through Phase 7)
**Difficulty:** Intermediate to Advanced