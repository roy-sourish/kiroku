# Kiroku — Block-Based Note Editor
## Complete Project Implementation Guide

---

## Project Overview

**Kiroku** (記録 — Japanese for "record") is a local-first, block-based note editor inspired by Notion. It's a single-page React application that runs entirely in the browser with no backend, storing data in IndexedDB. The editor supports multiple pages, various block types, AI-powered content generation via Claude API, and Markdown export.

### What You'll Build

A production-ready note-taking application featuring:
- Multi-page document management with sidebar navigation
- Block-based editor supporting 8+ block types (paragraphs, headings, code, todos, quotes, dividers)
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
- **Type-safe development** (TypeScript throughout)
- **AI integration** (Claude API with structured output parsing)
- **UX engineering** (keyboard navigation, contenteditable handling, drag-and-drop)
- **System design thinking** (layered architecture, separation of concerns)

---

## Tech Stack

### Core Technologies
- **React 18** — UI framework with hooks
- **TypeScript** — Full type safety across the codebase
- **Redux Toolkit** — State management with slices and middleware
- **IndexedDB** (via idb library) — Client-side persistence
- **Vite** — Build tool and dev server

### Supporting Libraries
- **nanoid** — Unique ID generation for pages and blocks
- **@dnd-kit/core** — Drag-and-drop functionality for block reordering
- **Anthropic SDK** — Claude API integration

### Development Tools
- **ESLint** + **Prettier** — Code quality and formatting
- **Vitest** — Unit testing framework
- **TypeScript strict mode** — Maximum type safety

---

## System Architecture

Kiroku follows a **layered architecture** with clear separation of concerns:

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
**Location:** `src/components/`

