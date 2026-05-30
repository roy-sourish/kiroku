import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { createPage } from "./store/pageSlice";
import EditorCanvas from "./components/EditorCanvas";

export default function App() {
  const dispatch = useAppDispatch();
  const hasPage = useAppSelector((state) => state.pages.list.length > 0);

  // Bootstrap: Create default page if none exists
  useEffect(() => {
    if (!hasPage) {
      dispatch(createPage());
    }
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        Kiroku <span className="text-sm font-normal text-gray-500">記録</span>
      </header>

      {/* Main layout: Sidebar + Editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Placeholder */}
        <aside className="w-64 bg-gray-50 border-r border-gray-200 p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Pages</h2>
            <div className="text-xs text-gray-500 italic">
              Page list will appear here in Phase 4
            </div>
          </div>
        </aside>

        {/* Editor Placeholder */}
        <main className="flex-1 overflow-hidden flex">
          <EditorCanvas />
        </main>
      </div>
    </div>
  );
}
