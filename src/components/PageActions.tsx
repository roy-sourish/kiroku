import { toast } from "react-toastify";
import { useAppSelector } from "../store/hooks";
import { exportToMarkdown } from "../services/markdown/ExportService";
import { toSafeFilename } from "../utils/filename";
import { downloadTextFile } from "../utils/download";

/**
 * Page-level actions shown next to the title: download or copy the page as Markdown.
 *
 * Note: the Markdown is built inside the click handlers, NOT during render.
 * This component re-renders on every keystroke (the page object changes),
 * and converting the whole page each time would be wasted work.
 */
export default function PageActions() {
  const activePage = useAppSelector((s) =>
    s.pages.list.find((p) => p.id === s.pages.activePageId),
  );

  if (!activePage) return null;

  const handleExport = () => {
    const markdown = exportToMarkdown(activePage);
    downloadTextFile(toSafeFilename(activePage.title), markdown);
  };

  const handleCopy = async () => {
    try {
      // Can be refused: no permission, or the page isn't on https/localhost
      await navigator.clipboard.writeText(exportToMarkdown(activePage));
      toast.success("Copied page as Markdown");
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  return (
    <div className="flex shrink-0 gap-1">
      <button
        type="button"
        onClick={handleCopy}
        className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      >
        Copy as Markdown
      </button>
      <button
        type="button"
        onClick={handleExport}
        className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      >
        Export .md
      </button>
    </div>
  );
}