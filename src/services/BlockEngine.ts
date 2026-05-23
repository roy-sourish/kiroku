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

  // Todo blocks default to unchecked if the caller didn't specify
  const resolvedProperties: BlockProperties | undefined =
    type === "todo" 
    ? { checked: false, ...properties } 
    : properties;


  return {
    id: nanoid(),
    type,
    content: content ?? "",
    properties: resolvedProperties,
    createdAt: Date.now(),
  };
}
