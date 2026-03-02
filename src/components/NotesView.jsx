import { useState, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { BulletEditor } from './BulletEditor';

const NOTES_STORAGE_KEY = 'gtd-notes';

export function NotesView() {
  const [savedTree, setSavedTree] = useLocalStorage(NOTES_STORAGE_KEY, null);

  // Initialize tree: use saved data or a single empty block
  const [initialTree] = useState(() => {
    if (savedTree && Array.isArray(savedTree) && savedTree.length > 0) {
      return savedTree;
    }
    return [BulletEditor.createBlock('')];
  });

  const handleChange = useCallback((tree) => {
    setSavedTree(tree);
  }, [setSavedTree]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Notes</h2>
        <p className="text-sm text-gray-500">
          Free-write with nested bullets. Tab to indent, Shift+Tab to unindent, Cmd+↑ to collapse.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <BulletEditor initialTree={initialTree} onChange={handleChange} />
      </div>
    </div>
  );
}
