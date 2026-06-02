import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectActivePageBlocks } from "../store/pageSlice";
import Block from "./Block";
import { setFocusedBlockId } from "../store/editorSlice";

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
  }, [blocks.length]);

  if (!activePage) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        No page selected
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto px-16 py-12">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 outline-none">
            {activePage.icon}{activePage.title}
          </h1>
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
  );
}
