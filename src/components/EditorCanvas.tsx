import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  createPage,
  moveBlock,
  selectActivePageBlocks,
} from "../store/pageSlice";
import { setFocusedBlockId } from "../store/editorSlice";
import SlashMenu from "./SlashMenu";
import PageTitle from "./PageTitle";
import AILoadingIndicator from "./AILoadingIndicator";
import { DragDropProvider } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import SortableBlock from "./SortableBlock";
import type { DragEndEvent } from "@dnd-kit/react";
import { closeSlashMenu } from "../store/uiSlice";

export default function EditorCanvas() {
  const dispatch = useAppDispatch();
  const aiLoading = useAppSelector((s) => s.ui.aiLoading);
  const blocks = useAppSelector(selectActivePageBlocks);
  const activePage = useAppSelector((state) =>
    state.pages.list.find((p) => p.id === state.pages.activePageId),
  );

  /**
   * Editor will fire too early.
   * React fires effect s bottom up -
   */
  useEffect(() => {
    // Only auto-focus on a genuinely blank new page
    // One block + empty content = "just created, ready to type"
    // Anything else = existing page, let user click
    const firstBlock = blocks[0];

    if (blocks.length === 1 && firstBlock && firstBlock.content === "") {
      dispatch(setFocusedBlockId(firstBlock.id));
    }
    // Intentionally keyed on page id only — we want this to fire on page
    // switch, not on every block edit. blocks is read fresh from the closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage?.id]);

  const handleOnDragEnd = (event: DragEndEvent) => {
    if (event.canceled) return;
    const { source } = event.operation;

    if (!isSortable(source)) return;

    const { initialIndex, index } = source;

    if (initialIndex === index) return;

    const activeId = String(source.id); // who is moving -> "A"

    if (blocks[initialIndex]?.id !== activeId) {
      console.warn("[dnd] store and library disagree — move skipped", {
        activeId,
        initialIndex,
      });
      return;
    }

    const overId = blocks[index]?.id; // whose seat A takes -> "C"
    if (!overId) return;

    dispatch(moveBlock({ activeId, overId }));
  };

  if (!activePage) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
        <p>No page open</p>
        <button
          type="button"
          onClick={() => dispatch(createPage())}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm"
        >
          Create a page
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-16 py-12">
          {/* Page title */}
          <div className="mb-8 flex items-center gap-2">
            <span>{activePage.icon}</span>
            <PageTitle />
          </div>

          {/* Block list */}
          <DragDropProvider
            onDragEnd={handleOnDragEnd}
            onDragStart={() => dispatch(closeSlashMenu())}
          >
            {blocks.map((block, index) => (
              <SortableBlock
                key={block.id}
                index={index}
                block={block}
                previousBlockId={blocks[index - 1]?.id ?? null}
                isOnlyBlock={blocks.length === 1}
              />
            ))}
          </DragDropProvider>
          {aiLoading && <AILoadingIndicator />}
        </div>
      </div>
      <SlashMenu />
    </>
  );
}
