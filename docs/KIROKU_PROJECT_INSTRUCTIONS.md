# Kiroku — Block-Based Note Editor
## Complete Project Implementation Guide

---

## Project Overview

**Kiroku** (記録 — Japanese for "record") is a local-first, block-based note editor inspired by Notion. It's a single-page React application that runs entirely in the browser with no backend, storing data in IndexedDB. The editor supports multiple pages, various block types, AI-powered content generation via Claude API, and Markdown export.

### What You'll Build

A production-ready note-taking application featuring:
- Multi-page document management with sidebar navigation
- Block-based editor supporting 8 block types (paragraphs, headings, code, todos, quotes, dividers)
- Slash command menu for quick block insertion
- AI content generation powered by Claude API
- Drag-and-drop block reordering
- Markdown export functionality
- Local-first architecture with IndexedDB persistence
- Keyboard-first navigation with full accessibility

### Why This Project Matters

This project demonstrates **product engineering skills** that product-based companies value:
- **State management** at scale (Redux Toolkit with middleware)
- **Local-first architecture** (IndexedDB, offline-first design)
- **Type-safe development** (TypeScript strict mode throughout)
- **AI integration** (Claude API with structured output parsing)
- **UX engineering** (keyboard navigation, contenteditable handling, drag-and-drop)
- **System design thinking** (layered architecture, separation of concerns)

---

## Tech Stack

### Core Technologies
- **React 19** — UI framework with hooks
- **TypeScript** (strict mode) — Full type safety across the codebase
- **Redux Toolkit** — State management with slices and middleware
- **Tailwind CSS 4** — Styling
- **IndexedDB** (via `idb` library) — Client-side persistence
- **Vite** — Build tool and dev server

### Supporting Libraries
- **nanoid** — Unique ID generation for pages and blocks
- **@dnd-kit/core** — Drag-and-drop functionality for block reordering (Phase 7)
- **Anthropic SDK / Claude API** — AI integration (Phase 6)

### Development Tools
- **ESLint** + **Prettier** — Code quality and formatting
- **Vitest** — Unit testing framework (Phase 10)
- **TypeScript strict mode** — `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`; `any` effectively banned

---

## System Architecture

Kiroku follows a **layered architecture** with clear separation of concerns. Each layer only calls the layer below it:

```
┌─────────────────────────────────────────┐
│  Layer 1: UI Components (React)         │  ← What users see
├─────────────────────────────────────────┤
│  Layer 2: State Management (Redux)      │  ← In-memory truth
├─────────────────────────────────────────┤
│  Layer 3: Business Logic (Services)     │  ← Pure functions
├─────────────────────────────────────────┤
│  Layer 4: Persistence (IndexedDB)       │  ← Durable storage
├─────────────────────────────────────────┤
│  Layer 5: External API (Claude)         │  ← AI generation
└─────────────────────────────────────────┘
```

### Layer 1: UI Components
**Location:** `src/components/` and `src/hooks/`

- **App.tsx** — Root layout (header, sidebar, editor regions)
- **Sidebar.tsx** — Page list + "New Page" button; subscribes to page IDs only (via `selectPageIds` + `shallowEqual`) so it never re-renders on block edits
- **PageListItem.tsx** — A single page row: select-to-activate, active highlight, and a two-click delete confirm (local state + timer, no Redux)
- **PageTitle.tsx** — Editable page title as a controlled `<input>` — the single source of truth for the title, dispatching `renamePage`
- **EditorCanvas.tsx** — Main editing surface: renders the icon + `PageTitle`, the block list, the empty-state CTA, and auto-focuses a blank new page
- **Block.tsx** — Block type router (a `switch` on `block.type`)
- **blocks/TextBlock.tsx** — One unified component for **all text-bearing block types** (paragraph, heading_1/2/3, quote, todo, code). Styling is selected via a `TYPE_CLASSNAMES` map. `divider` is rendered as an `<hr>` directly in `Block.tsx`. (Dedicated `TodoBlock`/`CodeBlock` are deferred — todo and code currently render as plain text.)
- **SlashMenu.tsx** — Command palette for block insertion/transformation
- **hooks/useBlockFocus.ts** — Imperatively focuses a block when it becomes the `focusedBlockId`, then clears the signal
- **hooks/useSlashConfirm.ts** — Encapsulates the transform-vs-insert logic when a slash command is confirmed

