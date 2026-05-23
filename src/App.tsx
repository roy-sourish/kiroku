export default function App() {
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
        <main className="flex-1 bg-white p-8 overflow-auto">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to kiroku
            </h2>
            <p className="text-gray-600 mb-6">
              Block-based note editor - Foundation complete! ✅
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Phase 1: Foundation - Complete! 🎉
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Project setup (Vite + React + TypeScript)</li>
                <li>✅ Folder structure (layered architecture)</li>
                <li>✅ TypeScript interfaces (Page, Block, types)</li>
                <li>✅ Redux store (3 slices configured)</li>
                <li>✅ StorageService (IndexedDB wrapper)</li>
                <li>✅ App shell layout</li>
              </ul>
              <p className="text-sm text-blue-700 mt-3 font-medium">
                Next: Phase 2 - Core Editing (Week 2)
              </p>
            </div>
            <div className="mt-8 p-4 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                Editor canvas will appear here in Phase 2
              </p>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}
