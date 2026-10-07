import { describe, it, expect } from "vitest";
import { blockToMarkdown, exportToMarkdown } from "./ExportService";
import type { Block, BlockProperties, BlockType, Page } from "../../types";

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

  // ---------------------------------------------------------------------------
  // Step B: quote
  // ---------------------------------------------------------------------------
  describe("blockToMarkdown — quote", () => {
    it("prefixes a single line with '> '", () => {
      expect(blockToMarkdown(block("quote", "Stay hungry"))).toBe(
        "> Stay hungry",
      );
    });

    it("prefixes EVERY line, not just the first", () => {
      expect(blockToMarkdown(block("quote", "Stay hungry\nStay foolish"))).toBe(
        "> Stay hungry\n> Stay foolish",
      );
    });

    it("writes an empty line inside a quote as a bare '>'", () => {
      // Without the bare ">", the blank line would END the quote
      expect(
        blockToMarkdown(block("quote", "Stay hungry\n\nStay foolish")),
      ).toBe("> Stay hungry\n>\n> Stay foolish");
    });

    it("escapes a line inside the quote that looks like syntax", () => {
      // "> - x" would be a list INSIDE the quote
      expect(blockToMarkdown(block("quote", "- not a list"))).toBe(
        "> \\- not a list",
      );
    });

    it("trims leading spaces on each line", () => {
      expect(blockToMarkdown(block("quote", "   indented"))).toBe("> indented");
    });

    it("skips an empty quote", () => {
      expect(blockToMarkdown(block("quote", ""))).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Step B: todo
  // ---------------------------------------------------------------------------
  describe("blockToMarkdown — todo", () => {
    it("writes an unchecked todo as '- [ ] '", () => {
      expect(
        blockToMarkdown(block("todo", "Buy milk", { checked: false })),
      ).toBe("- [ ] Buy milk");
    });

    it("writes a checked todo as '- [x] '", () => {
      expect(
        blockToMarkdown(block("todo", "Buy milk", { checked: true })),
      ).toBe("- [x] Buy milk");
    });

    it("treats missing properties as unchecked", () => {
      expect(blockToMarkdown(block("todo", "Buy milk"))).toBe("- [ ] Buy milk");
    });

    it("indents continuation lines by 2 spaces so they stay inside the item", () => {
      expect(blockToMarkdown(block("todo", "first line\nsecond line"))).toBe(
        "- [ ] first line\n  second line",
      );
    });

    it("escapes a continuation line that looks like syntax", () => {
      // Without the escape, "- nested?" would become a NESTED list item
      expect(blockToMarkdown(block("todo", "first\n- nested?"))).toBe(
        "- [ ] first\n  \\- nested?",
      );
    });

    it("skips an empty todo", () => {
      // "- [ ]" with no text is NOT a task in GitHub Markdown — it becomes the
      // literal text "[ ]". Skipping is the honest option (see lossiness table).
      expect(blockToMarkdown(block("todo", "", { checked: false }))).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Step C: code
  // ---------------------------------------------------------------------------
  describe("blockToMarkdown — code", () => {
    it("wraps code in a fence with its language", () => {
      expect(
        blockToMarkdown(
          block("code", "const a = 1;", { language: "typescript" }),
        ),
      ).toBe("```typescript\nconst a = 1;\n```");
    });

    it("writes a bare fence for language 'plaintext'", () => {
      expect(
        blockToMarkdown(block("code", "hello", { language: "plaintext" })),
      ).toBe("```\nhello\n```");
    });

    it("writes a bare fence when there are no properties", () => {
      expect(blockToMarkdown(block("code", "hello"))).toBe("```\nhello\n```");
    });

    it("never escapes code content", () => {
      expect(
        blockToMarkdown(block("code", "# not a heading\n- not a list")),
      ).toBe("```\n# not a heading\n- not a list\n```");
    });

    it("keeps indentation inside code (no trimming!)", () => {
      expect(
        blockToMarkdown(
          block("code", "def f():\n    return 1", { language: "python" }),
        ),
      ).toBe("```python\ndef f():\n    return 1\n```");
    });

    it("uses a 4-backtick fence when the code contains ```", () => {
      expect(blockToMarkdown(block("code", "a ``` b"))).toBe(
        "````\na ``` b\n````",
      );
    });

    it("uses a 5-backtick fence when the code contains ````", () => {
      expect(blockToMarkdown(block("code", "a ```` b"))).toBe(
        "`````\na ```` b\n`````",
      );
    });

    it("keeps an empty code block", () => {
      expect(blockToMarkdown(block("code", ""))).toBe("```\n\n```");
    });
  });

  // ---------------------------------------------------------------------------
  // Step D: the whole page
  // ---------------------------------------------------------------------------
  function page(blocks: Block[], title = "Groceries", icon = "🛒"): Page {
    return { id: "page-id", title, icon, blocks, createdAt: 0, updatedAt: 0 };
  }

  describe("exportToMarkdown", () => {
    it("writes front matter, then blocks separated by a blank line, ending with one newline", () => {
      const md = exportToMarkdown(
        page([
          block("heading_1", "Weekend shopping"),
          block("todo", "Milk", { checked: true }),
          block("paragraph", "Buy from the corner shop"),
        ]),
      );

      expect(md).toBe(
        [
          "---",
          'title: "Groceries"',
          'icon: "🛒"',
          "---",
          "",
          "# Weekend shopping",
          "",
          "- [x] Milk",
          "",
          "Buy from the corner shop",
          "",
        ].join("\n"),
      );
    });

    it("leaves no gap where an empty paragraph was skipped", () => {
      const md = exportToMarkdown(
        page([
          block("paragraph", "one"),
          block("paragraph", ""),
          block("paragraph", "two"),
        ]),
      );
      expect(md).toContain("one\n\ntwo");
      expect(md).not.toContain("one\n\n\n");
    });

    it("writes only the front matter for a page with nothing in it", () => {
      expect(exportToMarkdown(page([block("paragraph", "")]))).toBe(
        '---\ntitle: "Groceries"\nicon: "🛒"\n---\n',
      );
    });
  });
});
