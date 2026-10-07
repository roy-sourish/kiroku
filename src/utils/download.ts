/**
 * Makes the browser download `text` as a file called `filename`.
 *
 * A web page can't write to disk directly, so we hand the browser an
 * in-memory file (a Blob) and click an invisible download link to it.
 */
export function downloadTextFile(
  filename: string,
  text: string,
  mimeType = "text/markdown;charset=utf-8",
): void {
  // 1. Wrap the text in an in-memory file
  const blob = new Blob([text], { type: mimeType });

  // 2. Give it a temporary address the browser can "download" from
  const url = URL.createObjectURL(blob);

  // 3. An invisible link with the `download` attribute, clicked from code
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link); // Firefox only clicks links that are in the page
  link.click();
  link.remove();

  // 4. Free the memory. Wait a moment first: revoking immediately can cancel
  //    the download in some browsers (older Safari) before it has started.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}