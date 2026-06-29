import { combineReducers, configureStore } from "@reduxjs/toolkit";
import pageReducer from "./pageSlice";
import editorReducer from "./editorSlice";
import uiReducer from "./uiSlice";
import { persistenceMiddleware } from "./persistenceMiddleware";

const rootReducer = combineReducers({
  pages: pageReducer,
  editor: editorReducer,
  ui: uiReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(persistenceMiddleware),
});

// Typescript types for the entire Redux setup
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
