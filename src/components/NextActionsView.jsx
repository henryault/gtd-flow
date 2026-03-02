import { useState, useCallback, useEffect, useRef } from 'react';
import { useItemsContext } from '../context/ItemsContext';
import { TaskItem } from './TaskItem';
import { EmptyState } from './EmptyState';

export function NextActionsView({ onNavigate }) {
  const { nextActions, completeItem, deleteItem, setEstimatedTime, setItemNotes, reorderItem, moveItemToPosition } = useItemsContext();
  const [selectedId, setSelectedId] = useState(() =>
    nextActions.length > 0 ? nextActions[0].id : null
  );
  const dragFromIdRef = useRef(null);
  const [dragOverState, setDragOverState] = useState(null);
  const containerRef = useRef(null);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  // Track whether the bullet editor inside a task is focused
  const editorFocusedRef = useRef(false);

  const nextActionsRef = useRef(nextActions);
  nextActionsRef.current = nextActions;

  const reorderItemRef = useRef(reorderItem);
  reorderItemRef.current = reorderItem;

  // Auto-select first item when list changes and nothing is selected
  useEffect(() => {
    if (nextActions.length > 0 && (!selectedId || !nextActions.find(i => i.id === selectedId))) {
      setSelectedId(nextActions[0].id);
    } else if (nextActions.length === 0) {
      setSelectedId(null);
    }
  }, [nextActions, selectedId]);

  // Keyboard handler — registered once, reads from refs
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept arrows when the bullet editor is focused
      if (editorFocusedRef.current) return;

      // Check if an input/textarea has focus — don't steal keys
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const sid = selectedIdRef.current;
      const actions = nextActionsRef.current;
      if (!sid || actions.length === 0) return;

      const isArrow = e.key === 'ArrowUp' || e.key === 'ArrowDown';
      if (!isArrow) {
        if (e.key === 'Escape') setSelectedId(null);
        return;
      }

      e.preventDefault();
      e.stopImmediatePropagation();

      const hasModifier = e.metaKey || e.ctrlKey || e.altKey || e.shiftKey;

      if (hasModifier) {
        reorderItemRef.current(sid, e.key === 'ArrowUp' ? -1 : 1);
      } else {
        const currentIndex = actions.findIndex(i => i.id === sid);
        if (currentIndex < 0) return;
        const nextIndex = e.key === 'ArrowUp'
          ? Math.max(0, currentIndex - 1)
          : Math.min(actions.length - 1, currentIndex + 1);
        setSelectedId(actions[nextIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // Click outside to deselect
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSelectedId(null);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
  }, []);

  const handleEditorFocusChange = useCallback((focused) => {
    editorFocusedRef.current = focused;
  }, []);

  const handleDragStart = useCallback((id) => {
    dragFromIdRef.current = id;
  }, []);

  const handleDragOver = useCallback((id, e) => {
    const fromId = dragFromIdRef.current;
    if (!fromId || fromId === id) {
      setDragOverState(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'above' : 'below';
    setDragOverState(prev => {
      if (prev && prev.id === id && prev.position === position) return prev;
      return { id, position };
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    dragFromIdRef.current = null;
    setDragOverState(null);
  }, []);

  const handleDrop = useCallback((targetId, e) => {
    const fromId = dragFromIdRef.current;
    if (!fromId || fromId === targetId) {
      handleDragEnd();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const dropBelow = e.clientY >= midY;

    const actions = nextActionsRef.current;
    let toIndex = actions.findIndex(i => i.id === targetId);
    if (toIndex < 0) { handleDragEnd(); return; }

    const fromIndex = actions.findIndex(i => i.id === fromId);

    if (dropBelow && fromIndex < toIndex) {
      // target index is correct
    } else if (dropBelow && fromIndex > toIndex) {
      toIndex += 1;
    } else if (!dropBelow && fromIndex > toIndex) {
      // target index is correct
    } else if (!dropBelow && fromIndex < toIndex) {
      toIndex -= 1;
    }

    toIndex = Math.max(0, Math.min(toIndex, actions.length - 1));
    moveItemToPosition(fromId, toIndex);
    handleDragEnd();
  }, [moveItemToPosition, handleDragEnd]);

  return (
    <div className="max-w-2xl mx-auto" ref={containerRef}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Next Actions</h2>
        <p className="text-sm text-gray-500">
          Your active tasks and outcomes.
          {selectedId && <span className="ml-2 text-blue-500">↑↓ navigate · Shift+↑↓ reorder</span>}
        </p>
      </div>

      {nextActions.length === 0 ? (
        <EmptyState
          title="No active actions"
          description="Capture ideas in your Inbox and clarify them into actions."
          actionLabel="Go to Inbox"
          onAction={() => onNavigate('inbox')}
        />
      ) : (
        <ul className="space-y-2">
          {nextActions.map((item) => (
            <TaskItem
              key={item.id}
              item={item}
              onComplete={completeItem}
              onDelete={deleteItem}
              onSetTime={setEstimatedTime}
              onSetNotes={setItemNotes}
              isSelected={selectedId === item.id}
              onSelect={handleSelect}
              isDragging={dragFromIdRef.current === item.id}
              dropIndicator={dragOverState && dragOverState.id === item.id ? dragOverState.position : null}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onEditorFocusChange={handleEditorFocusChange}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
