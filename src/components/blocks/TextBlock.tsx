import { useEffect, useRef, type KeyboardEvent } from "react";

// --- Types -------------------------------------------
import type { Block, BlockType } from "../../types";

// --- Hooks -------------------------------------------
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useBlockFocus } from "../../hooks/useBlockFocus";
import { useSlashConfirm } from "../../hooks/useSlashConfirm";

// --- Redux Slice -------------------------------------
import { setFocusedBlockId } from "../../store/editorSlice";
import { addBlock, deleteBlock, updateBlock } from "../../store/pageSlice";
import {
  clearSlashConfirmRequest,
  closeSlashMenu,
  openSlashMenu,
  setSlashSelectedIndex,
} from "../../store/uiSlice";

// --- Services -----------------------------------------
import { createBlock } from "../../services/BlockEngine";
import { filterCommands } from "../../services/SlashParser";

const TYPE_CLASSNAMES: Partial<Record<BlockType, string>> = {
  paragraph: "text-base text-gray-900",
  heading_1: "text-4xl font-bold text-gray-900",
  heading_2: "text-3xl font-semibold text-gray-800",
  heading_3: "text-2xl font-medium text-gray-800",
  quote: "text-base italic text-gray-600 border-l-4 border-gray-300 pl-4",
};

interface TextBlockProps {
  block: Block;
  previousBlockId: string | null;
  isOnlyBlock: boolean;
}

const measureCursorPosition = (
  ref: React.RefObject<HTMLDivElement | null>,
): { top: number; left: number } => {
  const selection = window.getSelection();
  if (selection?.rangeCount) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    // rect is non-zero — cursor has real geometry
    if (rect.top !== 0 || rect.left !== 0) {
      return { top: rect.bottom, left: rect.left };
    }
  }
  // Fallback: use the block element's own position
  // Happens when block is empty (no text nodes to measure)
  if (ref.current) {
    const rect = ref.current.getBoundingClientRect();
    return { top: rect.bottom, left: rect.left };
  }
  return { top: 0, left: 0 };
};

export default function TextBlock({
  block,
  previousBlockId,
  isOnlyBlock,
}: TextBlockProps) {
  const slashMenuOpen = useAppSelector((s) => s.ui.slashMenuOpen);
  const slashMenuBlockId = useAppSelector((s) => s.ui.slashMenuBlockId);
  const slashMenuStartIndex = useAppSelector((s) => s.ui.slashMenuStartIndex);
  const slashSelectedIndex = useAppSelector((s) => s.ui.slashSelectedIndex);
  const slashConfirmRequest = useAppSelector((s) => s.ui.slashConfirmRequest);
  const isMyMenu = slashMenuOpen && slashMenuBlockId === block.id;

  const dispatch = useAppDispatch();
  const divRef = useRef<HTMLDivElement>(null);
  const { handleConfirm } = useSlashConfirm(block, divRef);

  useBlockFocus(block.id, divRef);

  // Init DOM text on mount (only once - never run again)
  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerText = block.content;
    }
  }, []);

  useEffect(() => {
    if (!slashConfirmRequest || !isMyMenu) return;
    handleConfirm(slashConfirmRequest);
    dispatch(clearSlashConfirmRequest());
  }, [slashConfirmRequest, isMyMenu]);

  const handleInput = () => {
    const raw = divRef.current?.innerText ?? "";
    // contenteditable inserts a trainling \n when empty - normalize to ""
    // contentEditable elements in browser silently converts trailing regualar
    // spaces  to &nbsp; (non-breaking space, unicode \u00a0) to preserve spacing.
    // "\u00a0" !== " " -> true  so .endsWith(" ") returns fasle
    const normalized = raw === "\n" ? "" : raw.replace(/\u00a0/g, " ");
    dispatch(updateBlock({ id: block.id, content: normalized }));

    // If the / has been deleted, close the menu
    if (isMyMenu && normalized.length <= slashMenuStartIndex) {
      dispatch(closeSlashMenu());
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // --- Slash Menu keyboard handling --------------------------------------
    if (isMyMenu) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const query = block.content.slice(slashMenuStartIndex + 1);
        const commands = filterCommands(query);
        if (commands.length === 0) return;
        const delta = e.key === "ArrowDown" ? 1 : -1;
        const activeSlashindex =
          (slashSelectedIndex + delta + commands.length) % commands.length;
        dispatch(setSlashSelectedIndex(activeSlashindex));
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const query = block.content.slice(slashMenuStartIndex + 1);
        const commands = filterCommands(query);
        const selected = commands[slashSelectedIndex];
        if (selected) handleConfirm(selected);
        return;
      }

      if (e.key === "Escape") {
        dispatch(closeSlashMenu());
        return;
      }

      if (e.key === " ") {
        dispatch(closeSlashMenu());
      }
    }

    // ---- Normal block handling ------------------------------------------------
    if (e.key === "/") {
      const shouldOpen = block.content === "" || block.content.endsWith(" ");

      if (shouldOpen) {
        const mode = block.content === "" ? "transform" : "insert";
        const startIndex = block.content.length;
        const position = measureCursorPosition(divRef);
        dispatch(
          openSlashMenu({ blockId: block.id, position, mode, startIndex }),
        );
      }
    }

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
      role="combobox"
      aria-expanded={isMyMenu}
      aria-haspopup="listbox"
      aria-autocomplete="list"
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      className={`outline-none w-full min-h-6 py-1 ${TYPE_CLASSNAMES[block.type] ?? "text-base text-gray-900"}`}
      data-block-id={block.id}
      data-placeholder="Type something, or press '/' for commands..."
    />
  );
}
