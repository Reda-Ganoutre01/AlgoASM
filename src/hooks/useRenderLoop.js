import { useEffect, useRef } from 'react';
import { C } from '../data/algoData';
import { GN, GA, GX, GY } from '../data/algoData';

export function useRenderLoop(canvasRef, engine, treeEngine) {
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resizeCv() {
      const wrap = canvas.parentElement;
      if (wrap) { canvas.width = wrap.clientWidth; canvas.height = wrap.clientHeight; }
    }

    resizeCv();
    const onResize = () => { resizeCv(); };
    window.addEventListener('resize', onResize);

    // ── Sort renderer ────────────────────────────────────────────────────────
    function renderSort(W, H) {
      const PAD = 16, n = engine.SORT_N.current;
      const bw = (W - PAD * 2) / n, mxH = H - 58;
      for (const b of engine.mergeBands.current) {
        const x1 = PAD + b.L * bw, x2 = PAD + (b.R + 1) * bw;
        ctx.fillStyle = '#ffffff06'; ctx.fillRect(x1, 0, x2 - x1, H - 34);
        ctx.fillStyle = '#3b82f60a'; ctx.fillRect(x1, 0, (b.M - b.L + 1) * bw, H - 34);
        ctx.fillStyle = '#a855f70a'; ctx.fillRect(PAD + (b.M + 1) * bw, 0, (b.R - b.M) * bw, H - 34);
      }
      ctx.strokeStyle = C.border; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD, H - 30); ctx.lineTo(W - PAD, H - 30); ctx.stroke();
      const a = engine.arr.current;
      for (let i = 0; i < a.length; i++) {
        const h = Math.max(2, (a[i] / n) * mxH);
        const x = PAD + i * bw, y = H - 30 - h, bwi = Math.max(1, bw - 1.2);
        const ca = engine.cmpA.current, cb = engine.cmpB.current, pi = engine.pivotIdx.current;
        let col = engine.sortedIdx.current.has(i) ? C.green : i === pi ? C.yellow : i === ca ? C.orange : i === cb ? C.red : C.blue;
        if (i === ca || i === cb || i === pi) { ctx.shadowColor = col; ctx.shadowBlur = 8; }
        const g = ctx.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, col); g.addColorStop(1, col + '44');
        ctx.fillStyle = g; ctx.fillRect(x, y, bwi, h); ctx.shadowBlur = 0;
        ctx.fillStyle = col + 'cc'; ctx.fillRect(x, y, bwi, 2);
      }
      ctx.font = 'bold 11px JetBrains Mono,monospace';
      ctx.fillStyle = engine.sortDone.current ? C.green : engine.running.current ? C.cyan : C.t2;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(engine.sortDone.current ? '✓ SORTED' : engine.running.current ? '▶ RUNNING' : '⏸ PAUSED', PAD, 10);
      const prog = engine.sortedIdx.current.size / n;
      ctx.fillStyle = C.border; ctx.fillRect(PAD, H - 18, W - PAD * 2, 3);
      const pg = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
      pg.addColorStop(0, C.cyan); pg.addColorStop(1, C.green);
      ctx.fillStyle = pg; ctx.fillRect(PAD, H - 18, (W - PAD * 2) * prog, 3);
      ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    }

    // ── Tree renderer ────────────────────────────────────────────────────────
    function renderTree(W, H) {
      const activeTree = engine.tab.current === 'tree' ? (window.__activeTree || 'bst') : 'bst';
      const nodes = activeTree === 'bst' ? treeEngine.bstNodes.current : treeEngine.rbtNodes.current;
      const root = activeTree === 'bst' ? 0 : treeEngine.rbtRoot.current;
      if (!nodes.length || root === -1) {
        ctx.font = '13px JetBrains Mono,monospace'; ctx.fillStyle = C.t3;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Empty — insert values below', W / 2, H / 2);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; return;
      }
      for (let i = 0; i < nodes.length; i++) {
        const nd = nodes[i];
        for (const ch of [nd.left, nd.right]) {
          if (ch === -1) continue;
          ctx.strokeStyle = C.bhl; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(nd.x, nd.y); ctx.lineTo(nodes[ch].x, nodes[ch].y); ctx.stroke();
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        const nd = nodes[i], R = 22;
        let fill = C.card, stroke = C.cyan, tc = C.cyan;
        if (activeTree === 'rbt') { fill = nd.color === 'red' ? '#2a0810' : '#091726'; stroke = nd.color === 'red' ? C.red : C.blue; tc = nd.color === 'red' ? C.red : C.blue; }
        if (nd.isNew) { fill = C.gdim; stroke = C.green; tc = C.green; }
        ctx.shadowColor = stroke; ctx.shadowBlur = nd.isNew ? 18 : 7;
        ctx.beginPath(); ctx.arc(nd.x, nd.y, R, 0, Math.PI * 2);
        ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); ctx.shadowBlur = 0;
        ctx.font = 'bold 11px JetBrains Mono,monospace'; ctx.fillStyle = tc;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(nd.val, nd.x, nd.y);
      }
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      if (activeTree === 'rbt' && treeEngine.rbtNodes.current.length) {
        let bh = 0, c = treeEngine.rbtRoot.current;
        while (c !== -1) { if (treeEngine.rbtNodes.current[c].color === 'black') bh++; c = treeEngine.rbtNodes.current[c].left; }
        ctx.font = '11px JetBrains Mono,monospace';
        ctx.fillStyle = C.red; ctx.fillText('● Red', 14, 24);
        ctx.fillStyle = C.blue; ctx.fillText('● Black', 14, 42);
        ctx.fillStyle = C.t3; ctx.fillText('Black-height: ' + bh, 14, 60);
      }
    }

    // ── Graph renderer ───────────────────────────────────────────────────────
    function renderGraph(W, H) {
      const ox = (W - 580) / 2, oy = Math.max(28, (H - 410) / 2);
      for (let i = 0; i < GN; i++) for (let j = i + 1; j < GN; j++) {
        if (!GA[i][j]) continue;
        const tr = engine.gedges.current.some(([a, b]) => (a === i && b === j) || (a === j && b === i));
        ctx.strokeStyle = tr ? C.cyan : C.border; ctx.lineWidth = tr ? 2 : 1;
        ctx.shadowColor = tr ? C.cyan : 'transparent'; ctx.shadowBlur = tr ? 5 : 0;
        ctx.beginPath(); ctx.moveTo(ox + GX[i], oy + GY[i]); ctx.lineTo(ox + GX[j], oy + GY[j]); ctx.stroke(); ctx.shadowBlur = 0;
      }
      for (let i = 0; i < GN; i++) {
        const R = 22, cx = ox + GX[i], cy = oy + GY[i];
        const isCur = i === engine.gcur.current, isV = engine.gvis.current[i];
        let fill = C.card, stroke = C.t3, tc = C.t3;
        if (isCur) { fill = '#1a2600'; stroke = C.yellow; tc = C.yellow; }
        else if (isV) { fill = '#091a35'; stroke = C.cyan; tc = C.cyan; }
        ctx.shadowColor = stroke; ctx.shadowBlur = isCur ? 20 : isV ? 8 : 0;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
        ctx.strokeStyle = stroke; ctx.lineWidth = 2.5; ctx.stroke(); ctx.shadowBlur = 0;
        ctx.font = 'bold 13px JetBrains Mono,monospace'; ctx.fillStyle = tc;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(i, cx, cy);
      }
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      if (engine.gpath.current.length) {
        ctx.font = '11px JetBrains Mono,monospace'; ctx.fillStyle = C.cyan;
        ctx.fillText('Path: ' + engine.gpath.current.join(' → '), 14, H - 14);
      }
      if (engine.gdone.current) {
        ctx.font = 'bold 13px JetBrains Mono,monospace'; ctx.fillStyle = C.green;
        ctx.textAlign = 'center'; ctx.fillText('✓ ALL ' + GN + ' NODES VISITED', W / 2, 26); ctx.textAlign = 'left';
      }
    }

    // ── Main loop ────────────────────────────────────────────────────────────
    function loop(now) {
      rafRef.current = requestAnimationFrame(loop);
      if (engine.running.current) {
        const dt = Math.min(now - engine.lastT.current, 200);
        engine.lastT.current = now;
        engine.acc.current += dt;
        const ms = engine.msPerStep();
        while (engine.acc.current >= ms) {
          engine.acc.current -= ms;
          if (engine.oneStep()) {
            engine.running.current = false;
            engine.sortDone.current = engine.tab.current === 'sort';
            // signal UI update
            window.__onRunDone && window.__onRunDone();
            break;
          }
        }
      } else {
        engine.lastT.current = now;
      }

      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      if (engine.tab.current === 'sort') renderSort(W, H);
      else if (engine.tab.current === 'tree') renderTree(W, H);
      else if (engine.tab.current === 'graph') renderGraph(W, H);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []); // intentionally empty – engine/treeEngine are stable refs

  return rafRef;
}
