import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SlashCommand } from "../services/SlashParser";

interface UIState {
  slashMenuOpen: boolean;
  slashMenuPosition: { top: number; left: number } | null;
  slashMenuBlockId: string | null; // which block owns the session
  slashMenuMode: "transform" | "insert";
  slashMenuStartIndex: number; // where the / sits in the block.content
  slashSelectedIndex: number; // which item is highlited
  slashConfirmRequest: SlashCommand | null;
  aiLoading: boolean;
  sidebarCollapsed: boolean;
}

const initialState: UIState = {
  slashMenuOpen: false,
  slashMenuPosition: null,
  slashMenuBlockId: null,
  slashMenuMode: "insert",
  slashMenuStartIndex: 0,
  slashSelectedIndex: 0,
  slashConfirmRequest: null,
  aiLoading: false,
  sidebarCollapsed: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openSlashMenu(
      state,
      action: PayloadAction<{
        blockId: string;
        position: { top: number; left: number };
        mode: "transform" | "insert";
        startIndex: number;
      }>,
    ) {
      const { blockId, position, mode, startIndex } = action.payload;
      state.slashMenuOpen = true;
      state.slashMenuPosition = position;
      state.slashMenuBlockId = blockId;
      state.slashMenuMode = mode;
      state.slashMenuStartIndex = startIndex;
      state.slashSelectedIndex = 0;
    },

    closeSlashMenu(state) {
      state.slashMenuOpen = initialState.slashMenuOpen;
      state.slashMenuPosition = initialState.slashMenuPosition;
      state.slashMenuBlockId = initialState.slashMenuBlockId;
      state.slashMenuMode = initialState.slashMenuMode;
      state.slashMenuStartIndex = initialState.slashMenuStartIndex;
      state.slashSelectedIndex = initialState.slashSelectedIndex;
      state.slashConfirmRequest = initialState.slashConfirmRequest;
    },

    setSlashSelectedIndex(state, action: PayloadAction<number>) {
      state.slashSelectedIndex = action.payload;
    },

    requestSlashConfirm(state, action: PayloadAction<SlashCommand>) {
      state.slashConfirmRequest = action.payload;
    },

    clearSlashConfirmRequest(state) {
      state.slashConfirmRequest = initialState.slashConfirmRequest;
    },

    setAILoading(state, action: PayloadAction<boolean>) {
      state.aiLoading = action.payload;
    },

    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const {
  openSlashMenu,
  closeSlashMenu,
  setSlashSelectedIndex,
  requestSlashConfirm,
  clearSlashConfirmRequest,
  setAILoading,
  toggleSidebar,
} = uiSlice.actions;

export default uiSlice.reducer;
