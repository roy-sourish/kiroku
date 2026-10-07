/** Characters Windows forbids in filenames, plus control characters (\x00–\x1F). */
// eslint-disable-next-line no-control-regex
const FORBIDDEN_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;

/** Names Windows reserves for devices. "con.md" cannot be created on Windows. */
const RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

const MAX_LENGTH = 100;
const FALLBACK = "untitled";

/**
 * Turns a page title into a filename that every OS accepts.
 * "Q4: plans?" → "Q4- plans-.md"
 */
export function toSafeFilename(title: string): string {
  let name = title
    .replace(FORBIDDEN_CHARS, "-") // 1. forbidden characters → "-"
    .trim()
    .replace(/[. ]+$/, ""); // 2. Windows silently strips trailing dots/spaces

  // 3. Cap the length. Array.from splits by characters (code points), so an
  //    emoji is never cut in half the way .slice() on the raw string could.
  name = Array.from(name).slice(0, MAX_LENGTH).join("").trimEnd();

  if (name === "") name = FALLBACK; // 4. nothing left → fallback
  if (RESERVED_NAMES.test(name)) name = `_${name}`; // 5. "CON" → "_CON"

  return `${name}.md`;
}