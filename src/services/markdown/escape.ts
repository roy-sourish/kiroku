/**
 * Block-level escaping for Markdown export.
 *
 * Kiroku content is plain text. When we write it into a .md file, a line that
 * happens to START like Markdown block syntax ("# ", "> ", "- ", "1. ", "```",
 * "---" ...) would be read back as a different block. escapeLine puts a "\" in
 * front so Markdown treats it as literal text. unescapeLine is the exact inverse
 * (used by import).
 *
 * Rules:
 *  - Only the START of the line is inspected. Inline text (**bold**, a - b) is never touched.
 *  - Only lines that would really form block syntax are escaped (#hashtag stays as-is).
 *  - Precondition: leading whitespace is already trimmed (ExportService does this).
 */

/** Lines that become a different block if written as-is. Escaped by prefixing "\". */
const PREFIX_ESCAPE_PATTERNS: readonly RegExp[] = [
  /^#{1,6}(\s|$)/, //         heading:        "# Title", "###### x", "#"
  /^>/, //                     quote:          "> text"
  /^[-*+](\s|$)/, //           bullet list:    "- item", "* item", "+ item"
  /^(`{3,}|~{3,})/, //         code fence:     "```js", "~~~"
  /^(-+|=+)\s*$/, //           setext underline / divider: "---", "==="
  /^(\*\s*){3,}$/, //          divider:        "***", "* * *"
  /^(_\s*){3,}$/, //           divider:        "___"
  /^\\/, //                    line already starts with "\" → escape it too,
  //                           so unescapeLine can tell ours from the user's
];

/** "1. item" / "1) item" → the escape goes before the "." or ")". */
const ORDERED_LIST_PATTERN = /^(\d{1,9})([.)])(\s|$)/;

export function escapeLine(line: string): string {
  const ordered = ORDERED_LIST_PATTERN.exec(line);
  if (ordered) {
    const digits = ordered[1] ?? "";
    // "10. tenth" → "10" + "\" + ". tenth"
    return `${digits}\\${line.slice(digits.length)}`;
  }

  if (PREFIX_ESCAPE_PATTERNS.some((pattern) => pattern.test(line))) {
    return `\\${line}`;
  }

  return line;
}

export function unescapeLine(line: string): string {
  // Build the one candidate this line could have been escaped FROM...
  let candidate: string | null = null;

  if (line.startsWith("\\")) {
    candidate = line.slice(1); // "\# Title" → "# Title"
  } else {
    const match = /^(\d{1,9})\\([.)])/.exec(line);
    if (match) {
      const digits = match[1] ?? "";
      candidate = digits + line.slice(digits.length + 1); // "1\. a" → "1. a"
    }
  }

  // ...and only accept it if escaping it reproduces this exact line.
  // That makes unescapeLine the exact inverse of escapeLine, and it leaves
  // backslashes we didn't add (e.g. "\hello" from someone else's file) alone.
  if (candidate !== null && escapeLine(candidate) === line) {
    return candidate;
  }
  return line;
}