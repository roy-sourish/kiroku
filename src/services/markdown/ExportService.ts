import type { Block } from "../../types";
import { escapeLine } from "./escape";

const HEADING_PREFIX = {
  heading_1: "#",
  heading_2: "##",
  heading_3: "###",
} as const;

export function blockToMarkdown(block: Block): string | null {
  switch (block.type) {
    case "paragraph": {
      if (block.content.trim() === "") return null;
      return block.content
        .split("\n")
        .map((line) => escapeLine(line.trimStart()))
        .join("\n");
    }
    case "heading_1":
    case "heading_2":
    case "heading_3": {
      const oneLine = block.content.replace(/\n/g, " ").trimEnd(); // every new line with a space
      const safe = oneLine.replace(/(^|\s)(#+)$/, "$1\\$2");
      return `${HEADING_PREFIX[block.type]} ${safe}`;
    }
    case "divider":
      return "---";
    case "quote":
    case "todo":
    case "code":
      return null; // TODO: Step B and C

    default: {
      const _exhaustiveCheck: never = block.type;
      void _exhaustiveCheck;
      return null;
    }
  }
}
