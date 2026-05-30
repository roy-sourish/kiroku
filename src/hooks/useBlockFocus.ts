import { useEffect, type RefObject } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { clearFocusedBlockId } from "../store/editorSlice";

const moveCursorToEnd = (el: HTMLElement): void => {
  const range = document.createRange();
  const selection = window.getSelection();
  range.selectNodeContents(el);
  range.collapse(false);
  selection?.removeAllRanges();
  selection?.addRange(range);
};

export const useBlockFocus = (
  blockId: string,
  divRef: RefObject<HTMLDivElement | null>,
): void => {
  const dispatch = useAppDispatch();
  const isFocused = useAppSelector(
    (state) => state.editor.focusedBlockId === blockId,
  );

  useEffect(() => {
    if (isFocused && divRef.current) {
      divRef.current.focus();
      moveCursorToEnd(divRef.current);
      dispatch(clearFocusedBlockId());
    }
  }, [isFocused, dispatch]);
};
