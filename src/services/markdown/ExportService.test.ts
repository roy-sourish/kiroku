import { describe, it, expect } from "vitest";
import { blockToMarkdown } from "./ExportService";
import type { Block, BlockProperties, BlockType } from "../../types";

// Test helper: builds a Block without repeating id/createdAt every time
function block(
  type: BlockType,
  content = "",
  properties?: BlockProperties,
): Block {
  return { id: "test-id", type, content, properties, createdAt: 0 };
}

describe("blockToMarkdown", () => {
  it("writes a paragraph as plain text", () => {
    expect(blockToMarkdown(block("paragraph", "Hello world"))).toBe(
      "Hello world",
    );
  });

  it("writes heading_1 with a single #", () => {
    expect(blockToMarkdown(block("heading_1", "Title"))).toBe("# Title");
  });

  // ✍️ Now you write these:
  // - heading_2 and heading_3
  it("writes heading_2 with a double #", () => {
    expect(blockToMarkdown(block("heading_2", "Title"))).toBe("## Title");
  });

  it("writes heading_3 with a triple #", () => {
    expect(blockToMarkdown(block("heading_3", "Title"))).toBe("### Title");
  });

  // - divider → "---"
  it("writes divider with a ---", () => {
    expect(blockToMarkdown(block("divider", ""))).toBe("---");
  });

  // - a paragraph containing "# not a heading" → escaped
  it("escapes a paragraph that looks like a heading", () => {
    expect(blockToMarkdown(block("paragraph", "# not a heading"))).toBe(
      "\\# not a heading",
    );
  });

  // - a paragraph with two lines ("line one\nline two"), where line two starts with "- "
  it("escapes each line of a multi-line paragraph separately", () => {
    expect(blockToMarkdown(block("paragraph", "line one\n- line two"))).toBe(
      "line one\n\\- line two",
    );
  });
  // - an empty paragraph → null (skipped)
  it("skips an empty paragraph", () => {
    expect(blockToMarkdown(block("paragraph", ""))).toBeNull();
  });

  // - a heading with a newline inside → newline becomes a space
  it("a heading with a newline inside → newline becomes a space", () => {
    expect(blockToMarkdown(block("heading_1", "hello\nworld"))).toBe(
      "# hello world",
    );
  });
  
  it("skips a paragraph that only contains spaces", () => {
    expect(blockToMarkdown(block("paragraph", "   "))).toBeNull();
  });

  // Trailing "#" in headings: Markdown treats it as an optional closing sequence and drops it
  it.each([
    ["Ends with #", "# Ends with \\#"], // trailing # after a space → escaped
    ["C #", "# C \\#"],
    ["Title ##", "# Title \\##"], // a run of #s → escape the run
    ["#", "# \\#"], // heading text that is only "#"
    ["Issue #42", "# Issue #42"], // # not at the end → unchanged
    ["C#", "# C#"], // no space before # → not a closing sequence → unchanged
  ])("heading_1 %j → %j", (content, expected) => {
    expect(blockToMarkdown(block("heading_1", content))).toBe(expected);
  });
});
