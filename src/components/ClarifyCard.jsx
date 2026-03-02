import { useState, useCallback } from 'react';
import { BulletEditor } from './BulletEditor';

export function ClarifyCard({ item, onClarifyAsTask, onClarifyAsOutcome, onSendToSomedayMaybe, onDelete, onSkip }) {
  const [initialTree] = useState(() => BulletEditor.treeFromItem(item));
  const [currentTree, setCurrentTree] = useState(initialTree);

  const handleTreeChange = useCallback((tree) => {
    setCurrentTree(tree);
  }, []);

  /** Flatten tree into a readable text summary (first block = title, rest = notes) */
  const getTextFromTree = () => {
    const flat = BulletEditor.flattenTree(currentTree);
    if (flat.length === 0) return item.text;
    return flat[0].block.text || item.text;
  };

  const handleClarifyAsTask = () => {
    onClarifyAsTask(item.id, getTextFromTree(), currentTree);
  };

  const handleClarifyAsOutcome = () => {
    onClarifyAsOutcome(item.id, getTextFromTree(), currentTree);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-lg mx-auto">
      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
        Clarify this item
      </label>

      <div className="border border-gray-200 rounded-lg p-3 mb-6 min-h-[120px] bg-gray-50/50">
        <BulletEditor
          initialTree={initialTree}
          onChange={handleTreeChange}
        />
      </div>

      <div className="space-y-3">
        <button
          onClick={handleClarifyAsTask}
          className="w-full px-4 py-3 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors text-left"
        >
          <span className="block font-semibold">Next Action</span>
          <span className="block text-blue-200 text-xs mt-0.5">Concrete task — takes under 1 hour</span>
        </button>

        <button
          onClick={handleClarifyAsOutcome}
          className="w-full px-4 py-3 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors text-left"
        >
          <span className="block font-semibold">Outcome</span>
          <span className="block text-purple-200 text-xs mt-0.5">Larger goal — takes over 1 hour</span>
        </button>

        <button
          onClick={() => onSendToSomedayMaybe(item.id)}
          className="w-full px-4 py-3 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors text-left"
        >
          <span className="block font-semibold">Someday / Maybe</span>
          <span className="block text-gray-400 text-xs mt-0.5">Not actionable right now — revisit later</span>
        </button>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={onSkip}
          className="flex-1 px-4 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip for now
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="px-4 py-2 text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-300 rounded-lg transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
