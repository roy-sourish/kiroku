import { createSlice } from "@reduxjs/toolkit";
import type { Block } from "../types";

interface EditorState {
  blocks: Block[]; // Blocks for the current active page
}

const initialState: EditorState = {
  blocks: [],
};

const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    // TODO: Phase 2 - Implement these
    // addBlock(state, action) {},
    // updateBlock(state, action) {},
    // deleteBlock(state, action) {},
    // moveBlock(state, action) {},
    // insertAIBlock(state, action) {},
  },
});

// export const { addBlock, updateBlock, deleteBlock, moveBlock, insertAIBlock } =
//   editorSlice.actions;

export default editorSlice.reducer;
