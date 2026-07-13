import type { BlockIntent, BlockType } from "../../shared/types";

const VALID_TYPES: BlockType[] = [
  "paragraph",
  "heading_1",
  "heading_2",
  "heading_3",
  "code",
  "todo",
  "quote",
  "divider",
];

export function validateBlocks(data: unknown): BlockIntent[] {
  if (!Array.isArray(data)) {
    throw new Error(`Expected an array of blocks, got ${typeof data}`);
  }
  const blocks: BlockIntent[] = [];

  for (const item of data) {
    if (item === null || typeof item !== "object") {
      throw new Error(
        `Expected a block object, got ${item === null ? "null" : typeof item}`,
      );
    }
    const candidate = item as Record<string, unknown>;

    if (
      typeof candidate.type !== "string" ||
      !VALID_TYPES.includes(candidate.type as BlockType)
    ) {
      throw new Error(`Invalid block type: ${String(candidate.type)}`);
    }

    if (typeof candidate.content !== "string") {
      throw new Error(
        `Block content must be a string, got ${typeof candidate.content}`,
      );
    }

    blocks.push({
      type: candidate.type as BlockType,
      content: candidate.content,
    });
  }

  if (blocks.length === 0) {
    throw new Error("Response contained no valid blocks");
  }

  return blocks;
}
