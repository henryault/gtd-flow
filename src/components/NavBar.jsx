import { useState, useRef } from 'react';
import { useItemsContext } from '../context/ItemsContext';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Badge';

const NAV_ITEMS = [
  { key: 'inbox', label: 'Inbox' },
  { key: 'next_actions', label: 'Next Actions' },
  { key: 'someday_maybe', label: 'Someday / Maybe' },
];

export function NavBar({ currentView, onNavigate }) {
  const { inboxItems, exportData, importData } = useItemsContext();
  const { signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gtd-flow-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      importData(evt.target.result);
      setShowMenu(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <nav className="flex items-center gap-1 px-4 py-3 bg-white border-b border-gray-200">
      <h1 className="text-lg font-semibold text-gray-800 mr-6">GTD Flow</h1>
      {NAV_ITEMS.map(({ key, label }) => {
        const isActive = currentView === key || (key === 'inbox' && currentView === 'clarify');
        const isSomeday = key === 'someday_maybe';

        return (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-gray-100 text-gray-900 shadow-sm'
                : isSomeday
                  ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {label}
            {key === 'inbox' && <Badge count={inboxItems.length} />}
          </button>
        );
      })}

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => onNavigate('notes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'notes'
              ? 'bg-gray-100 text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          title="Notes"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Notes
        </button>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
            <button
              onClick={handleExport}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Export data
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Import data
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <hr className="my-1 border-gray-100" />
            <button
              onClick={() => { signOut(); setShowMenu(false); }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
