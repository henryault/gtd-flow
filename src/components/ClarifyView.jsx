import { useState, useRef } from 'react';
import { useItemsContext } from '../context/ItemsContext';
import { ClarifyCard } from './ClarifyCard';

export function ClarifyView({ onNavigate }) {
  const { inboxItems, clarifyAsTask, clarifyAsOutcome, sendToSomedayMaybe, deleteItem } =
    useItemsContext();
  const [skippedIds, setSkippedIds] = useState(new Set());
  const processedCountRef = useRef(0);

  const unskippedItems = inboxItems.filter((item) => !skippedIds.has(item.id));
  const currentItem = unskippedItems[0];
  const totalItems = processedCountRef.current + unskippedItems.length;

  const handleAction = () => {
    processedCountRef.current += 1;
  };

  const handleClarifyAsTask = (id, text, notes) => {
    clarifyAsTask(id, text, notes);
    handleAction();
  };

  const handleClarifyAsOutcome = (id, text, notes) => {
    clarifyAsOutcome(id, text, notes);
    handleAction();
  };

  const handleSendToSomedayMaybe = (id) => {
    sendToSomedayMaybe(id);
    handleAction();
  };

  const handleDelete = (id) => {
    deleteItem(id);
    handleAction();
  };

  const handleSkip = () => {
    if (currentItem) {
      setSkippedIds((prev) => new Set(prev).add(currentItem.id));
    }
  };

  if (!currentItem) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="text-5xl mb-4">&#10003;</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">All caught up!</h2>
        <p className="text-sm text-gray-500 mb-6">
          {processedCountRef.current > 0
            ? `You clarified ${processedCountRef.current} item${processedCountRef.current !== 1 ? 's' : ''}.`
            : 'No items to clarify.'}
        </p>
        <button
          onClick={() => onNavigate('next_actions')}
          className="px-6 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
        >
          Go to Next Actions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Clarify</h2>
        <p className="text-sm text-gray-500">
          Item {processedCountRef.current + 1} of {totalItems}
        </p>
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{
              width: `${totalItems > 0 ? (processedCountRef.current / totalItems) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <ClarifyCard
        key={currentItem.id}
        item={currentItem}
        onClarifyAsTask={handleClarifyAsTask}
        onClarifyAsOutcome={handleClarifyAsOutcome}
        onSendToSomedayMaybe={handleSendToSomedayMaybe}
        onDelete={handleDelete}
        onSkip={handleSkip}
      />
    </div>
  );
}
