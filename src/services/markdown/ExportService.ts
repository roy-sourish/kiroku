import type { Block, Page } from "../../types";
import { escapeLine } from "./escape";
import { serializeFrontMatter } from "./frontMatter";

const HEADING_PREFIX = {
  heading_1: "#",
  heading_2: "##",
  heading_3: "###",
} as const;

/**
 * Converts ONE block to Markdown.
 * Returns null when the block should be skipped (it has no content).
 */
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
      const oneLine = block.content.replace(/\n/g, " ").trimEnd(); // every newline → a space
      // A "#" run at the very end would be read as an optional closing sequence and dropped
      const safe = oneLine.replace(/(^|\s)(#+)$/, "$1\\$2");
      return `${HEADING_PREFIX[block.type]} ${safe}`;
    }

    case "quote": {
      if (block.content.trim() === "") return null;
      return block.content
        .split("\n")
        .map((line) => {
          const text = line.trimStart();
          // An empty line must still start with ">", or it would END the quote
          return text === "" ? ">" : `> ${escapeLine(text)}`;
        })
        .join("\n");
    }

    case "todo": {
      // "- [ ]" with no text is not a task in GitHub Markdown, so skip empty todos
      if (block.content.trim() === "") return null;
      const marker = block.properties?.checked ? "- [x] " : "- [ ] ";
      return block.content
        .split("\n")
        .map((line, index) => {
          // First line gets the checkbox; the rest are indented 2 spaces to stay inside the item
          const prefix = index === 0 ? marker : "  ";
          return prefix + escapeLine(line.trimStart());
        })
        .join("\n");
    }

    case "code": {
      // The fence must be longer than any run of backticks inside the code
      const backtickRuns = block.content.match(/`+/g) ?? [];
      const longestRun = Math.max(0, ...backtickRuns.map((run) => run.length));
      const fence = "`".repeat(Math.max(3, longestRun + 1));

      const language = block.properties?.language;
      const info = language && language !== "plaintext" ? language : "";

      // Code content is written exactly as typed: no trimming, no escaping
      return `${fence}${info}\n${block.content}\n${fence}`;
    }

    case "divider":
      return "---";

    default: {
      const _exhaustiveCheck: never = block.type;
      void _exhaustiveCheck;
      return null;
    }
  }
}

/**
 * Converts a whole page to a Markdown file:
 * front matter, a blank line, then the blocks separated by blank lines,
 * ending with exactly one newline.
 */
export function exportToMarkdown(page: Page): string {
  const frontMatter = serializeFrontMatter({ title: page.title, icon: page.icon });

  const body = page.blocks
    .map(blockToMarkdown)
    .filter((markdown): markdown is string => markdown !== null) // drop skipped blocks
    .join("\n\n");

  return body === "" ? `${frontMatter}\n` : `${frontMatter}\n\n${body}\n`;
}