- **Sidebar.tsx** — Page list, new page button, page switching
- **EditorCanvas.tsx** — Main editor surface, keyboard event handling
- **Block.tsx** — Block type router (switch component)
- **SlashMenu.tsx** — Command palette for block insertion
- **blocks/** — Individual block components:
  - `ParagraphBlock.tsx`
  - `HeadingBlock.tsx` (H1, H2, H3 variants)
  - `CodeBlock.tsx` (with language indicator)
  - `TodoBlock.tsx` (with checkbox)
  - `QuoteBlock.tsx`
  - `DividerBlock.tsx`

### Layer 2: State Management
**Location:** `src/store/`

- **pagesSlice.ts** — Manages pages array and activePageId
  - Actions: `createPage`, `deletePage`, `renamePage`, `setActivePage`, `setPageIcon`
- **editorSlice.ts** — Manages blocks for the active page
  - Actions: `addBlock`, `updateBlock`, `deleteBlock`, `moveBlock`, `insertAIBlocks`
- **uiSlice.ts** — Transient UI state (never persisted)
  - State: `slashMenuOpen`, `slashMenuPosition`, `aiLoading`, `sidebarCollapsed`
- **index.ts** — Store configuration with middleware

### Layer 3: Business Logic
**Location:** `src/services/`

- **BlockEngine.ts** — Block factory and utilities
  - `createBlock(type, content?, props?): Block`
- **SlashParser.ts** — Command parsing
  - `parseSlashCommand(input): SlashResult | null`
- **AIService.ts** — Claude API integration
  - `generateBlocks(prompt): Promise<Block[]>`
- **ExportService.ts** — Markdown conversion
  - `exportToMarkdown(blocks): string`

### Layer 4: Persistence
**Location:** `src/storage/`

- **StorageService.ts** — IndexedDB wrapper
  - `loadAll(): Promise<Page[]>`
  - `saveAll(pages): Promise<void>`
  - `getLastActivePageId(): Promise<string | null>`
  - `setLastActivePageId(id): Promise<void>`
- **StorageMiddleware.ts** — Redux middleware for auto-save

### Layer 5: External Integration
- **Claude API** — POST to `https://api.anthropic.com/v1/messages`
  - Called only from AIService
  - System prompt includes Block schema
  - Returns validated JSON array of blocks

---

## Data Model

### Page Entity
```typescript
interface Page {
  id: string;           // nanoid() — primary key
  title: string;        // Editable, defaults to "Untitled"
  icon: string;         // Single emoji character
  blocks: Block[];      // Ordered array
  createdAt: number;    // Date.now() timestamp
  updatedAt: number;    // Updated on every block change
}
```

### Block Entity
```typescript
interface Block {
  id: string;              // nanoid() — React key
  type: BlockType;         // See enum below
  content: string;         // Raw text (empty for divider)
  properties?: BlockProps; // Optional metadata
  createdAt: number;       // Timestamp
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

interface BlockProps {
  language?: string;    // Code blocks only
  checked?: boolean;    // Todo blocks only
  aiGenerated?: boolean; // True if created by AI
}
```

### Design Decisions
- **Blocks as array, not linked list** — Simpler reordering with array splice
- **Blocks nested in Page** — No foreign keys needed for local-only app
- **content always string** — Syntax highlighting is rendering concern
- **No nested blocks** — Flat structure keeps AI prompt simple

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Set up project, data structures, and basic Redux store

**Tasks:**
1. Initialize Vite + React + TypeScript project - DONE
2. Set up folder structure following layered architecture - DONE
3. Define TypeScript interfaces (Page, Block, BlockType, BlockProps)
4. Create Redux store with empty slices
5. Implement StorageService with idb wrapper
6. Create basic App shell with routing placeholder

**Deliverable:** App loads, TypeScript compiles, Redux DevTools works

---

### Phase 2: Core Editing (Week 2)
**Goal:** Build the block editor with keyboard navigation

**Tasks:**
1. Implement `pagesSlice` with all actions
2. Implement `editorSlice` with block CRUD operations
3. Build `EditorCanvas` component with contenteditable handling
4. Create all block components (Paragraph, Heading, Code, Todo, Quote, Divider)
5. Implement `BlockEngine.createBlock()` factory
6. Handle Enter key (new block) and Backspace (delete empty block)
7. Add cursor position preservation logic

**Deliverable:** Can create pages, type text, create new blocks with Enter

---

### Phase 3: Slash Commands (Week 3)
**Goal:** Add command palette for block type switching

**Tasks:**
1. Implement `SlashParser.parseSlashCommand()`
2. Create `SlashMenu` component with keyboard navigation
3. Add `uiSlice` for menu state management
4. Implement cursor position tracking for menu placement
5. Add fuzzy filtering as user types after "/"
6. Connect menu selections to block type transformations

**Deliverable:** Typing "/" opens menu, selecting transforms current block

---

### Phase 4: Sidebar & Pages (Week 4)
**Goal:** Multi-page document management

**Tasks:**
1. Build `Sidebar` component showing page list
2. Implement page switching (update activePageId)
3. Add "New Page" button with page creation
4. Implement page rename functionality
5. Add emoji picker for page icons
6. Add page deletion with confirmation
7. Handle edge case: deleting last page creates new one

**Deliverable:** Can create multiple pages, switch between them, rename/delete

---

### Phase 5: Persistence (Week 5)
**Goal:** Auto-save to IndexedDB

**Tasks:**
1. Implement `StorageMiddleware` listening to Redux actions
2. Add debouncing (500ms) to avoid excessive writes
3. Implement `StorageService.saveAll()` and `loadAll()`
4. Add app bootstrap logic to hydrate Redux from IndexedDB
5. Store `lastActivePageId` in meta store
6. Handle IndexedDB unavailable (private browsing) gracefully

**Deliverable:** Data persists across browser refresh, auto-saves on edits

---

### Phase 6: AI Integration (Week 6)
**Goal:** Claude API for content generation

**Tasks:**
1. Set up Anthropic API key management (env variable)
2. Implement `AIService.generateBlocks()` with API call
3. Create system prompt including Block TypeScript schema
4. Add JSON parsing and validation with type guards
5. Implement AI loading skeleton block
6. Add error handling with retry UI
7. Create special "/ai" command in SlashParser

**Deliverable:** Typing "/ai [prompt]" generates blocks via Claude

---

### Phase 7: Drag & Drop (Week 7)
**Goal:** Block reordering with mouse

**Tasks:**
1. Integrate @dnd-kit/core library
2. Add drag handles to blocks (show on hover)
3. Implement `moveBlock` action in editorSlice
4. Add visual feedback during drag (drop zones, ghost preview)
5. Ensure keyboard navigation still works
6. Test with long documents (50+ blocks)

**Deliverable:** Can drag blocks to reorder them

---

### Phase 8: Export (Week 8)
**Goal:** Markdown export

**Tasks:**
1. Implement `ExportService.exportToMarkdown()`
2. Map each block type to Markdown syntax:
   - paragraph → plain text
   - heading_1 → `# text`
   - code → triple backtick fence with language
   - todo → `- [ ]` or `- [x]`
   - quote → `> text`
   - divider → `---`
3. Add "Export .md" button in editor header
4. Trigger browser download with proper filename
5. Add copy-to-clipboard option (nice to have)

**Deliverable:** Clicking Export downloads .md file with correct formatting

---

### Phase 9: Polish & Optimization (Week 9)
**Goal:** Performance and UX refinements

**Tasks:**
1. Wrap block components in `React.memo`
2. Ensure stable keys (always use block.id)
3. Add paste handler (plain text only, no rich HTML)
4. Implement empty states (no pages, new page placeholder)
5. Add loading indicators for all async operations
6. Test edge cases (see Optimizations section)
7. Accessibility audit (keyboard nav, ARIA labels)

**Deliverable:** Smooth, responsive editor with no jank

---

### Phase 10: Testing & Deployment (Week 10)
**Goal:** Production readiness

**Tasks:**
1. Write unit tests for services (BlockEngine, SlashParser, ExportService)
2. Write integration tests for Redux slices
3. Add E2E tests for critical flows (create page, edit block, AI generation)
4. Set up CI pipeline (GitHub Actions)
5. Deploy to Vercel/Netlify
6. Write README with setup instructions
7. Create demo GIF/video

**Deliverable:** Deployed app with >80% test coverage

---

## Critical Implementation Details

### 1. ContentEditable Handling

**The Challenge:** contenteditable is notoriously difficult. You must manually manage cursor position, prevent default paste behavior, and intercept keyboard events.

**Solution Pattern:**
```typescript
// In Block component
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    dispatch(addBlock({ afterId: block.id }));
    // Focus management in useEffect
  }
  
  if (e.key === 'Backspace' && block.content === '') {
    e.preventDefault();
    dispatch(deleteBlock({ id: block.id }));
    // Move cursor to previous block
  }
};

const handlePaste = (e: ClipboardEvent) => {
  e.preventDefault();
  const text = e.clipboardData.getData('text/plain');
  document.execCommand('insertText', false, text);
};
```

### 2. Redux Middleware for Auto-Save

**The Pattern:**
```typescript
// StorageMiddleware.ts
const storageMiddleware: Middleware = store => next => action => {
  const result = next(action);
  
  // Only persist on relevant actions
  if (action.type.startsWith('pages/') || action.type.startsWith('editor/')) {
    debouncedSave(store.getState().pages);
  }
  
  return result;
};

// Debounce to avoid excessive writes
const debouncedSave = debounce(async (pages: Page[]) => {
  await StorageService.saveAll(pages);
}, 500);
```

### 3. AI Structured Output

**System Prompt Strategy:**
```typescript
const systemPrompt = `
You are a content generator for a block-based editor.
The user will give you a prompt. Return a JSON array of blocks.

Block TypeScript interface:
interface Block {
  type: 'paragraph' | 'heading_1' | 'heading_2' | 'heading_3' | 'code' | 'quote' | 'todo' | 'divider';
  content: string;
  properties?: {
    language?: string;  // For code blocks
    checked?: boolean;  // For todos
  };
}

CRITICAL RULES:
1. Return ONLY the JSON array. No markdown fences, no explanation.
2. Every block must have a valid type and content.
3. Code blocks should include properties.language.
4. Return 3-8 blocks depending on the prompt complexity.

Example output:
[
  { "type": "heading_2", "content": "Getting Started" },
  { "type": "paragraph", "content": "This guide covers the basics." }
]
`;
```

**Response Parsing:**
```typescript
// AIService.ts
export async function generateBlocks(prompt: string): Promise<Block[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: prompt }
      ],
      system: systemPrompt
    })
  });

  const data = await response.json();
  const content = data.content[0].text.trim();
  
  // Remove markdown fences if present
  const jsonText = content.replace(/```json\n?|\n?```/g, '');
  
  let rawBlocks;
  try {
    rawBlocks = JSON.parse(jsonText);
  } catch (err) {
    throw new KirokuAIError('Invalid JSON response from Claude');
  }
  
  // Validate and enrich each block
  const blocks = rawBlocks.map((raw: any) => {
    if (!isValidBlockType(raw.type)) {
      throw new KirokuAIError(`Invalid block type: ${raw.type}`);
    }
    
    return {
      id: nanoid(),
      type: raw.type,
      content: raw.content || '',
      properties: {
        ...raw.properties,
        aiGenerated: true
      },
      createdAt: Date.now()
    };
  });
  
  return blocks;
}
```

### 4. Slash Menu Positioning

**The Challenge:** The menu must appear at the cursor, which moves as the user types.

**Solution:**
```typescript
// Use a hidden span to measure cursor position
const measureCursorPosition = (): { top: number; left: number } => {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return { top: 0, left: 0 };
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  return {
    top: rect.bottom + window.scrollY,
    left: rect.left + window.scrollX
  };
};

// In component
useEffect(() => {
  if (slashMenuOpen) {
    const pos = measureCursorPosition();
    dispatch(setSlashMenuPosition(pos));
  }
}, [slashMenuOpen]);
```

---

## Testing Strategy

### Unit Tests (Vitest)
**Location:** `src/**/__tests__/`

**Coverage:**
- BlockEngine: test createBlock() with all types
- SlashParser: test all command patterns
- ExportService: test Markdown conversion for each block type
- StorageService: mock IndexedDB, test CRUD operations

**Example:**
```typescript
// BlockEngine.test.ts
describe('BlockEngine', () => {
  it('creates a paragraph block with default values', () => {
    const block = createBlock('paragraph', 'Hello world');
    
    expect(block.id).toBeDefined();
    expect(block.type).toBe('paragraph');
    expect(block.content).toBe('Hello world');
    expect(block.createdAt).toBeGreaterThan(0);
  });
  
  it('creates a code block with language property', () => {
    const block = createBlock('code', 'const x = 1;', { language: 'typescript' });
    
    expect(block.properties?.language).toBe('typescript');
  });
});
```

### Integration Tests
**Focus:** Redux slice interactions

**Example:**
```typescript
// editorSlice.test.ts
describe('editorSlice', () => {
  it('adds a block after a specific block', () => {
    const state = {
      blocks: [
        { id: 'a', type: 'paragraph', content: 'First', createdAt: 1 },
        { id: 'b', type: 'paragraph', content: 'Second', createdAt: 2 }
      ]
    };
    
    const action = addBlock({ afterId: 'a', block: { id: 'c', type: 'paragraph', content: 'New', createdAt: 3 } });
    const newState = editorReducer(state, action);
    
    expect(newState.blocks[1].id).toBe('c');
  });
});
```

### E2E Tests (Playwright or Cypress)
**Critical Flows:**
1. Create new page → type content → refresh → content persists
2. Type "/" → select heading → block transforms
3. Type "/ai prompt" → wait for skeleton → blocks appear
4. Drag block → drop → order changes
5. Export → download starts → file contains correct Markdown

---

## Optimization Checklist

### Performance
- [ ] Debounce IndexedDB writes (500ms)
- [ ] Wrap block components in React.memo
- [ ] Use block.id as React key (never index)
- [ ] Virtualize block list for pages with 100+ blocks (react-window)
- [ ] Lazy load AI service (dynamic import)

### UX
- [ ] Cursor position preservation after Enter/Backspace
- [ ] Slash menu positioned at cursor, not fixed
- [ ] AI skeleton shows within 100ms of prompt submission
- [ ] Empty states for no pages / new page
- [ ] Loading indicators for all async operations
- [ ] Toast notifications for errors

### Edge Cases
- [ ] Deleting last page creates new blank page
- [ ] First load seeds one default page
- [ ] Paste handler strips rich HTML
- [ ] Handle IndexedDB unavailable (private browsing)
- [ ] AI JSON parsing failures handled gracefully
- [ ] Network errors show retry button

### Error Handling
- [ ] AI API failure → show error block with retry
- [ ] Malformed AI JSON → validate with type guards
- [ ] IndexedDB unavailable → show warning banner
- [ ] Network timeout → abort signal with 30s timeout

---

## Environment Setup

### Required Environment Variables
```bash
# .env
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

