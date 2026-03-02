import { useState, useRef, useCallback, useEffect } from 'react';
import { generateId } from '../utils/ids';

// ─── Tree helpers (pure functions) ──────────────────────────────

function createBlock(text = '') {
  return { id: generateId(), text, children: [] };
}

/**
 * Flatten tree into ordered list, respecting collapsed state.
 * Collapsed blocks' children are skipped.
 */
function flattenTree(roots, collapsedIds = new Set()) {
  const result = [];
  function walk(nodes, depth, parentId) {
    nodes.forEach((node, idx) => {
      result.push({ block: node, depth, parentId, indexInParent: idx });
      if (!collapsedIds.has(node.id)) {
        walk(node.children, depth + 1, node.id);
      }
    });
  }
  walk(roots, 0, null);
  return result;
}

/** Flatten ignoring collapsed state (for full tree operations) */
function flattenTreeFull(roots) {
  return flattenTree(roots, new Set());
}

/** Deep-clone a tree (needed because we mutate during operations) */
function cloneTree(roots) {
  return roots.map(function cloneNode(n) {
    return { ...n, children: n.children.map(cloneNode) };
  });
}

/** Find a block's parent array and index within it. Returns { siblings, index, parent } */
function findBlock(roots, blockId) {
  function search(nodes, parent) {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === blockId) {
        return { siblings: nodes, index: i, parent };
      }
      const found = search(nodes[i].children, nodes[i]);
      if (found) return found;
    }
    return null;
  }
  return search(roots, null);
}

/**
 * Indent: make block a last child of its previous sibling.
 * Moves entire subtree.
 */
function indentBlock(roots, blockId) {
  const tree = cloneTree(roots);
  const loc = findBlock(tree, blockId);
  if (!loc || loc.index === 0) return roots;

  const prevSibling = loc.siblings[loc.index - 1];
  const [block] = loc.siblings.splice(loc.index, 1);
  prevSibling.children.push(block);
  return tree;
}

/**
 * Unindent: promote block to be a sibling of its parent,
 * placed immediately after parent. Moves entire subtree.
 * Trailing siblings become children (Roam behavior).
 */
function unindentBlock(roots, blockId) {
  const tree = cloneTree(roots);
  const loc = findBlock(tree, blockId);
  if (!loc || !loc.parent) return roots;

  const parentLoc = findBlock(tree, loc.parent.id);
  if (!parentLoc) return roots;

  const [block] = loc.siblings.splice(loc.index, 1);
  const trailingSiblings = loc.siblings.splice(loc.index);
  block.children = block.children.concat(trailingSiblings);
  parentLoc.siblings.splice(parentLoc.index + 1, 0, block);
  return tree;
}

/** Move Block Up: swap with previous sibling */
function moveBlockUp(roots, blockId) {
  const tree = cloneTree(roots);
  const loc = findBlock(tree, blockId);
  if (!loc || loc.index === 0) return roots;

  const i = loc.index;
  const temp = loc.siblings[i];
  loc.siblings[i] = loc.siblings[i - 1];
  loc.siblings[i - 1] = temp;
  return tree;
}

/** Move Block Down: swap with next sibling */
function moveBlockDown(roots, blockId) {
  const tree = cloneTree(roots);
  const loc = findBlock(tree, blockId);
  if (!loc || loc.index >= loc.siblings.length - 1) return roots;

  const i = loc.index;
  const temp = loc.siblings[i];
  loc.siblings[i] = loc.siblings[i + 1];
  loc.siblings[i + 1] = temp;
  return tree;
}

/** Insert a new empty block after blockId at the same level */
function insertBlockAfter(roots, blockId) {
  const tree = cloneTree(roots);
  const loc = findBlock(tree, blockId);
  if (!loc) return [roots, null];

  const newBlock = createBlock();
  loc.siblings.splice(loc.index + 1, 0, newBlock);
  return [tree, newBlock.id];
}

/** Delete an empty block with no children */
function deleteBlock(roots, blockId, collapsedIds) {
  const flat = flattenTree(roots, collapsedIds);
  const flatIdx = flat.findIndex(f => f.block.id === blockId);
  if (flatIdx <= 0) return null;

  const entry = flat[flatIdx];
  if (entry.block.text !== '' || entry.block.children.length > 0) return null;

  const tree = cloneTree(roots);
  const loc = findBlock(tree, blockId);
  if (!loc) return null;

  loc.siblings.splice(loc.index, 1);
  const prevId = flat[flatIdx - 1].block.id;
  return [tree, prevId];
}

/** Split a block at cursor position */
function splitBlock(roots, blockId, cursorPos, textLength) {
  const tree = cloneTree(roots);
  const loc = findBlock(tree, blockId);
  if (!loc) return { tree: roots, focusId: null };

  const block = loc.siblings[loc.index];

  if (cursorPos === 0) {
    const newBlock = createBlock();
    loc.siblings.splice(loc.index, 0, newBlock);
    return { tree, focusId: newBlock.id };
  }

  if (cursorPos >= textLength) {
    const newBlock = createBlock();
    loc.siblings.splice(loc.index + 1, 0, newBlock);
    return { tree, focusId: newBlock.id };
  }

  const leftText = block.text.slice(0, cursorPos);
  const rightText = block.text.slice(cursorPos);
  block.text = leftText;
  const newBlock = createBlock(rightText);
  loc.siblings.splice(loc.index + 1, 0, newBlock);
  return { tree, focusId: block.id };
}

