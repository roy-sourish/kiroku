import { describe, it, expect } from "vitest";
import { toSafeFilename } from "./filename";

describe("toSafeFilename", () => {
  it.each([
    // [title, expected filename]
    ["Groceries", "Groceries.md"], // normal title → just add .md
    ["Weekend shopping 🛒", "Weekend shopping 🛒.md"], // spaces and emoji are fine
    ["Q4: plans?", "Q4- plans-.md"], // ":" and "?" are forbidden on Windows
    ["a/b\\c", "a-b-c.md"], // slashes would create folders
    ['<"x"|*>', "--x----.md"], // every forbidden char is replaced
    ["Notes...", "Notes.md"], // trailing dots are stripped
    ["  padded  ", "padded.md"], // surrounding spaces are trimmed
    ["", "untitled.md"], // empty title → fallback
    ["...", "untitled.md"], // only dots → nothing left → fallback
    ["CON", "_CON.md"], // reserved device name
    ["lpt1", "_lpt1.md"], // reserved names are case-insensitive
    ["CONTACT", "CONTACT.md"], // only the EXACT name is reserved
  ])("toSafeFilename(%j) → %j", (title, expected) => {
    expect(toSafeFilename(title)).toBe(expected);
  });

  it("caps very long titles at 100 characters", () => {
    expect(toSafeFilename("a".repeat(300))).toBe(`${"a".repeat(100)}.md`);
  });

  it("never cuts an emoji in half when capping", () => {
    const name = toSafeFilename("😀".repeat(150));
    expect(name).toBe(`${"😀".repeat(100)}.md`);
  });
});