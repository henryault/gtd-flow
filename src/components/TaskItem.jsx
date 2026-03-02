import { useState, useCallback, useRef } from 'react';
import { BulletEditor } from './BulletEditor';

export function TaskItem({
  item,
  onComplete,
  onDelete,
  onPromote,
  onSetTime,
  onSetNotes,
  isSelected,
  onSelect,
  isDragging,
  dropIndicator,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onEditorFocusChange,
}) {
  const [confirming, setConfirming] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [timeInput, setTimeInput] = useState(item.estimatedMinutes || '');
  const [expanded, setExpanded] = useState(false);
  const editorContainerRef = useRef(null);

  const handleTimeSave = () => {
    const mins = parseInt(timeInput, 10);
    if (onSetTime) {
      onSetTime(item.id, isNaN(mins) || mins <= 0 ? null : mins);
    }
    setEditingTime(false);
  };

  const handleTimeKeyDown = (e) => {
    if (e.key === 'Enter') handleTimeSave();
    if (e.key === 'Escape') setEditingTime(false);
  };

  const formatTime = (mins) => {
    if (!mins) return null;
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const toggleExpand = () => {
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (onEditorFocusChange) {
      onEditorFocusChange(willExpand);
    }
  };

  const handleClick = (e) => {
    // Don't toggle when clicking inside the editor
    if (editorContainerRef.current && editorContainerRef.current.contains(e.target)) return;
    onSelect && onSelect(item.id);
    toggleExpand();
  };

  const handleExpand = (e) => {
    e.stopPropagation();
    toggleExpand();
  };

  const handleNotesChange = useCallback((tree) => {
    if (onSetNotes) {
      onSetNotes(item.id, tree);
    }
  }, [item.id, onSetNotes]);

  // Determine if item has notes content beyond just the title
  const hasNotes = item.notes && Array.isArray(item.notes) && item.notes.length > 0;
  const noteCount = hasNotes
    ? BulletEditor.flattenTree(item.notes).length
    : 0;

  return (
    <li
      draggable={!expanded}
      onDragStart={(e) => {
        if (expanded) { e.preventDefault(); return; }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
        onDragStart && onDragStart(item.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver && onDragOver(item.id, e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop && onDrop(item.id, e);
      }}
      onDragEnd={() => onDragEnd && onDragEnd()}
      onDragLeave={() => {}}
      className={`relative bg-white border rounded-lg group transition-all duration-200 hover:shadow-sm ${
        isDragging
          ? 'opacity-40'
          : isSelected
            ? 'border-blue-400 ring-2 ring-blue-100'
            : 'border-gray-200'
      }`}
      onClick={handleClick}
    >
      {/* Drop indicator line */}
      {dropIndicator === 'above' && (
        <div className="absolute -top-1.5 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10">
          <div className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-blue-500 rounded-full" />
        </div>
      )}
      {dropIndicator === 'below' && (
        <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10">
          <div className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-blue-500 rounded-full" />
        </div>
      )}

      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Drag handle */}
        <span
          className="shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors select-none"
          onClick={(e) => e.stopPropagation()}
        >
          ⠿
        </span>

        {/* Complete button */}
        <button
          onClick={(e) => { e.stopPropagation(); onComplete(item.id); }}
          className="shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
          title="Complete"
        />

        {/* Text */}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-gray-800 break-words">{item.text}</span>
        </div>

        {/* Expand/collapse notes button */}
        <button
          onClick={handleExpand}
          className={`shrink-0 text-xs px-2 py-0.5 rounded-full transition-colors ${
            expanded
              ? 'bg-blue-100 text-blue-600'
              : hasNotes
                ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                : 'text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100'
          }`}
          title={expanded ? 'Collapse notes' : 'Expand notes'}
        >
          {expanded ? '▾ notes' : hasNotes ? `▸ ${noteCount}` : '▸ notes'}
        </button>

        {/* Estimated time */}
        {editingTime ? (
          <input
            type="number"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            onBlur={handleTimeSave}
            onKeyDown={handleTimeKeyDown}
            placeholder="min"
            autoFocus
            className="w-16 text-xs text-gray-600 border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-400 focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setEditingTime(true); setTimeInput(item.estimatedMinutes || ''); }}
            className={`shrink-0 text-xs px-2 py-0.5 rounded-full transition-colors ${
              item.estimatedMinutes
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100'
            }`}
            title="Set estimated time (minutes)"
          >
            {item.estimatedMinutes ? formatTime(item.estimatedMinutes) : '+ time'}
          </button>
        )}

        {/* Type badge */}
        {item.type && (
          <span
            className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
              item.type === 'task'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-purple-50 text-purple-600'
            }`}
          >
            {item.type === 'task' ? 'Task' : 'Outcome'}
          </span>
        )}

        {/* Promote (Someday/Maybe view) */}
        {onPromote && (
          <button
            onClick={(e) => { e.stopPropagation(); onPromote(item.id); }}
            className="shrink-0 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
            title="Promote to Next Actions"
          >
            Activate
          </button>
        )}

        {/* Delete */}
        {confirming ? (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); setConfirming(false); }}
            className="shrink-0 text-xs text-red-500 font-medium"
          >
            Confirm?
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
            onBlur={() => setConfirming(false)}
            className="shrink-0 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Expanded notes editor */}
      {expanded && (
        <div
          ref={editorContainerRef}
          className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 rounded-b-lg"
          onClick={(e) => e.stopPropagation()}
          onFocus={() => onEditorFocusChange && onEditorFocusChange(true)}
          onBlur={(e) => {
            // Only notify blur if focus is leaving the editor container entirely
            if (editorContainerRef.current && !editorContainerRef.current.contains(e.relatedTarget)) {
              onEditorFocusChange && onEditorFocusChange(false);
            }
          }}
        >
          <BulletEditor
            initialTree={BulletEditor.treeFromItem(item)}
            onChange={handleNotesChange}
          />
        </div>
      )}
    </li>
  );
}
