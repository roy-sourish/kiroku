import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Block, BlockProperties, BlockType, Page } from "../types";
import { createBlankPage } from "../services/PageEngine";

interface PageState {
  list: Page[]; // Array of all the pages
  activePageId: string | null; // Currently selected page
}

const initialState: PageState = {
  list: [],
  activePageId: null,
};

const pageSlice = createSlice({
  name: "pages",
  initialState,
  reducers: {
    hydrate(
      state,
      action: PayloadAction<{ list: Page[]; activePageId: string | null }>,
    ) {
      const { list, activePageId } = action.payload;
      state.list = list;
      state.activePageId = activePageId;
    },

    createPage(state) {
      const newPage = createBlankPage();

      const activePageId = newPage.id;

      state.activePageId = activePageId;
      state.list.push(newPage);
    },

    deletePage(state, action: PayloadAction<string>) {
      const pageId = action.payload;

      const deletedIndex = state.list.findIndex((p) => p.id === pageId);
      // Remove the page
      state.list = state.list.filter((p) => p.id !== pageId);

      // If deleted page was the active page
      if (state.activePageId === pageId) {
        const nextPage = state.list[deletedIndex];
        const previousPage = state.list[deletedIndex - 1];

        // If next page doesn't exists fallback to previous page
        // if previous page also doesn't exist fallback to null;
        // @NOTE: if id is "", || will skip it, so use ??
        state.activePageId = nextPage?.id ?? previousPage?.id ?? null;
      }
    },

    renamePage(state, action: PayloadAction<{ id: string; title: string }>) {
      const newTitle = action.payload.title;
      const pageId = action.payload.id;

      const page = state.list.find((p) => p.id === pageId);
      if (!page) {
        return;
      }
      page.title = newTitle;
    },

    setActivePage(state, action: PayloadAction<string>) {
      const newActivePageId = action.payload;

      state.activePageId = newActivePageId;
    },

    setPageIcon(state, action: PayloadAction<{ id: string; icon: string }>) {
      const pageId = action.payload.id;
      const newIcon = action.payload.icon;

      const page = state.list.find((p) => p.id === pageId);
      if (!page) {
        return;
      }
      page.icon = newIcon;
    },

    /* ---------------------------------------------- */
    /* Block Operations                               */
    /* ---------------------------------------------- */

    addBlock(
      state,
      action: PayloadAction<{ afterId: string | null; block: Block }>,
    ) {
      const activePage = state.list.find((p) => p.id === state.activePageId);
      if (!activePage) return;

      const { afterId, block } = action.payload;

      if (afterId === null) {
        activePage.blocks.push(block);
      } else {
        const index = activePage.blocks.findIndex((b) => b.id === afterId);

        if (index === -1) {
          activePage.blocks.push(block);
        } else {
          // splice(startIndex, deleteCount, ...itemsToInsert)
          // at index + 1, delete nothing, insert our block
          activePage.blocks.splice(index + 1, 0, block);
        }
      }

      activePage.updatedAt = Date.now();
    },

    updateBlock(
      state,
      action: PayloadAction<{
        id: string;
        content?: string;
        type?: BlockType;
        properties?: BlockProperties;
      }>,
    ) {
      const activePage = state.list.find((p) => p.id === state.activePageId);
      if (!activePage) return;

      const { id, content, type, properties } = action.payload;
      const existingBlock = activePage.blocks.find((b) => b.id === id);
      if (!existingBlock) return;

      if (content !== undefined) {
        existingBlock.content = content;
      }
      if (type !== undefined) {
        existingBlock.type = type;
      }
      if (properties !== undefined) {
        existingBlock.properties = properties;
      }

      activePage.updatedAt = Date.now();
    },

    deleteBlock(state, action: PayloadAction<{ id: string }>) {
      const { id } = action.payload;
      const activePage = state.list.find((p) => p.id === state.activePageId);
      if (!activePage) return;

      const blockIndexToBeDeleted = activePage.blocks.findIndex(
        (b) => b.id === id,
      );
      if (blockIndexToBeDeleted === -1) return;
      activePage.blocks.splice(blockIndexToBeDeleted, 1);
      activePage.updatedAt = Date.now();
    },

    moveBlock(
      state,
      action: PayloadAction<{ activeId: string; overId: string }>,
    ) {
      const { activeId, overId } = action.payload;

      // Dropped on itself, Nothing to do — return early.
      if (activeId === overId) return;

      // Find the active page .
      const activePage = state.list.find((p) => p.id === state.activePageId);
      if (!activePage) return;

      const fromIndex = activePage.blocks.findIndex((b) => b.id === activeId);
      const toIndex = activePage.blocks.findIndex((b) => b.id === overId);

      if (fromIndex === -1 || toIndex === -1) return;

      const blockToMove = activePage.blocks[fromIndex];
      if (!blockToMove) return;

      // Read before removing: after the first splice, fromIndex points at a different block
      activePage.blocks.splice(fromIndex, 1);
      // "Take the target's slot": insert at toIndex, NOT toIndex + 1 (that's addBlock's "after" semantics)
      activePage.blocks.splice(toIndex, 0, blockToMove);

      // Update the page's updatedAt.
      activePage.updatedAt = Date.now();
    },

    insertAIBlocks(
      state,
      action: PayloadAction<{ blocks: Block[]; afterId: string | null }>,
    ) {
      const activePage = state.list.find((p) => p.id === state.activePageId);
      if (!activePage) return;

      const { afterId, blocks } = action.payload;

      if (blocks.length === 0) return;

      if (afterId === null) {
        activePage.blocks.push(...blocks);
      } else {
        const index = activePage.blocks.findIndex((b) => b.id === afterId);

        if (index === -1) {
          activePage.blocks.push(...blocks);
        } else {
          // splice(startIndex, deleteCount, ...itemsToInsert)
          // at index + 1, delete nothing, insert our block
          activePage.blocks.splice(index + 1, 0, ...blocks);
        }
      }

      activePage.updatedAt = Date.now();
    },
  },
});

// Avoid circular imports
type PageRootState = { pages: PageState };

/**
 * Blocks are stored as nested inside pages.
 * This little helper extracts all the blocks from the active page
 */
export const selectActivePageBlocks = (state: PageRootState): Block[] => {
  const activePage = state.pages.list.find(
    (p) => p.id === state.pages.activePageId,
  );
  return activePage?.blocks ?? [];
};

export const selectPageIds = (state: PageRootState): string[] => {
  const pageIds = state.pages.list.map((p) => p.id);
  return pageIds;
};

export const {
  hydrate,
  createPage,
  deletePage,
  renamePage,
  setActivePage,
  setPageIcon,
  addBlock,
  updateBlock,
  deleteBlock,
  moveBlock,
  insertAIBlocks,
} = pageSlice.actions;

export default pageSlice.reducer;