### Local Development
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview
```

---

## Project Milestones

| Milestone | Description | Success Criteria |
|-----------|-------------|------------------|
| **M1: Foundation** | Project setup, TypeScript definitions | App loads, types compile |
| **M2: Basic Editor** | Single-page editing with blocks | Can type and create blocks |
| **M3: Slash Commands** | Command palette working | Menu opens on "/", transforms blocks |
| **M4: Multi-page** | Sidebar navigation | Can switch between pages |
| **M5: Persistence** | IndexedDB integration | Data survives refresh |
| **M6: AI Generation** | Claude API working | "/ai" generates blocks |
| **M7: Drag & Drop** | Block reordering | Can drag blocks |
| **M8: Export** | Markdown download | Export button works |
| **M9: Polish** | Performance optimizations | No jank, smooth interactions |
| **M10: Production** | Tests + deployment | Live on Vercel, >80% coverage |

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
- **Cyclomatic complexity:** <10 per function

---

## Resources

### Learning Materials
- [Redux Toolkit docs](https://redux-toolkit.js.org/)
- [ContentEditable best practices](https://medium.com/content-uneditable/contenteditable-the-good-the-bad-and-the-ugly-261ba4d9abfd)
- [IndexedDB guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [Anthropic API reference](https://docs.anthropic.com/en/api)

### Similar Projects (for reference)
- Notion (inspiration)
- Obsidian (local-first)
- Tiptap (block editor framework)
- ProseMirror (editor engine)

---

## Next Steps After Completion

### Portfolio Enhancement
1. Deploy to custom domain
2. Create demo video (3-5 minutes)
3. Write technical blog post explaining architecture
4. Add to GitHub with detailed README

### Potential Extensions (V2)
- Rich text formatting (bold, italic, links)
- Image blocks with upload
- Table blocks
- Nested blocks (indentation)
- Real-time collaboration (Yjs or Automerge)
- Mobile responsive layout
- Themes (light/dark mode)
- Cloud sync (Supabase or Firebase)
- Browser extension
- Desktop app (Tauri or Electron)

---

## Mentorship Notes

As you build this project, focus on:

1. **Architectural thinking** — Why is the layered architecture beneficial? How would you explain it in an interview?

2. **Trade-offs** — Why IndexedDB instead of localStorage? Why Redux instead of Context API? Document your reasoning.

3. **Debugging skills** — ContentEditable bugs will be frustrating. Learn Chrome DevTools deeply.

4. **Code review mindset** — After each phase, review your own code as if you were reviewing a colleague's PR. What would you change?

5. **Interview preparation** — This project covers: state management, TypeScript, API integration, performance optimization, accessibility. Practice explaining each.

### Weekly Check-ins
- **Week 1-2:** Focus on TypeScript mastery. No `any` types.
- **Week 3-4:** Redux patterns. Read the official style guide.
- **Week 5-6:** IndexedDB and AI integration. Debug skills crucial here.
- **Week 7-8:** Polish and edge cases. Attention to detail.
- **Week 9-10:** Testing. Learn to write tests that catch real bugs.

---

## Final Thoughts

Kiroku is a **portfolio-grade project** that demonstrates production-level React skills. By completion, you'll have:
- A deployable, working product
- Deep understanding of state management
- Experience with AI API integration
- Knowledge of local-first architecture
- A strong talking point for interviews

Take your time with each phase. Quality over speed. Document as you go. Good luck! 🚀

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-15  
**Estimated Completion Time:** 10 weeks (part-time)  
**Difficulty:** Intermediate to Advanced
