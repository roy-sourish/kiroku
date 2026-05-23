/**
 * Core block types supported by the editor
 * Each type maps to a specific  UI component and behaviour
 */

export type BlockType =
  | "paragraph"
  | "heading_1"
  | "heading_2"
  | "heading_3"
  | "code"
  | "quote"
  | "todo"
  | "divider";

/**
 * Type-specific properties for blocks
 * Only certain fields are valid for certain blocks
 */

export interface BlockProperties {
  // Code blocks only
  language?: string;

  // Todo blocks only
  checked?: boolean;

  // AI-generated blocks (any type)
  aiGenerated?: boolean;
}

/**
 * A single block in the editor
 * Blocks are the atomic units of content
 */

export interface Block {
  id: string; // Unique identifier (nanoid)
  type: BlockType; // Determines rendering behaviour
  content: string; // Text content - empty for divider
  properties?: BlockProperties; // Type-specific metadata
  createdAt: number; // Unix timestamp
}

/**
 * A Page containing an ordered list of blocks
 * Pages are top level organizational unit
 */

export interface Page {
  id: string; // Unique Identifier (nanoid)
  title: string; // Display name (default : "Untitled")
  icon: string; // Single emoji character
  blocks: Block[];  // Ordered array of content blocks
  createdAt: number;  // Unique timestamp
  updatedAt: number;  // Updates when block changes
}
