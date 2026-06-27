import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { createPage, selectActivePageBlocks } from "../store/pageSlice";
import Block from "./Block";
import { setFocusedBlockId } from "../store/editorSlice";
import SlashMenu from "./SlashMenu";
import PageTitle from "./PageTitle";

export default function EditorCanvas() {
  const dispatch = useAppDispatch();

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
          <div>
            {blocks.map((block, index) => (
              <Block
                key={block.id}
                block={block}
                previousBlockId={blocks[index - 1]?.id ?? null}
                isOnlyBlock={blocks.length === 1}
              />
            ))}
          </div>
        </div>
      </div>
      <SlashMenu />
    </>
  );
}
