import React, { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import type { Block } from "../../types";
import {
  clearFocusedBlockId,
  setFocusedBlockId,
} from "../../store/editorSlice";
import { addBlock, deleteBlock, updateBlock } from "../../store/pageSlice";
import { createBlock } from "../../services/BlockEngine";

interface ParagraphBlockProps {
  block: Block;
  previousBlockId: string | null;
}

export default function ParagraphBlock({
  block,
  previousBlockId,
}: ParagraphBlockProps) {
  const dispatch = useAppDispatch();
  const divRef = useRef<HTMLDivElement>(null);

  const isFocused = useAppSelector(
    (state) => state.editor.focusedBlockId === block.id,
  );

  // Init DOM text on mount (only once - never run again)
  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerText = block.content;
    }
  }, []);

  // Consume focus signal from Redux
  useEffect(() => {
    if (isFocused) {
      divRef.current?.focus();
      dispatch(clearFocusedBlockId());
    }
  }, [isFocused, dispatch]);

  const handleInput = () => {
    const content = divRef.current?.innerText ?? "";
    dispatch(updateBlock({ id: block.id, content }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const newParagraphBlock = createBlock("paragraph");
      dispatch(addBlock({ afterId: block.id, block: newParagraphBlock }));
      dispatch(setFocusedBlockId(newParagraphBlock.id));
    }

    if (e.key === "Backspace" && block.content === "") {
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
    />
  );
}
