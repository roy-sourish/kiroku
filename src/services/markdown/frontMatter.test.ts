import { describe, it, expect } from "vitest";
import { serializeFrontMatter } from "./frontMatter";

describe("serializeFrontMatter", () => {
  it("writes title and icon between --- lines", () => {
    expect(serializeFrontMatter({ title: "Groceries", icon: "🛒" })).toBe(
      '---\ntitle: "Groceries"\nicon: "🛒"\n---',
    );
  });

  it("survives a title with a colon and quotes", () => {
    // Unquoted, "Meeting: Q4" would break YAML. JSON.stringify quotes and escapes it.
    expect(serializeFrontMatter({ title: 'Meeting: "Q4"', icon: "📄" })).toBe(
      '---\ntitle: "Meeting: \\"Q4\\""\nicon: "📄"\n---',
    );
  });
});