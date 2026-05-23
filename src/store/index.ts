import { configureStore } from "@reduxjs/toolkit";
import pageReducer from "./pageSlice";
import editorReducer from "./editorSlice";
import uiReducer from "./uiSlice";

export const store = configureStore({
  reducer: {
    pages: pageReducer,
    editor: editorReducer,
    ui: uiReducer,
  },

  // Phase 5: Middleware will go here
});

// Typescript types for the entire Redux setup
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;