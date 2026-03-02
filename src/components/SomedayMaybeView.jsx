import { useItemsContext } from '../context/ItemsContext';
import { TaskItem } from './TaskItem';
import { EmptyState } from './EmptyState';

export function SomedayMaybeView() {
  const { somedayMaybeItems, promoteToNextAction, deleteItem } = useItemsContext();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Someday / Maybe</h2>
        <p className="text-sm text-gray-500">
          Items on hold. Review periodically and activate when ready.
        </p>
      </div>

      {somedayMaybeItems.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="Items you defer during clarification will show up here."
        />
      ) : (
        <ul className="space-y-2">
          {somedayMaybeItems.map((item) => (
            <TaskItem
              key={item.id}
              item={item}
              onComplete={() => promoteToNextAction(item.id)}
              onDelete={deleteItem}
              onPromote={promoteToNextAction}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
