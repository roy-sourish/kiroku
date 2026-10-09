import type { Dispatch, Middleware } from "@reduxjs/toolkit";
import { debounce } from "../utils/debounce";
import { saveAll, setLastActivePageId } from "../services/StorageService";
import type { RootState } from "./index";
import type { Page } from "../types";
import { hydrate } from "./pageSlice";
import { setStorageStatus } from "./uiSlice";

const DELAY = 500;

const debouncedSave = debounce((list: Page[], dispatch: Dispatch) => {
  saveAll(list)
    .then(() => dispatch(setStorageStatus("ok")))
    .catch(() => dispatch(setStorageStatus("save-failed")));
}, DELAY);

export const persistenceMiddleware: Middleware<unknown, RootState> =
  (store) => (next) => (action) => {
    const prevState = store.getState();
    const result = next(action);

    // Guard 1: hydrate copies disk INTO memory. Writing it straight back
    // is pointless at best and destructive at worst (C2).
    if (hydrate.match(action)) return result;

    const afterState = store.getState();

    // Guard 2: fail safe on LOAD failure only. If we don't know what's on disk,
    // writing could overwrite real data. A SAVE failure is different: disk still
    // holds the last good snapshot, so we keep trying, and the next successful
    // save clears the warning.
    if (afterState.ui.storageStatus === "load-failed") return result;

    if (prevState.pages.list !== afterState.pages.list) {
      debouncedSave(afterState.pages.list, store.dispatch);
    }

    const nextActivePageId = afterState.pages.activePageId;
    if (
      prevState.pages.activePageId !== nextActivePageId &&
      nextActivePageId !== null
    ) {
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
