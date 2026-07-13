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

export interface BlockIntent {
  type: BlockType;
  content: string;
  properties?: BlockProperties;
}
