import type React from "react";
import type { Block } from "../types";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useCallback } from "react";
import type { SlashCommand } from "../services/SlashParser";
import { closeSlashMenu } from "../store/uiSlice";
import { addBlock, updateBlock } from "../store/pageSlice";
import { createBlock, defaultPropertiesFor } from "../services/BlockEngine";
import { setFocusedBlockId } from "../store/editorSlice";

export function useSlashConfirm(
  block: Block,
  divRef: React.RefObject<HTMLDivElement | null>,
) {
  const dispatch = useAppDispatch();
  const slashMenuMode = useAppSelector((s) => s.ui.slashMenuMode);
  const slashMenuStartIndex = useAppSelector((s) => s.ui.slashMenuStartIndex);

  const handleConfirm = useCallback(
    (command: SlashCommand) => {
      let focusTargetId: string;

      if (slashMenuMode === "transform") {
        // --- transform path ----------------------------
        dispatch(
          updateBlock({
            id: block.id,
            content: "",
            type: command.blockType,
            properties: defaultPropertiesFor(command.blockType),
          }),
        );

        if (divRef.current) divRef.current.innerText = "";
        focusTargetId = block.id;
      } else {
        // --- insert path --------------------------------
        const anchorContent = block.content.slice(0, slashMenuStartIndex);
        dispatch(updateBlock({ id: block.id, content: anchorContent }));
        if (divRef.current) divRef.current.innerText = anchorContent;
        const newBlock = createBlock(command.blockType);
        dispatch(addBlock({ afterId: block.id, block: newBlock }));
        focusTargetId = newBlock.id;
      }

      // Divider special case -----------
      if (command.blockType === "divider") {
        const emptyParagraph = createBlock("paragraph");
        dispatch(addBlock({ afterId: focusTargetId, block: emptyParagraph }));
        focusTargetId = emptyParagraph.id;
      }

      dispatch(setFocusedBlockId(focusTargetId));
      dispatch(closeSlashMenu());
    },
    [block, divRef, slashMenuMode, slashMenuStartIndex],
  );

  return { handleConfirm };
}