// ─── Initial tree from item text ────────────────────────────────

function treeFromItem(item) {
  if (item.notes && Array.isArray(item.notes) && item.notes.length > 0) {
    return item.notes;
  }
  return [createBlock(item.text)];
}

// ─── Bullet icon component ──────────────────────────────────────

function BulletIcon({ hasChildren, isCollapsed, onClick }) {
  if (!hasChildren) {
    // Simple dot for leaf nodes
    return (
      <span className="mt-2 mr-1.5 shrink-0 w-4 h-4 flex items-center justify-center">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      </span>
    );
  }

  // Triangle for nodes with children — rotates when expanded
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="mt-1 mr-0.5 shrink-0 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-transform"
    >
      <svg
        className={`w-3 h-3 transition-transform duration-150 ${isCollapsed ? '' : 'rotate-90'}`}
        viewBox="0 0 12 12"
        fill="currentColor"
      >
        <path d="M4 2l6 4-6 4V2z" />
      </svg>
    </button>
  );
}

// ─── Component ──────────────────────────────────────────────────

export function BulletEditor({ initialTree, onChange }) {
  const [tree, setTree] = useState(initialTree);
  const [collapsedIds, setCollapsedIds] = useState(new Set());
  const [focusRequest, setFocusRequest] = useState({ id: null, token: 0 });
  const inputRefs = useRef({});

  const requestFocus = useCallback((blockId) => {
    setFocusRequest(prev => ({ id: blockId, token: prev.token + 1 }));
  }, []);

  const toggleCollapse = useCallback((blockId) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
  }, []);

  // Notify parent whenever tree changes
  useEffect(() => {
    onChange(tree);
  }, [tree, onChange]);

  // Focus management — only fires on intentional focus commands
  useEffect(() => {
    if (focusRequest.id && inputRefs.current[focusRequest.id]) {
      const el = inputRefs.current[focusRequest.id];
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [focusRequest.token]);

  const handleTextChange = useCallback((blockId, newText) => {
    setTree(prev => {
      const next = cloneTree(prev);
      const loc = findBlock(next, blockId);
      if (loc) loc.siblings[loc.index].text = newText;
      return next;
    });
  }, []);

  const handleKeyDown = useCallback((e, blockId) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        setTree(prev => unindentBlock(prev, blockId));
      } else {
        setTree(prev => indentBlock(prev, blockId));
      }
      requestFocus(blockId);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const el = e.target;
      const text = el.value;
      if (!text.trim()) return;
      const cursorPos = el.selectionStart;
      const result = splitBlock(tree, blockId, cursorPos, text.length);
      if (result.focusId) {
        setTree(result.tree);
        requestFocus(result.focusId);
      }
      return;
    }

    if (e.key === 'Backspace') {
      const el = e.target;
      if (el.selectionStart === 0 && el.selectionEnd === 0) {
        e.preventDefault();
        const result = deleteBlock(tree, blockId, collapsedIds);
        if (result) {
          const [newTree, prevId] = result;
          setTree(newTree);
          requestFocus(prevId);
        }
      }
      return;
    }

    // Cmd+↑: toggle collapse of current block's children
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'ArrowUp') {
      // Only toggle if the block has children
      const loc = findBlock(tree, blockId);
      if (loc) {
        const block = loc.siblings[loc.index];
        if (block.children.length > 0) {
          e.preventDefault();
          toggleCollapse(blockId);
          return;
        }
      }
    }

    // Move block up/down (Cmd+Shift+Arrow)
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      if (e.key === 'ArrowUp') {
        setTree(prev => moveBlockUp(prev, blockId));
      } else {
        setTree(prev => moveBlockDown(prev, blockId));
      }
      requestFocus(blockId);
      return;
    }

    // Arrow navigation between visible blocks
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const flat = flattenTree(tree, collapsedIds);
      const idx = flat.findIndex(f => f.block.id === blockId);
      if (e.key === 'ArrowUp' && idx > 0) {
        e.preventDefault();
        requestFocus(flat[idx - 1].block.id);
      } else if (e.key === 'ArrowDown' && idx < flat.length - 1) {
        e.preventDefault();
        requestFocus(flat[idx + 1].block.id);
      }
    }
  }, [tree, collapsedIds, requestFocus, toggleCollapse]);

  const flat = flattenTree(tree, collapsedIds);

  return (
    <div className="space-y-0.5">
      {flat.map(({ block, depth }) => (
        <div
          key={block.id}
          className="flex items-start group"
          style={{ paddingLeft: `${depth * 24}px` }}
        >
          <BulletIcon
            hasChildren={block.children.length > 0}
            isCollapsed={collapsedIds.has(block.id)}
            onClick={() => toggleCollapse(block.id)}
          />
          <input
            ref={el => { inputRefs.current[block.id] = el; }}
            type="text"
            value={block.text}
            onChange={e => handleTextChange(block.id, e.target.value)}
            onKeyDown={e => handleKeyDown(e, block.id)}
            placeholder="..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 py-1 px-1 focus:bg-blue-50/50 rounded transition-colors"
          />
          {collapsedIds.has(block.id) && block.children.length > 0 && (
            <span className="text-xs text-gray-400 mt-1.5 ml-1">
              {block.children.length} hidden
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// Export helpers for use by ClarifyCard and NotesView
BulletEditor.treeFromItem = treeFromItem;
BulletEditor.flattenTree = flattenTreeFull;
BulletEditor.createBlock = createBlock;
