import { useEffect, useRef, type KeyboardEvent } from "react";
import { useAppDispatch } from "../../store/hooks";
import type { Block } from "../../types";
import { setFocusedBlockId } from "../../store/editorSlice";
import { addBlock, deleteBlock, updateBlock } from "../../store/pageSlice";
import { createBlock } from "../../services/BlockEngine";
import { useBlockFocus } from "../../hooks/useBlockFocus";

interface ParagraphBlockProps {
  block: Block;
  previousBlockId: string | null;
  isOnlyBlock: boolean;
}

export default function ParagraphBlock({
  block,
  previousBlockId,
  isOnlyBlock,
}: ParagraphBlockProps) {
  const dispatch = useAppDispatch();
  const divRef = useRef<HTMLDivElement>(null);

  useBlockFocus(block.id, divRef);

  // Init DOM text on mount (only once - never run again)
  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerText = block.content;
    }
  }, []);

  const handleInput = () => {
    const raw = divRef.current?.innerText ?? "";
    // contenteditable inserts a trainling \n when empty - normalize to ""
    const content = raw === "\n" ? "" : raw;
    dispatch(updateBlock({ id: block.id, content }));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const newParagraphBlock = createBlock("paragraph");
      dispatch(addBlock({ afterId: block.id, block: newParagraphBlock }));
      dispatch(setFocusedBlockId(newParagraphBlock.id));
    }

    if (e.key === "Backspace" && block.content === "" && !isOnlyBlock) {
      e.preventDefault();
      dispatch(deleteBlock({ id: block.id }));
      dispatch(setFocusedBlockId(previousBlockId));
    }
  };

  return (
    <div
      ref={divRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      className="outline-none w-full min-h-6 py-1 text-gray-900"
      data-block-id={block.id}
      data-placeholder="Type something, or press '/' for commands..."
    />
  );
}
