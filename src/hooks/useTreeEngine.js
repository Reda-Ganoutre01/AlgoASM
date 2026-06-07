import { useRef, useCallback } from 'react';
import { GN, GA } from '../data/algoData';

const RED = 'red', BLACK = 'black';

function makeArr(n) {
  const a = [];
  for (let i = 1; i <= n; i++) a.push(i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── BST helpers ────────────────────────────────────────────────────────────────
function bstIns(val, nodes, canvasWidth) {
  if (!nodes.length) {
    nodes.push({ val, left: -1, right: -1, x: canvasWidth / 2, y: 55, isNew: true });
    return;
  }
  let i = 0, dx = 90;
  while (true) {
    if (val === nodes[i].val) return;
    if (val < nodes[i].val) {
      if (nodes[i].left === -1) {
        nodes[i].left = nodes.length;
        nodes.push({ val, left: -1, right: -1, x: nodes[i].x - dx, y: nodes[i].y + 70, isNew: true });
        return;
      }
      i = nodes[i].left;
    } else {
      if (nodes[i].right === -1) {
        nodes[i].right = nodes.length;
        nodes.push({ val, left: -1, right: -1, x: nodes[i].x + dx, y: nodes[i].y + 70, isNew: true });
        return;
      }
      i = nodes[i].right;
    }
    dx = Math.max(dx * 0.56, 22);
  }
}

function layoutTree(nodes, root, canvasWidth) {
  if (!nodes.length || root === -1) return;
  const ord = [];
  function io(i) { if (i === -1) return; io(nodes[i].left); ord.push(i); io(nodes[i].right); }
  io(root);
  const slot = canvasWidth / (ord.length + 1);
  ord.forEach((idx, r) => nodes[idx].x = slot * (r + 1));
  function dep(i, d) { if (i === -1) return; nodes[i].y = 55 + d * 72; dep(nodes[i].left, d + 1); dep(nodes[i].right, d + 1); }
  dep(root, 0);
}

// ── RBT helpers ────────────────────────────────────────────────────────────────
function rbtMk(val) { return { val, color: RED, left: -1, right: -1, parent: -1, x: 0, y: 0, isNew: false }; }

function rbtRL(nodes, rbtRoot, z) {
  const y = nodes[z].right, p = nodes[z].parent;
  nodes[z].right = nodes[y].left;
  if (nodes[y].left !== -1) nodes[nodes[y].left].parent = z;
  nodes[y].parent = p;
  if (p === -1) rbtRoot = y;
  else if (z === nodes[p].left) nodes[p].left = y;
  else nodes[p].right = y;
  nodes[y].left = z; nodes[z].parent = y;
  return rbtRoot;
}

function rbtRR(nodes, rbtRoot, z) {
  const y = nodes[z].left, p = nodes[z].parent;
  nodes[z].left = nodes[y].right;
  if (nodes[y].right !== -1) nodes[nodes[y].right].parent = z;
  nodes[y].parent = p;
  if (p === -1) rbtRoot = y;
  else if (z === nodes[p].right) nodes[p].right = y;
  else nodes[p].left = y;
  nodes[y].right = z; nodes[z].parent = y;
  return rbtRoot;
}

function rbtFix(nodes, rbtRoot, z) {
  while (nodes[z].parent !== -1 && nodes[nodes[z].parent].color === RED) {
    const p = nodes[z].parent, gp = nodes[p].parent;
    if (gp === -1) break;
    if (p === nodes[gp].left) {
      const u = nodes[gp].right;
      if (u !== -1 && nodes[u].color === RED) {
        nodes[p].color = BLACK; nodes[u].color = BLACK; nodes[gp].color = RED; z = gp;
      } else {
        if (z === nodes[p].right) { z = p; rbtRoot = rbtRL(nodes, rbtRoot, z); }
        nodes[nodes[z].parent].color = BLACK;
        nodes[nodes[nodes[z].parent].parent].color = RED;
        rbtRoot = rbtRR(nodes, rbtRoot, nodes[nodes[z].parent].parent);
      }
    } else {
      const u = nodes[gp].left;
      if (u !== -1 && nodes[u].color === RED) {
        nodes[p].color = BLACK; nodes[u].color = BLACK; nodes[gp].color = RED; z = gp;
      } else {
        if (z === nodes[p].left) { z = p; rbtRoot = rbtRR(nodes, rbtRoot, z); }
        nodes[nodes[z].parent].color = BLACK;
        nodes[nodes[nodes[z].parent].parent].color = RED;
        rbtRoot = rbtRL(nodes, rbtRoot, nodes[nodes[z].parent].parent);
      }
    }
  }
  nodes[rbtRoot].color = BLACK;
  return rbtRoot;
}

function rbtIns(val, nodes, rbtRoot, canvasWidth) {
  let y = -1, x = rbtRoot;
  while (x !== -1) {
    if (val === nodes[x].val) return rbtRoot;
    y = x;
    x = val < nodes[x].val ? nodes[x].left : nodes[x].right;
  }
  const idx = nodes.length;
  nodes.push(rbtMk(val));
  nodes[idx].parent = y;
  if (y === -1) rbtRoot = idx;
  else if (val < nodes[y].val) nodes[y].left = idx;
  else nodes[y].right = idx;
  rbtRoot = rbtFix(nodes, rbtRoot, idx);
  layoutTree(nodes, rbtRoot, canvasWidth);
  return rbtRoot;
}

// ── Main hook ──────────────────────────────────────────────────────────────────
export function useTreeEngine() {
  const bstNodes = useRef([]);
  const rbtNodes = useRef([]);
  const rbtRoot = useRef(-1);

  const canvasWidth = useRef(800);

  const setCanvasWidth = useCallback((w) => { canvasWidth.current = w; }, []);

  const resetBST = useCallback(() => {
    bstNodes.current = [];
    [50, 30, 70, 20, 40, 60, 80, 10, 25, 35].forEach(v => bstIns(v, bstNodes.current, canvasWidth.current));
    layoutTree(bstNodes.current, 0, canvasWidth.current);
    bstNodes.current.forEach(n => n.isNew = false);
  }, []);

  const resetRBT = useCallback(() => {
    rbtNodes.current = [];
    rbtRoot.current = -1;
    [41, 38, 31, 12, 19, 8, 55, 66, 22].forEach(v => {
      rbtRoot.current = rbtIns(v, rbtNodes.current, rbtRoot.current, canvasWidth.current);
    });
    rbtNodes.current.forEach(n => n.isNew = false);
  }, []);

  const insert = useCallback((val, type) => {
    if (type === 'bst') {
      bstIns(val, bstNodes.current, canvasWidth.current);
      layoutTree(bstNodes.current, 0, canvasWidth.current);
      setTimeout(() => bstNodes.current.forEach(n => n.isNew = false), 1400);
    } else {
      rbtRoot.current = rbtIns(val, rbtNodes.current, rbtRoot.current, canvasWidth.current);
      setTimeout(() => rbtNodes.current.forEach(n => n.isNew = false), 1400);
    }
  }, []);

  const doTreeReset = useCallback(() => {
    resetBST();
    resetRBT();
  }, [resetBST, resetRBT]);

  return {
    bstNodes, rbtNodes, rbtRoot,
    resetBST, resetRBT, insert, doTreeReset,
    setCanvasWidth,
  };
}
