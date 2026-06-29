import type { Middleware } from "@reduxjs/toolkit";
import { debounce } from "../utils/debounce";
import { saveAll, setLastActivePageId } from "../services/StorageService";
import type { RootState } from "./index";
import type { Page } from "../types";

const DELAY = 500;

const debouncedSave = debounce((list: Page[]) => {
  saveAll(list);
}, DELAY);

export const persistenceMiddleware: Middleware<unknown, RootState> =
  (store) => (next) => (action) => {
    const prevState = store.getState();
    const prevList: Page[] = prevState.pages.list;
    const prevActivePageId = prevState.pages.activePageId;

    const result = next(action);

    const afterState = store.getState();
    const nextList: Page[] = afterState.pages.list;
    const nextActivePageId = afterState.pages.activePageId;

    if (prevList !== nextList) {
      debouncedSave(nextList);
    }

    if (prevActivePageId !== nextActivePageId && nextActivePageId !== null) {
      setLastActivePageId(nextActivePageId);
    }

    return result;
  };

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    debouncedSave.flush();
  }
});

window.addEventListener("pagehide", () => {
  debouncedSave.flush();
});
