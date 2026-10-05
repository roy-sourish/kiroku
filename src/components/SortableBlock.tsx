import { useSortable } from "@dnd-kit/react/sortable";
import type { Block as BlockData } from "../types";
import Block from "./Block";
import { useAppSelector } from "../store/hooks";

interface SortableBlockProps {
  block: BlockData;
  index: number;
  previousBlockId: string | null;
  isOnlyBlock: boolean;
}

export default function SortableBlock({
  block,
  index,
  previousBlockId,
  isOnlyBlock,
}: SortableBlockProps) {
  const aiLoading = useAppSelector((s) => s.ui.aiLoading);
  const { ref, handleRef, isDragging } = useSortable({
    id: block.id,
    index,
    disabled: aiLoading,
  });

  return (
    <div
      ref={ref}
      className={`group relative ${isDragging ? "opacity-50" : ""}`}
    >
      <button
        ref={handleRef}
        type="button"
        aria-label="Drag to reorder block"
        disabled={aiLoading}
        className={`absolute -left-8 top-1 px-1 text-gray-400 rounded ${
          aiLoading
            ? "cursor-not-allowed opacity-0 group-hover:opacity-30"
            : "cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-gray-100"
        }`}
      >
        ⠿
      </button>
      <Block
        block={block}
        previousBlockId={previousBlockId}
        isOnlyBlock={isOnlyBlock}
      />
    </div>
  );
}
