import { nanoid } from "nanoid";
import { createBlock } from "./BlockEngine";
import type { Page } from "../types";

/**
 * Creates a blank page with a default paragraph block
 * @returns Page Object
 */
export function createBlankPage(): Page {
  const firstBlock = createBlock("paragraph");

  return {
    id: nanoid(),
    title: "Untitled",
    icon: "📄",
    blocks: [firstBlock],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
