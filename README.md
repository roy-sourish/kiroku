# Kiroku 記録

A local-first, block-based note editor — inspired by Notion, built entirely in the browser.

All data lives in IndexedDB. No backend, no accounts, no sync.

---

## Features

- **Block-based editing** — paragraphs, headings (H1–H3), code, quotes, todos, and dividers
- **Slash commands** — type `/` to open the block-type picker
- **Multi-page management** — sidebar navigation with emoji icons and editable titles
- **AI content generation** — powered by Claude API, generates structured blocks from a prompt
- **Drag-and-drop reordering** — rearrange blocks with @dnd-kit
- **Markdown export** — export any page as a `.md` file
- **Fully offline** — IndexedDB persistence, no network required for core editing
- **Keyboard-first** — Enter creates new blocks, Backspace on empty deletes, arrow keys navigate

## Tech Stack

| Concern     | Library                              |
| ----------- | ------------------------------------ |
| UI          | React 19                             |
| State       | Redux Toolkit                        |
| Persistence | IndexedDB via `idb`                  |
| Styling     | Tailwind CSS 4                       |
| Build       | Vite 8                               |
| IDs         | nanoid                               |
| Drag & drop | @dnd-kit/core (Phase 7)              |
| AI          | Anthropic SDK / Claude API (Phase 6) |

## Getting Started

```bash
npm install
npm run dev       # http://localhost:5173
```

```bash
npm run build     # Type-check + production bundle
npm run preview   # Serve the production build
npm run lint      # ESLint
```

## Architecture

Kiroku uses a strict 5-layer architecture. Each layer only calls the one below it:

```
UI Components  →  Redux Store  →  Services  →  StorageService (IndexedDB)  →  Claude API
```

- **`src/store/`** — Three Redux slices: `pages` (page list, active page, **and all block data + block operations**), `editor` (transient editor state — the focused block), `ui` (slash menu, AI loading, sidebar state)
- **`src/components/`** — `App`, `Sidebar`, `PageListItem`, `EditorCanvas`, `PageTitle`, `Block` (type router), `SlashMenu`, and `blocks/TextBlock` (one unified component for all text-bearing block types)
- **`src/services/`** — Business logic: `BlockEngine` (block factory) and `SlashParser`; `AIService` (Phase 6) and `ExportService` (Phase 8) are planned
- **`src/services/StorageService.ts`** — IndexedDB wrapper; degrades gracefully if storage is unavailable (built, wired to the store in Phase 5)
- **`src/types/index.ts`** — Canonical `Page`, `Block`, and `BlockType` definitions

## AI Integration

Set your Anthropic API key before using AI block generation (Phase 6):

```
VITE_ANTHROPIC_API_KEY=your_key_here
```

The AI feature sends a natural-language prompt to Claude and receives a validated JSON array of `Block` objects, inserted directly into the editor at the cursor position.

## Project Status

| Phase | Description                                                        | Status    |
| ----- | ------------------------------------------------------------------ | --------- |
| 1     | Foundation — project setup, types, Redux shell, StorageService     | ✅ Done   |
| 2     | Core editing — block components, Redux reducers, keyboard handling | ✅ Done   |
| 3     | Slash commands                                                     | ✅ Done   |
| 4     | Sidebar & page management                                          | ✅ Done   |
| 5     | Persistence middleware (auto-save)                                 | 🔄 Active |
| 6     | Claude AI integration                                              | Planned   |
| 7     | Drag-and-drop reordering                                           | Planned   |
| 8     | Markdown export                                                    | Planned   |
| 9     | Polish & accessibility                                             | Planned   |
| 10    | Testing & deployment                                               | Planned   |

Full implementation details are in [`docs/KIROKU_PROJECT_INSTRUCTIONS.md`](docs/KIROKU_PROJECT_INSTRUCTIONS.md).
