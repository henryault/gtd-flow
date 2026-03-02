import { useItemsContext } from '../context/ItemsContext';
import { TextInput } from './TextInput';
import { VoiceInputButton } from './VoiceInputButton';
import { EmptyState } from './EmptyState';

export function InboxView({ onNavigate }) {
  const { inboxItems, addItem } = useItemsContext();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Inbox</h2>
        <p className="text-sm text-gray-500">Capture everything. Clarify later.</p>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="flex-1">
          <TextInput onSubmit={addItem} autoFocus />
        </div>
        <VoiceInputButton onCapture={addItem} />
      </div>

      {inboxItems.length > 0 && (
        <button
          onClick={() => onNavigate('clarify')}
          className="w-full mb-6 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-100 transition-colors"
        >
          Clarify {inboxItems.length} item{inboxItems.length !== 1 ? 's' : ''} →
        </button>
      )}

      {inboxItems.length === 0 ? (
        <EmptyState
          title="Inbox is empty"
          description="Capture a thought, task, or idea using the input above."
        />
      ) : (
        <ul className="space-y-2">
          {inboxItems.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg"
            >
              <span className="text-sm text-gray-700">{item.text}</span>
              <span className="text-xs text-gray-400 ml-4 shrink-0">
                {formatRelativeTime(item.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatRelativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
