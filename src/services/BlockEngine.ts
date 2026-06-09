import { nanoid } from "nanoid";
import type { Block, BlockType, BlockProperties } from "../types";

export function createBlock(
  type: BlockType,
  content?: string,
  properties?: BlockProperties,
): Block {
  // Divider block have no content or properties
  if (type === "divider") {
    return {
      id: nanoid(),
      type,
      content: "",
      properties: undefined,
      createdAt: Date.now(),
    };
  }

  const defaults = defaultPropertiesFor(type);

  const resolvedProperties: BlockProperties | undefined =
    defaults || properties ? { ...defaults, ...properties } : undefined;

  return {
    id: nanoid(),
    type,
    content: content ?? "",
    properties: resolvedProperties,
    createdAt: Date.now(),
  };
}

export function defaultPropertiesFor(
  type: BlockType,
): BlockProperties | undefined {
  switch (type) {
    case "todo":
      return { checked: false };
    case "code":
      return { language: "plaintext" };
    default:
      return undefined;
  }
}
