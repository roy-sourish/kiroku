import { describe, it, expect } from "vitest";
import { escapeLine, unescapeLine } from "./escape";

// [input, expected escapeLine(input)]
const cases: [string, string][] = [
  // --- Must escape: Markdown would turn the line into a different block ---

  // Headings: 1–6 "#" followed by a space (or nothing)
  ["# Title", "\\# Title"],
  ["## Title", "\\## Title"],
  ["###### Title", "\\###### Title"],
  ["#", "\\#"], // a lone "#" is an empty heading

  // Quote
  ["> not a quote", "\\> not a quote"],

  // Bullet lists: "-", "*" or "+" followed by a space
  ["- item", "\\- item"],
  ["* item", "\\* item"],
  ["+ item", "\\+ item"],

  // Numbered lists: the escape goes before the "." or ")"
  ["1. first", "1\\. first"],
  ["10. tenth", "10\\. tenth"],
  ["1) first", "1\\) first"],

  // Code fences
  ["```js", "\\```js"],
  ["~~~", "\\~~~"],

  // Divider / heading-underline lines
  ["---", "\\---"],
  ["***", "\\***"],
  ["___", "\\___"],
  ["===", "\\==="],

  // A line that already starts with "\" gets one more, so import can undo it exactly
  ["\\# typed with a backslash", "\\\\# typed with a backslash"],

  // --- Must NOT change: looks close to syntax, but Markdown reads it as plain text ---
  ["#heading", "#heading"], // no space after # → not a heading
  ["####### seven", "####### seven"], // 7 #s → headings only go up to 6
  ["-5 degrees", "-5 degrees"], // no space after - → not a list
  ["2024 was good", "2024 was good"], // number without "." or ")" → not a list
  ["1.5 kg of rice", "1.5 kg of rice"], // "." not followed by a space → not a list
  ["**bold text**", "**bold text**"], // inline bold is intentional; we never escape inline
  ["a - b", "a - b"], // "-" isn't at the start of the line
  ["hello world", "hello world"], // ordinary text
  ["", ""], // empty line
];

describe("escapeLine", () => {
  it.each(cases)("escapeLine(%j) → %j", (input, expected) => {
    expect(escapeLine(input)).toBe(expected);
  });
});

describe("unescapeLine", () => {
  // The inverse property: whatever escapeLine produces, unescapeLine undoes exactly.
  it.each(cases)("unescapeLine(escapeLine(%j)) gives the original", (input) => {
    expect(unescapeLine(escapeLine(input))).toBe(input);
  });

  it.each([
    ["\\hello", "\\hello"], // a backslash we didn't add (e.g. from another app's file) is kept
    ["plain text", "plain text"],
  ])("unescapeLine(%j) → %j", (input, expected) => {
    expect(unescapeLine(input)).toBe(expected);
  });
});