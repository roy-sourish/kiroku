import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Provider } from "react-redux";
import { store } from "./store/index.ts";
import { getLastActivePageId, loadAll } from "./services/StorageService.ts";
import { createBlankPage } from "./services/PageEngine.ts";
import type { Page } from "./types/index.ts";
import { hydrate } from "./store/pageSlice.ts";
import { setStorageStatus, type StorageStatus } from "./store/uiSlice.ts";
interface BootstrapResult {
  list: Page[];
  activePageId: string | null;
  storageStatus: StorageStatus;
}
const bootstrap = (async (): Promise<BootstrapResult> => {
  try {
    const [list, savedId] = await Promise.all([
      loadAll(),
      getLastActivePageId(),
    ]);
    if (list.length === 0) {
      const seeded = createBlankPage();
      return { list: [seeded], activePageId: seeded.id, storageStatus: "ok" };
    }

    const savedPage = list.find((p) => p.id === savedId);
    const activePageId = savedPage?.id ?? list[0]?.id ?? null;

    return { list, activePageId, storageStatus: "ok" };
  } catch {
    // Load failed. We don't know what's on disk. Give the user a working
    // scratch page, but flag it so the middleware never writes (fail safe).
    // loadAll() already logged the real error with its cause.
    const seeded = createBlankPage();
    return {
      list: [seeded],
      activePageId: seeded.id,
      storageStatus: "load-failed",
    };
  }
})();

(async () => {
  const { list, activePageId, storageStatus } = await bootstrap;
  store.dispatch(setStorageStatus(storageStatus));
  store.dispatch(hydrate({ list, activePageId }));

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>,
  );
})();
