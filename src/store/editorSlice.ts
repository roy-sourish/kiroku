import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface EditorState {
  focusedBlockId: string | null;
}

const initialState: EditorState = {
  focusedBlockId: null,
};

const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    setFocusedBlockId(state, action: PayloadAction<string | null>) {
      const newFocusedBlockId = action.payload;

      state.focusedBlockId = newFocusedBlockId;
    },
    clearFocusedBlockId(state) {
      state.focusedBlockId = null;
    },
  },
});

export const { setFocusedBlockId, clearFocusedBlockId } = editorSlice.actions;

export default editorSlice.reducer;
