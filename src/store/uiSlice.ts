import { createSlice } from "@reduxjs/toolkit";

interface UIState {
  slashMenuOpen: boolean;
  slashMenuPosition: { top: number; left: number } | null;
  aiLoading: boolean;
  sidebarCollapsed: boolean;
}

const initialState: UIState = {
  slashMenuOpen: false,
  slashMenuPosition: null,
  aiLoading: false,
  sidebarCollapsed: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // TODO: Phase 3-6 Implement these
    // openSlashMenu(state, action) {},
    // closeSlashMenu(state) {},
    // setAILoading(state, action) {},
    // toggleSidebar(state) {},
  },
});

// export const { openSlashMenu, closeSlashMenu, setAILoading, toggleSidebar } =
//   uiSlice.actions;

export default uiSlice.reducer;
