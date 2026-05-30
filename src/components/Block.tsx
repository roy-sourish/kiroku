import type { Block } from "../types";
import ParagraphBlock from "./blocks/ParagraphBlock";

interface BlockProps {
  block: Block;
  previousBlockId: string | null;
  isOnlyBlock: boolean;
}

export default function Block({
  block,
  previousBlockId,
  isOnlyBlock,
}: BlockProps) {
  switch (block.type) {
    case "paragraph":
      return (
        <ParagraphBlock
          block={block}
          previousBlockId={previousBlockId}
          isOnlyBlock={isOnlyBlock}
        />
      );

    case "heading_1":
    case "heading_2":
    case "heading_3":
    case "quote":
    case "todo":
    case "code":
      return (
        <ParagraphBlock
          block={block}
          previousBlockId={previousBlockId}
          isOnlyBlock={isOnlyBlock}
        />
      );

    case "divider":
      return <hr className="border-gray-200 my-2" />;

    default: {
      /* This is a never trick, if a new BlockType to the union and forget 
        to add it to the switch TypeScript will error on this line 
        block.type can't be assigned to never, if there's a case you haven't handled
       */
      const _exhaustiveCheck: never = block.type;
      void _exhaustiveCheck;
      return null;
    }
  }
}
