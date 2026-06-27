import EditorCanvas from "./components/EditorCanvas";
import Sidebar from "./components/Sidebar";

export default function App() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        Kiroku <span className="text-sm font-normal text-gray-500">記録</span>
      </header>

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
  );
}
