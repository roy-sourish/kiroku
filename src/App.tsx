import EditorCanvas from "./components/EditorCanvas";
import Sidebar from "./components/Sidebar";
import { ToastContainer } from "react-toastify";
import { useAppSelector } from "./store/hooks";

export default function App() {
  const storageStatus = useAppSelector((s) => s.ui.storageStatus);

  return (
    <>
      <ToastContainer />
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          Kiroku <span className="text-sm font-normal text-gray-500">記録</span>
        </header>
        {storageStatus === "load-failed" && (
          <div
            role="alert"
            className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-900"
          >
            Couldn't load your notes. Changes in this session won't be saved.
            Reload to try again.
          </div>
        )}
        {storageStatus === "save-failed" && (
          <div
            role="alert"
            className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-900"
          >
            Your latest changes couldn’t be saved. Kiroku will retry on your
            next edit. Use Export .md to keep a copy.
          </div>
        )}
        {/* Main layout: Sidebar + Editor */}
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <div className="mb-4">
              <Sidebar />
            </div>
          </aside>

          <main className="flex-1 overflow-hidden flex">
            <EditorCanvas />
          </main>
        </div>
      </div>
    </>
  );
}
