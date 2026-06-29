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

const bootstrap = (async (): Promise<{
  list: Page[];
  activePageId: string | null;
}> => {
  const [list, savedId] = await Promise.all([loadAll(), getLastActivePageId()]);
  if (list.length === 0) {
    const seeded = createBlankPage();
    return { list: [seeded], activePageId: seeded.id };
  }

  const savedPage = list.find((p) => p.id === savedId);
  const activePageId = savedPage?.id ?? list[0]?.id ?? null;

  return { list, activePageId };
})();

(async () => {
  const payload = await bootstrap;
  store.dispatch(hydrate(payload));

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>,
  );
})();
