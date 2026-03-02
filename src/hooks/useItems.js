import { useMemo, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '../utils/ids';
import { STATUS, STORAGE_KEY } from '../utils/constants';

export function useItems() {
  const [items, setItems] = useLocalStorage(STORAGE_KEY, []);

  const inboxItems = useMemo(
    () => items.filter(i => i.status === STATUS.INBOX),
    [items]
  );

  const nextActions = useMemo(
    () => items.filter(i => i.status === STATUS.NEXT_ACTION),
    [items]
  );

  const somedayMaybeItems = useMemo(
    () => items.filter(i => i.status === STATUS.SOMEDAY_MAYBE),
    [items]
  );

  const completedItems = useMemo(
    () => items.filter(i => i.status === STATUS.COMPLETED),
    [items]
  );

  const addItem = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setItems(prev => [
      {
        id: generateId(),
        text: trimmed,
        status: STATUS.INBOX,
        type: null,
        notes: null,
        createdAt: new Date().toISOString(),
        clarifiedAt: null,
        completedAt: null,
      },
      ...prev,
    ]);
  }, [setItems]);

  const clarifyAsTask = useCallback((id, newText, notes) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? {
            ...item,
            text: newText || item.text,
            notes: notes || item.notes || null,
            status: STATUS.NEXT_ACTION,
            type: 'task',
            clarifiedAt: new Date().toISOString(),
          }
        : item
    ));
  }, [setItems]);

  const clarifyAsOutcome = useCallback((id, newText, notes) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? {
            ...item,
            text: newText || item.text,
            notes: notes || item.notes || null,
            status: STATUS.NEXT_ACTION,
            type: 'outcome',
            clarifiedAt: new Date().toISOString(),
          }
        : item
    ));
  }, [setItems]);

  const sendToSomedayMaybe = useCallback((id) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? {
            ...item,
            status: STATUS.SOMEDAY_MAYBE,
            clarifiedAt: new Date().toISOString(),
          }
        : item
    ));
  }, [setItems]);

  const promoteToNextAction = useCallback((id) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, status: STATUS.NEXT_ACTION }
        : item
    ));
  }, [setItems]);

  const completeItem = useCallback((id) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? {
            ...item,
            status: STATUS.COMPLETED,
            completedAt: new Date().toISOString(),
          }
        : item
    ));
  }, [setItems]);

  const uncompleteItem = useCallback((id) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? {
            ...item,
            status: STATUS.NEXT_ACTION,
            completedAt: null,
          }
        : item
    ));
  }, [setItems]);

  const deleteItem = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, [setItems]);

  const editItemText = useCallback((id, newText) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, text: newText } : item
    ));
  }, [setItems]);

  const setItemNotes = useCallback((id, notes) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, notes } : item
    ));
  }, [setItems]);

  const setEstimatedTime = useCallback((id, minutes) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, estimatedMinutes: minutes || null } : item
    ));
  }, [setItems]);

  /**
   * Reorder an item within its status group.
   * direction: -1 = move up, 1 = move down.
   */
  const reorderItem = useCallback((id, direction) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;

      const statusIndices = [];
      prev.forEach((it, idx) => {
        if (it.status === item.status) statusIndices.push(idx);
      });

      const posInGroup = statusIndices.findIndex(idx => prev[idx].id === id);
      const swapPosInGroup = posInGroup + direction;
      if (swapPosInGroup < 0 || swapPosInGroup >= statusIndices.length) return prev;

      const idxA = statusIndices[posInGroup];
      const idxB = statusIndices[swapPosInGroup];

      const next = [...prev];
      next[idxA] = prev[idxB];
      next[idxB] = prev[idxA];
      return next;
    });
  }, [setItems]);

  /**
   * Move an item to a specific index within its status group (for drag-and-drop).
   */
  const moveItemToPosition = useCallback((id, toGroupIndex) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;

      const statusIndices = [];
      prev.forEach((it, idx) => {
        if (it.status === item.status) statusIndices.push(idx);
      });

      const fromGroupIndex = statusIndices.findIndex(idx => prev[idx].id === id);
      if (fromGroupIndex === toGroupIndex) return prev;

      // Remove item from array
      const next = prev.filter(i => i.id !== id);

      // Recalculate status indices after removal
      const newStatusIndices = [];
      next.forEach((it, idx) => {
        if (it.status === item.status) newStatusIndices.push(idx);
      });

      let insertAt;
      if (toGroupIndex >= newStatusIndices.length) {
        insertAt = newStatusIndices.length > 0
          ? newStatusIndices[newStatusIndices.length - 1] + 1
          : next.length;
      } else {
        insertAt = newStatusIndices[toGroupIndex];
      }

      next.splice(insertAt, 0, item);
      return next;
    });
  }, [setItems]);

  const exportData = useCallback(() => {
    return JSON.stringify(items, null, 2);
  }, [items]);

  const importData = useCallback((jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) return false;
      setItems(parsed);
      return true;
    } catch {
      return false;
    }
  }, [setItems]);

  return {
    items,
    inboxItems,
    nextActions,
    somedayMaybeItems,
    completedItems,
    addItem,
    clarifyAsTask,
    clarifyAsOutcome,
    sendToSomedayMaybe,
    promoteToNextAction,
    completeItem,
    uncompleteItem,
    deleteItem,
    editItemText,
    setItemNotes,
    setEstimatedTime,
    reorderItem,
    moveItemToPosition,
    exportData,
    importData,
  };
}
