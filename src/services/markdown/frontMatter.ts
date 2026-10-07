/**
 * Page metadata written at the top of an exported .md file:
 *
 *   ---
 *   title: "Groceries"
 *   icon: "🛒"
 *   ---
 *
 * Values go through JSON.stringify, which quotes and escapes them. A JSON
 * string is also a valid YAML string, so titles with ":" or '"' are safe.
 */
export function serializeFrontMatter(meta: { title: string; icon: string }): string {
  return [
    "---",
    `title: ${JSON.stringify(meta.title)}`,
    `icon: ${JSON.stringify(meta.icon)}`,
    "---",
  ].join("\n");
}