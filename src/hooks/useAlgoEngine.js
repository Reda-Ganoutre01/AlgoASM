import { useRef, useCallback } from 'react';
import { GN, GA } from '../data/algoData';

const MS_MIN = 4, MS_MAX = 700;

function makeArr(n) {
  const a = [];
  for (let i = 1; i <= n; i++) a.push(i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useAlgoEngine() {
  // ── Shared ─────────────────────────────────────────────────────────────────
  const tab        = useRef('sort');
  const algo       = useRef('bubble');
  const running    = useRef(false);
  const speed      = useRef(50);
  const stepCount  = useRef(0);
  const lastT      = useRef(0);
  const acc        = useRef(0);
  const phl        = useRef(-1);

  // ── Sort ───────────────────────────────────────────────────────────────────
  const SORT_N      = useRef(50);
  const arr         = useRef([]);
  const cmpA        = useRef(-1);
  const cmpB        = useRef(-1);
  const comparisons = useRef(0);
  const swaps       = useRef(0);
  const sortedIdx   = useRef(new Set());
  const sortDone    = useRef(false);
  const sortState   = useRef({});
  const mergeBands  = useRef([]);
  const pivotIdx    = useRef(-1);

  // ── Graph ──────────────────────────────────────────────────────────────────
  const gvis  = useRef([]);
  const gcur  = useRef(-1);
  const gq    = useRef([]);
  const gstk  = useRef([]);
  const gdone = useRef(false);
  const gpath = useRef([]);
  const gedges= useRef([]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function msPerStep() { return MS_MIN + (1 - speed.current / 100) * (MS_MAX - MS_MIN); }

  // ── Sort algorithms ────────────────────────────────────────────────────────
  function initMSeg() {
    const s = sortState.current, n = arr.current.length;
    while (s.lft >= n) {
      s.w *= 2; s.lft = 0;
      if (s.w >= n) { mergeBands.current = []; return true; }
    }
    s.mL = s.lft; s.mM = Math.min(s.lft + s.w - 1, n - 1);
    s.mR = Math.min(s.lft + 2 * s.w - 1, n - 1);
    s.lft = s.mR + 1; s.mI = s.mL; s.mJ = s.mM + 1; s.mK = s.mL;
    s.tmp = arr.current.slice(s.mL, s.mR + 1); s.ph = 'merge';
    mergeBands.current = [{ L: s.mL, M: s.mM, R: s.mR }];
    return false;
  }

  const resetSort = useCallback(() => {
    const n = SORT_N.current;
    arr.current = makeArr(n);
    comparisons.current = 0; swaps.current = 0;
    cmpA.current = -1; cmpB.current = -1;
    sortedIdx.current = new Set(); sortDone.current = false;
    stepCount.current = 0; phl.current = -1;
    mergeBands.current = []; pivotIdx.current = -1;
    const a = algo.current;
    if (a === 'bubble') sortState.current = { i: 0, j: 0 };
    else if (a === 'selection') sortState.current = { i: 0, j: 1, mi: 0 };
    else if (a === 'insertion') sortState.current = { i: 1, j: 1 };
    else if (a === 'quick') {
      sortState.current = { stk: [[0, n - 1]], lo: 0, hi: n - 1, ph: 'init', i: -1, j: 0, pv: 0 };
      pivotIdx.current = n - 1;
    } else if (a === 'merge') {
      sortState.current = { w: 1, lft: 0, ph: 'next', mL: 0, mM: 0, mR: 0, mI: 0, mJ: 0, mK: 0, tmp: [] };
      initMSeg();
    }
  }, []);

  function bblStp() {
    const s = sortState.current, n = arr.current.length;
    if (s.i >= n - 1) { for (let x = 0; x < n; x++) sortedIdx.current.add(x); phl.current = 6; return true; }
    if (s.j >= n - s.i - 1) { sortedIdx.current.add(n - s.i - 1); s.i++; s.j = 0; cmpA.current = -1; cmpB.current = -1; phl.current = 1; return false; }
    cmpA.current = s.j; cmpB.current = s.j + 1; comparisons.current++; phl.current = 3;
    if (arr.current[cmpA.current] > arr.current[cmpB.current]) { [arr.current[cmpA.current], arr.current[cmpB.current]] = [arr.current[cmpB.current], arr.current[cmpA.current]]; swaps.current++; phl.current = 5; }
    s.j++; return false;
  }

  function selStp() {
    const s = sortState.current, n = arr.current.length;
    if (s.i >= n - 1) { for (let x = 0; x < n; x++) sortedIdx.current.add(x); phl.current = 7; return true; }
    if (s.j >= n) {
      if (s.mi !== s.i) { [arr.current[s.i], arr.current[s.mi]] = [arr.current[s.mi], arr.current[s.i]]; swaps.current++; phl.current = 6; }
      sortedIdx.current.add(s.i); s.i++; s.j = s.i + 1; s.mi = s.i; cmpA.current = -1; cmpB.current = -1; return false;
    }
    cmpA.current = s.mi; cmpB.current = s.j; comparisons.current++; phl.current = 4;
    if (arr.current[s.j] < arr.current[s.mi]) { s.mi = s.j; phl.current = 5; }
    s.j++; return false;
  }

  function insStp() {
    const s = sortState.current, n = arr.current.length;
    if (s.i >= n) { for (let x = 0; x < n; x++) sortedIdx.current.add(x); phl.current = 6; return true; }
    if (s.j <= 0 || arr.current[s.j - 1] <= arr.current[s.j]) { sortedIdx.current.add(s.i); s.i++; if (s.i < n) s.j = s.i; cmpA.current = -1; cmpB.current = -1; phl.current = 1; return s.i >= n; }
    cmpA.current = s.j - 1; cmpB.current = s.j; comparisons.current++; phl.current = 3;
    if (arr.current[cmpA.current] > arr.current[cmpB.current]) { [arr.current[cmpA.current], arr.current[cmpB.current]] = [arr.current[cmpB.current], arr.current[cmpA.current]]; swaps.current++; phl.current = 4; s.j--; }
    return false;
  }

  function qkStp() {
    const s = sortState.current;
    if (s.stk.length === 0) { for (let x = 0; x < arr.current.length; x++) sortedIdx.current.add(x); cmpA.current = -1; cmpB.current = -1; pivotIdx.current = -1; phl.current = 2; return true; }
    const [lo, hi] = s.stk[s.stk.length - 1];
    if (lo >= hi) { s.stk.pop(); if (lo === hi) sortedIdx.current.add(lo); return false; }
    if (s.lo !== lo || s.hi !== hi || s.ph === 'init') {
      s.lo = lo; s.hi = hi; s.pv = arr.current[hi]; s.i = lo - 1; s.j = lo; s.ph = 'part'; pivotIdx.current = hi; phl.current = 4;
    }
    if (s.ph === 'part') {
      if (s.j < hi) {
        cmpA.current = s.j; cmpB.current = hi; comparisons.current++; phl.current = 6;
        if (arr.current[s.j] <= s.pv) { s.i++; if (s.i !== s.j) { [arr.current[s.i], arr.current[s.j]] = [arr.current[s.j], arr.current[s.i]]; swaps.current++; phl.current = 7; } }
        s.j++; return false;
      } else {
        const pi = s.i + 1;
        if (pi !== hi) { [arr.current[pi], arr.current[hi]] = [arr.current[hi], arr.current[pi]]; swaps.current++; }
        sortedIdx.current.add(pi); cmpA.current = pi; cmpB.current = -1; pivotIdx.current = pi;
        s.stk.pop(); if (pi - 1 > lo) s.stk.push([lo, pi - 1]); if (pi + 1 < hi) s.stk.push([pi + 1, hi]);
        s.ph = 'init'; phl.current = 8; return false;
      }
    }
    return false;
  }

  function mrgStp() {
    const s = sortState.current, n = arr.current.length;
    if (s.w >= n) { for (let x = 0; x < n; x++) sortedIdx.current.add(x); cmpA.current = -1; cmpB.current = -1; mergeBands.current = []; phl.current = 5; return true; }
    if (s.ph === 'next') { const done = initMSeg(); phl.current = 3; if (done) { for (let x = 0; x < n; x++) sortedIdx.current.add(x); return true; } return false; }
    const { mL, mM, mR, tmp } = s;
    if (s.mI <= mM && s.mJ <= mR) {
      cmpA.current = s.mI; cmpB.current = s.mJ; comparisons.current++; phl.current = 4;
      if (tmp[s.mI - mL] <= tmp[s.mJ - mL]) { arr.current[s.mK] = tmp[s.mI - mL]; s.mI++; }
      else { arr.current[s.mK] = tmp[s.mJ - mL]; s.mJ++; swaps.current++; }
      s.mK++;
    } else if (s.mI <= mM) { arr.current[s.mK] = tmp[s.mI - mL]; s.mI++; s.mK++; cmpA.current = -1; cmpB.current = -1; }
    else if (s.mJ <= mR) { arr.current[s.mK] = tmp[s.mJ - mL]; s.mJ++; s.mK++; cmpA.current = -1; cmpB.current = -1; }
    else { s.ph = 'next'; cmpA.current = -1; cmpB.current = -1; mergeBands.current = []; }
    return false;
  }

  function sortStp() {
    stepCount.current++;
    switch (algo.current) {
      case 'bubble': return bblStp();
      case 'selection': return selStp();
      case 'insertion': return insStp();
      case 'quick': return qkStp();
      case 'merge': return mrgStp();
    }
    return true;
  }

  // ── Graph algorithms ───────────────────────────────────────────────────────
  const resetGraph = useCallback(() => {
    gvis.current = new Array(GN).fill(false);
    gcur.current = -1; gq.current = []; gstk.current = [];
    gdone.current = false; gpath.current = []; gedges.current = [];
    stepCount.current = 0; comparisons.current = 0; swaps.current = 0;
    phl.current = 1;
    if (algo.current === 'bfs') { gq.current.push(0); gvis.current[0] = true; gcur.current = 0; }
    else { gstk.current.push(0); gvis.current[0] = true; gcur.current = 0; }
    gpath.current.push(0);
  }, []);

  function bfsStp() {
    if (gq.current.length === 0) { gdone.current = true; phl.current = 7; return true; }
    const node = gq.current.shift(); gcur.current = node; comparisons.current++; phl.current = 4;
    for (let i = 0; i < GN; i++) {
      if (GA[node][i] && !gvis.current[i]) {
        gvis.current[i] = true; gq.current.push(i); gpath.current.push(i); gedges.current.push([node, i]); swaps.current++; phl.current = 7;
      }
    }
    stepCount.current++;
    if (gq.current.length === 0) { gdone.current = true; return true; }
    return false;
  }

  function dfsStp() {
    if (gstk.current.length === 0) { gdone.current = true; phl.current = 8; return true; }
    const node = gstk.current[gstk.current.length - 1]; gcur.current = node; comparisons.current++; phl.current = 4;
    let f = false;
    for (let i = 0; i < GN; i++) {
      if (GA[node][i] && !gvis.current[i]) {
        gvis.current[i] = true; gstk.current.push(i); gpath.current.push(i); gedges.current.push([node, i]); f = true; swaps.current++; phl.current = 6; break;
      }
    }
    if (!f) { gstk.current.pop(); phl.current = 8; }
    stepCount.current++;
    if (gstk.current.length === 0) { gdone.current = true; return true; }
    return false;
  }

  function graphStp() {
    if (gdone.current) return true;
    return algo.current === 'bfs' ? bfsStp() : dfsStp();
  }

  // ── Unified step ───────────────────────────────────────────────────────────
  const oneStep = useCallback(() => {
    let done = false;
    if (tab.current === 'sort') done = sortStp();
    else if (tab.current === 'graph') done = graphStp();
    return done;
  }, []);

  return {
    // State refs
    tab, algo, running, speed, stepCount, lastT, acc, phl,
    SORT_N, arr, cmpA, cmpB, comparisons, swaps, sortedIdx, sortDone,
    sortState, mergeBands, pivotIdx,
    gvis, gcur, gq, gstk, gdone, gpath, gedges,
    // Actions
    resetSort, resetGraph, oneStep,
    msPerStep,
  };
}