> **Note on block components:** the original plan called for per-type files (`ParagraphBlock`, `HeadingBlock`, etc.). In implementation these were consolidated into a single `TextBlock` because the text-bearing types differ only in styling, not behavior — one component with a class map is far less duplication. `TodoBlock` and `CodeBlock` remain candidates for extraction once they need genuinely different interaction (checkbox, syntax highlighting).

### Layer 2: State Management
**Location:** `src/store/`

- **pageSlice.ts** — The persistent data slice. Owns the pages array, `activePageId`, **and all block data + block operations** (blocks are nested inside each page).
  - Page actions: `createPage`, `deletePage`, `renamePage`, `setActivePage`, `setPageIcon`
  - Block actions: `addBlock`, `updateBlock`, `deleteBlock`, `moveBlock`, `insertAIBlocks`
  - Selectors: `selectActivePageBlocks`, `selectPageIds`
- **editorSlice.ts** — Transient editor state only. Currently just `focusedBlockId`.
  - Actions: `setFocusedBlockId`, `clearFocusedBlockId`
- **uiSlice.ts** — Transient UI state (never persisted)
  - State: `slashMenuOpen`, `slashMenuPosition`, `slashMenuBlockId`, `slashMenuMode`, `slashMenuStartIndex`, `slashSelectedIndex`, `slashConfirmRequest`, `aiLoading`, `sidebarCollapsed`
  - Actions: `openSlashMenu`, `closeSlashMenu`, `setSlashSelectedIndex`, `requestSlashConfirm`, `clearSlashConfirmRequest`, `setAILoading`, `toggleSidebar`
- **hooks.ts** — Typed `useAppDispatch` / `useAppSelector`
- **index.ts** — Store configuration (persistence middleware lands in Phase 5)

> **Key decision — block data lives in `pageSlice`, not `editorSlice`.** Blocks are nested inside their page, so there is exactly one home for persistent data. `editorSlice` holds only transient, non-persisted editor state (focus). This eliminates the cross-slice synchronization that would otherwise be needed to keep a separate block store in step with the page that owns those blocks. The original plan put block CRUD in `editorSlice`; the single-source-of-truth version replaced it.

### Layer 3: Business Logic
**Location:** `src/services/`

- **BlockEngine.ts** — Block factory and utilities
  - `createBlock(type, content?, properties?): Block`
  - `defaultPropertiesFor(type): BlockProperties | undefined` (e.g. `{ checked: false }` for todo, `{ language: "plaintext" }` for code)
- **SlashParser.ts** — Command parsing and filtering
  - `parseSlashInput(content): { query: string; isAIPrompt: boolean } | null` — detects an active slash session, including the `/ai ` prefix reserved for Phase 6
  - `filterCommands(query): SlashCommand[]` — case-insensitive match over command labels and aliases
  - `SLASH_COMMANDS: SlashCommand[]` and the `SlashCommand` interface (`id`, `label`, `blockType`, `aliases`, `description`)
- **AIService.ts** *(Phase 6 — not yet built)* — Claude API integration
  - `generateBlocks(prompt): Promise<Block[]>`
- **ExportService.ts** *(Phase 8 — not yet built)* — Markdown conversion
  - `exportToMarkdown(blocks): string`

> **Note on the SlashParser API:** earlier docs referenced `parseSlashCommand(input): SlashResult`. The implemented surface is `parseSlashInput` + `filterCommands`; there is no `parseSlashCommand` or `SlashResult` type.

### Layer 4: Persistence
**Location:** `src/services/StorageService.ts`

- **StorageService.ts** — IndexedDB wrapper (via `idb`). Already implemented and working; wired to the store in Phase 5.
  - `loadAll(): Promise<Page[]>`
  - `saveAll(pages): Promise<void>`
  - `getLastActivePageId(): Promise<string | null>`
  - `setLastActivePageId(id): Promise<void>`
  - Uses a `STORAGE_KEYS` constants object and a `getDB()` helper; degrades gracefully on read failure (returns empty), throws on write failure with a `cause`.
- **Persistence middleware** *(Phase 5 — not yet built)* — Redux middleware for debounced auto-save

