import type React from "react";
import type { Block } from "../types";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useCallback } from "react";
import type { SlashCommand } from "../services/SlashParser";
import { closeSlashMenu } from "../store/uiSlice";

export function useSlashConfirm(
  block: Block,
  divRef: React.RefObject<HTMLDivElement | null>,
) {
  const dispatch = useAppDispatch();
  const slashMenuMode = useAppSelector((s) => s.ui.slashMenuMode);
  const slashMenuStartIndex = useAppSelector((s) => s.ui.slashMenuStartIndex);

  const handleConfirm = useCallback(
    (command: SlashCommand) => {
      if (slashMenuMode === "transform") {
        // transform path -
      } else {
        // insert path -
      }

      dispatch(closeSlashMenu());
    },
    [block, divRef, slashMenuMode, slashMenuStartIndex],
  );
}
