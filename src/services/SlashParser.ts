import type { BlockType } from "../types";

export interface SlashCommand {
  id: string;
  label: string;
  blockType: BlockType;
  aliases: string[];
  description: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "paragraph",
    label: "Text",
    blockType: "paragraph",
    aliases: ["text", "paragraph", "p"],
    description: "Plain text block",
  },
  {
    id: "heading_1",
    label: "Heading 1",
    blockType: "heading_1",
    aliases: ["heading", "h1", "h", "#"],
    description: "Heading 1 block",
  },
  {
    id: "heading_2",
    label: "Heading 2",
    blockType: "heading_2",
    aliases: ["heading", "h2", "h", "##"],
    description: "Heading 2 block",
  },
  {
    id: "heading_3",
    label: "Heading 3",
    blockType: "heading_3",
    aliases: ["heading", "h3", "h", "###"],
    description: "Heading 3 block",
  },
  {
    id: "todo",
    label: "Todo",
    blockType: "todo",
    aliases: ["todo", "list", "t", "checkbox", "check", "[", "]", "[]"],
    description: "Todo list item block",
  },
  {
    id: "quote",
    label: "Quote",
    blockType: "quote",
    aliases: ["quote", "q", "blockquote", ">"],
    description: "Quote block",
  },
  {
    id: "code",
    label: "Code",
    blockType: "code",
    aliases: ["code", "c", "script", "codeblock", "snippet"],
    description: "code block",
  },
  {
    id: "divider",
    label: "Divider",
    blockType: "divider",
    aliases: ["divider", "hr", "line", "---", "separator"],
    description: "Divider block",
  },
];

// Given the full block content, detect if a slash session is active
// Return null if content doesn't start with /
// Detects /ai prefix for Phase 6
export function parseSlashInput(
  content: string,
): { query: string; isAIPrompt: boolean } | null {
  // Case 1: doesn't start with / - not a slash session
  if (!content.startsWith("/")) return null;

  // Case 2: starts with "/ai " - AI prompt, Phase 6 will handle this
  if (content.startsWith("/ai ")) {
    return { query: content.slice(4), isAIPrompt: true };
  }

  // Case 3: everything else - strip the leading / and return the query
  return { query: content.slice(1), isAIPrompt: false };
}

// Given a query string return matching commands
// Empty string -> return everything
// Case insensitive, matcheds label and aliases
export function filterCommands(query: string): SlashCommand[] {
  if (query === "") return SLASH_COMMANDS;

  const normalisedQuery = query.toLocaleLowerCase();

  const matchingCommands = SLASH_COMMANDS.filter((command) => {
    if (command.label.toLowerCase().includes(normalisedQuery)) return true;

    return command.aliases.some((alias) => alias.includes(normalisedQuery));
  });

  return matchingCommands;
}