> **Note on location:** the original plan placed storage in `src/storage/`. The implemented `StorageService` lives in `src/services/` alongside the other pure-function services. (An empty `src/storage/` directory may still exist — it's unused.)

### Layer 5: External Integration
- **Claude API** — `POST https://api.anthropic.com/v1/messages`
  - Called only from `AIService` (Phase 6)
  - System prompt includes the Block schema
  - Returns a validated JSON array of blocks

---

## Data Model

**Source of truth:** `src/types/index.ts`

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

> The properties interface is named **`BlockProperties`** (earlier docs called it `BlockProps`).

### Design Decisions
- **Blocks as array, not linked list** — Simpler reordering with array splice
- **Blocks nested in Page** — No foreign keys needed for a local-only app, and it keeps all persistent data under one slice
- **`content` always a string** — Syntax highlighting is a rendering concern
- **No nested blocks** — Flat structure keeps the AI prompt simple

---

## Implementation Phases

### Phase 1: Foundation ✅ Complete
**Goal:** Set up project, data structures, and basic Redux store

1. Initialize Vite + React + TypeScript project
2. Set up folder structure following layered architecture
3. Define TypeScript interfaces (`Page`, `Block`, `BlockType`, `BlockProperties`)
4. Create Redux store with slices
5. Implement `StorageService` with `idb` wrapper
6. Create basic App shell

**Deliverable:** App loads, TypeScript compiles, Redux DevTools works

---

### Phase 2: Core Editing ✅ Complete
**Goal:** Build the block editor with keyboard navigation

1. Implement `pageSlice` page actions
2. Implement block CRUD — **landed in `pageSlice`, not a separate `editorSlice`** (single source of truth)
3. Build `EditorCanvas` with contenteditable handling
4. Block components — **unified into a single `TextBlock`** routed by `Block.tsx` (rather than per-type files)
5. Implement `BlockEngine.createBlock()` factory + `defaultPropertiesFor()`
6. Handle Enter (new block) and Backspace (delete empty block)
7. Cursor/focus handling via `editorSlice.focusedBlockId` + the `useBlockFocus` hook

**Deliverable:** Can create pages, type text, create new blocks with Enter

---

### Phase 3: Slash Commands ✅ Complete
**Goal:** Add command palette for block insertion / type switching

1. Implement `SlashParser` — `parseSlashInput()` + `filterCommands()`
2. Create `SlashMenu` with keyboard navigation
3. Add slash-menu state to `uiSlice`
4. Cursor-position tracking for menu placement (with an element-rect fallback for empty blocks)
5. Filtering as the user types after `/`
6. Connect selections to block transform (empty block) vs. insert (non-empty block)

**Implementation notes:** `SlashMenu` and `TextBlock` are sibling components without shared refs, so a mouse-click confirmation is coordinated through a `slashConfirmRequest` Redux signal that `TextBlock` watches. Close conditions: Space, Escape, Backspace past the `/`, click-outside, and Confirm/Enter (only Confirm cleans up the block text).

**Deliverable:** Typing `/` opens the menu; selecting transforms or inserts a block

---

### Phase 4: Sidebar & Pages ✅ Complete
**Goal:** Multi-page document management

1. Build `Sidebar` showing the page list
2. Page switching (`setActivePage`)
3. "New Page" button (`createPage`)
4. Page rename — a controlled `<input>` in `PageTitle` as the single source of truth
5. Emoji picker for page icons — **deferred**; pages use the default `📄` icon (`setPageIcon` reducer exists, unwired)
6. Page deletion with a lightweight two-click confirm (local state + auto-disarm timer)
7. Last-page deletion — **shows an empty-state CTA rather than auto-creating a page** (an empty workspace is a first-class state; we don't fabricate pages the user didn't ask for)

**Implementation notes:** the page-management reducers already existed from earlier work, so this phase was almost entirely UI wiring. The sidebar avoids re-rendering on every keystroke by subscribing to page IDs (`selectPageIds` + `shallowEqual`) while each `PageListItem` subscribes to its own `title`/active flag as primitives. The bootstrap "create a page on mount" effect was removed — the empty state now handles first launch (default-page seeding moves to Phase 5 hydration).

**Deliverable:** Create multiple pages, switch between them, rename and delete

---

### Phase 5: Persistence 🔄 Active (Next)
**Goal:** Auto-save to IndexedDB

1. Implement persistence middleware listening to Redux actions
2. Debounce writes (500ms) to avoid excessive IndexedDB churn
3. Use the existing `StorageService.saveAll()` / `loadAll()`
4. App bootstrap: hydrate Redux from IndexedDB on load; if storage is empty, seed one default page
5. Store `lastActivePageId` in the meta store
6. Handle IndexedDB unavailable (private browsing) gracefully

**Deliverable:** Data persists across browser refresh, auto-saves on edits

---

### Phase 6: AI Integration
**Goal:** Claude API for content generation

1. Set up Anthropic API key management (env variable)
2. Implement `AIService.generateBlocks()` with the API call
3. System prompt including the Block schema
4. JSON parsing and validation with type guards
5. AI loading skeleton block
6. Error handling with retry UI
7. Wire the `/ai` command (already detected by `parseSlashInput`)

**Deliverable:** Typing `/ai [prompt]` generates blocks via Claude

---

### Phase 7: Drag & Drop
**Goal:** Block reordering with mouse

1. Integrate `@dnd-kit/core`
2. Drag handles on blocks (show on hover)
3. Use the existing `moveBlock` action in `pageSlice`
4. Visual feedback during drag (drop zones, ghost preview)
5. Keep keyboard navigation working
6. Test with long documents (50+ blocks)

**Deliverable:** Can drag blocks to reorder them

---

### Phase 8: Export
**Goal:** Markdown export

1. Implement `ExportService.exportToMarkdown()`
2. Map each block type to Markdown:
   - paragraph → plain text
   - heading_1 → `# text`
   - code → triple-backtick fence with language
   - todo → `- [ ]` / `- [x]`
   - quote → `> text`
   - divider → `---`
3. "Export .md" button in the editor header
4. Trigger browser download with a proper filename
5. Copy-to-clipboard option (nice to have)

**Deliverable:** Clicking Export downloads a `.md` file with correct formatting

---

### Phase 9: Polish & Optimization
**Goal:** Performance and UX refinements

1. Wrap block components in `React.memo`
2. Stable keys (always `block.id`)
3. Paste handler (plain text only, no rich HTML)
4. Empty states (no pages, new page placeholder) — partly done in Phase 4
5. Loading indicators for async operations
6. Edge cases (see Optimizations section)
7. Accessibility audit (keyboard nav, ARIA labels)

**Deliverable:** Smooth, responsive editor with no jank

---

### Phase 10: Testing & Deployment
**Goal:** Production readiness

1. Unit tests for services (`BlockEngine`, `SlashParser`, `ExportService`)
2. Integration tests for Redux slices
3. E2E tests for critical flows
4. CI pipeline (GitHub Actions)
5. Deploy to Vercel / Netlify
6. README with setup instructions
7. Demo GIF / video

**Deliverable:** Deployed app with >80% test coverage

---

## Critical Implementation Details

### 1. ContentEditable Handling

**The Challenge:** contenteditable is notoriously difficult. You must manually manage cursor position, prevent default paste behavior, and intercept keyboard events. The key trick Kiroku uses: the contenteditable DOM owns what's on screen while typing; Redux is a shadow copy updated via `onInput`. React never writes content back into the div after mount, which is what keeps the caret from jumping.

**Pattern:**
```typescript
// In TextBlock
const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const newBlock = createBlock('paragraph');
    dispatch(addBlock({ afterId: block.id, block: newBlock })); // addBlock needs a block
    dispatch(setFocusedBlockId(newBlock.id));                    // focus via the signal
  }

  if (e.key === 'Backspace' && block.content === '' && !isOnlyBlock) {
    e.preventDefault();
    dispatch(deleteBlock({ id: block.id }));
    dispatch(setFocusedBlockId(previousBlockId));
  }
};

// Paste handling is planned for Phase 9:
const handlePaste = (e: ClipboardEvent) => {
  e.preventDefault();
  const text = e.clipboardData.getData('text/plain');
  document.execCommand('insertText', false, text);
};
```

> Note `addBlock` takes `{ afterId, block }` — the caller builds the block with `createBlock()`. Focus is handed off through `editorSlice.focusedBlockId`, which `useBlockFocus` consumes and then clears.

### 2. Redux Middleware for Auto-Save (Phase 5)

Persistent data lives entirely in `pageSlice`, so the middleware only needs to watch `pages/` actions — `editor/` and `ui/` are transient and never persisted.

```typescript
// persistenceMiddleware.ts
const persistenceMiddleware: Middleware = store => next => action => {
  const result = next(action);

  if (action.type.startsWith('pages/')) {
    debouncedSave(store.getState().pages.list); // 500ms debounce
  }

  return result;
};

const debouncedSave = debounce(async (pages: Page[]) => {
  await saveAll(pages);
}, 500);
```

### 3. AI Structured Output (Phase 6)

**System Prompt Strategy:**
```typescript
const systemPrompt = `
You are a content generator for a block-based editor.
The user will give you a prompt. Return ONLY a JSON array of blocks.

Block interface:
{
  "type": "paragraph" | "heading_1" | "heading_2" | "heading_3" | "code" | "quote" | "todo" | "divider",
  "content": "string",
  "properties": { "language"?: "string", "checked"?: boolean }
}

Rules:
1. Return ONLY the JSON array — no markdown fences, no explanation.
2. Every block must have a valid type and content.
3. Code blocks must include properties.language.
4. Return 3-8 blocks depending on prompt complexity.
`;
```

**Response Parsing:**
```typescript
export async function generateBlocks(prompt: string): Promise<Block[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6', // verify the latest model string at implementation time
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  const content = data.content[0].text.trim();
  const jsonText = content.replace(/```json\n?|\n?```/g, '');

  let rawBlocks;
  try {
    rawBlocks = JSON.parse(jsonText);
  } catch {
    throw new KirokuAIError('Invalid JSON response from Claude');
  }

  return rawBlocks.map((raw: unknown) => {
    // validate raw.type with a type guard before trusting it
    return {
      id: nanoid(),
      type: raw.type,
      content: raw.content ?? '',
      properties: { ...raw.properties, aiGenerated: true },
      createdAt: Date.now(),
    };
  });
}
```

> **Security caveat:** calling the Anthropic API directly from the browser exposes `VITE_ANTHROPIC_API_KEY` to anyone who opens devtools, and requires the dangerous-direct-browser-access header. For a portfolio/local demo that's acceptable if documented; a real deployment would proxy through a tiny backend. Note the trade-off explicitly — it's a good interview talking point.

### 4. Slash Menu Positioning

**The Challenge:** the menu must appear at the cursor, which moves as the user types — and an *empty* contenteditable has no text-node geometry to measure.

```typescript
const measureCursorPosition = (
  ref: React.RefObject<HTMLDivElement | null>,
): { top: number; left: number } => {
  const selection = window.getSelection();
  if (selection?.rangeCount) {
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (rect.top !== 0 || rect.left !== 0) {
      return { top: rect.bottom, left: rect.left }; // cursor has real geometry
    }
  }
  // Fallback: empty block — measure the element itself
  if (ref.current) {
    const rect = ref.current.getBoundingClientRect();
    return { top: rect.bottom, left: rect.left };
  }
  return { top: 0, left: 0 };
};
```

---

## Testing Strategy

### Unit Tests (Vitest)
**Location:** `src/**/__tests__/`

- **BlockEngine** — `createBlock()` for all types; `defaultPropertiesFor()`
- **SlashParser** — `parseSlashInput()` cases (`/`, `/ai `, mid-word non-trigger) and `filterCommands()` matching
- **ExportService** — Markdown conversion for each block type
- **StorageService** — mock IndexedDB, test the four functions

**Example:**
```typescript
describe('BlockEngine', () => {
  it('creates a code block with default language', () => {
    const block = createBlock('code');
    expect(block.type).toBe('code');
    expect(block.properties?.language).toBe('plaintext');
  });
});
```

### Integration Tests
**Focus:** Redux slice behavior (block operations live in `pageSlice`).

```typescript
describe('pageSlice', () => {
  it('adds a block after a specific block', () => {
    // create a page, add block A, then addBlock({ afterId: A.id, block: C })
    // expect C to land immediately after A in the active page's blocks[]
  });
});
```

### E2E Tests (Playwright or Cypress)
1. Create page → type → refresh → content persists
2. Type `/` → select heading → block transforms
3. Type `/ai prompt` → skeleton → blocks appear
4. Drag block → order changes
5. Export → download → file contains correct Markdown

---

## Optimization Checklist

### Performance
- [ ] Debounce IndexedDB writes (500ms)
- [ ] Wrap block components in `React.memo`
- [x] Sidebar subscribes to page IDs only (`selectPageIds` + `shallowEqual`); rows select their own fields as primitives
- [ ] Use `block.id` as React key (never index) — already followed
- [ ] Virtualize block list for 100+ blocks (react-window)
- [ ] Lazy load AI service (dynamic import)

### UX
- [x] Cursor/focus handoff after Enter/Backspace (`focusedBlockId` + `useBlockFocus`)
- [x] Slash menu positioned at cursor, with empty-block fallback
- [ ] AI skeleton shows within 100ms of prompt submission
- [x] Empty state for no active page (CTA to create)
- [ ] Loading indicators for all async operations
- [ ] Toast notifications for errors

### Edge Cases
- [x] Deleting the last page → empty-state CTA (we don't auto-create)
- [ ] First load seeds one default page (Phase 5 hydration)
- [ ] Paste handler strips rich HTML (Phase 9)
- [ ] Handle IndexedDB unavailable (private browsing)
- [ ] AI JSON parsing failures handled gracefully
- [ ] Network errors show retry button

### Error Handling
- [ ] AI API failure → error block with retry
- [ ] Malformed AI JSON → validate with type guards
- [ ] IndexedDB unavailable → warning banner
- [ ] Network timeout → abort signal with 30s timeout

---

## Environment Setup

```bash
# .env
VITE_ANTHROPIC_API_KEY=your_api_key_here   # only needed for Phase 6+
```

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production bundle
npm run preview   # serve the production build
npm run lint      # ESLint
```

---

## Project Milestones

| Milestone | Description | Status |
|-----------|-------------|--------|
| **M1: Foundation** | Project setup, TypeScript definitions | ✅ Done |
| **M2: Basic Editor** | Single-page editing with blocks | ✅ Done |
| **M3: Slash Commands** | Command palette working | ✅ Done |
| **M4: Multi-page** | Sidebar navigation | ✅ Done |
| **M5: Persistence** | IndexedDB integration | 🔄 Next |
| **M6: AI Generation** | Claude API working | Planned |
| **M7: Drag & Drop** | Block reordering | Planned |
| **M8: Export** | Markdown download | Planned |
| **M9: Polish** | Performance optimizations | Planned |
| **M10: Production** | Tests + deployment | Planned |

---

## Success Metrics

### Technical
- **Type coverage:** 100% (no `any` types)
- **Test coverage:** >80% for services, >60% overall
- **Bundle size:** <500kb gzipped
- **First contentful paint:** <1.5s
- **Time to interactive:** <2s

### User Experience
- **Block edit latency:** <16ms (60fps)
- **AI skeleton show time:** <100ms
- **IndexedDB write debounce:** 500ms
- **Slash menu filter:** <50ms

### Code Quality
- **ESLint errors:** 0
- **TypeScript errors:** 0
- **Prettier formatting:** 100%

---

## Resources

- [Redux Toolkit docs](https://redux-toolkit.js.org/)
- [ContentEditable best practices](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/contentEditable)
- [IndexedDB guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [Anthropic API reference](https://docs.anthropic.com/en/api)

### Similar Projects (for reference)
- Notion (inspiration)
- Obsidian (local-first)
- Tiptap / ProseMirror (editor engines)

---

## Mentorship Notes

As you build this project, focus on:

1. **Architectural thinking** — Why a layered architecture? Why does all persistent data live in one slice? Practice explaining it.
2. **Trade-offs** — IndexedDB vs localStorage; Redux vs Context; one `TextBlock` vs per-type files; empty state vs auto-create. Document your reasoning — the *deviations from the original plan* are your best interview stories.
3. **Debugging skills** — ContentEditable bugs will be frustrating. Learn Chrome DevTools deeply.
4. **Code review mindset** — After each phase, review your own diff as if it were a colleague's PR.
5. **Interview preparation** — This project covers state management, TypeScript, API integration, performance, and accessibility. Practice explaining each.

---

## Final Thoughts

Kiroku is a **portfolio-grade project** that demonstrates production-level React skills. Take each phase at quality-over-speed pace, and keep the docs honest — a reference that lies is worse than no reference. Good luck. 🚀

---

**Document Version:** 1.1
**Last Updated:** 2026-06-27 (reflects code through Phase 4)
**Estimated Completion Time:** 10 weeks (part-time)
**Difficulty:** Intermediate to Advanced