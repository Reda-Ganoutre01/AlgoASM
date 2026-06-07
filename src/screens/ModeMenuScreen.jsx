import { useEffect, useRef } from 'react';
import { useScratchAnimation } from '../hooks/useScratchAnimation';

export default function ModeMenuScreen({ visible, onPick }) {
  const scratchCanvasRef = useRef(null);
  const svgLinesRef      = useRef(null);
  const sortCardRef  = useRef(null);
  const treeCardRef  = useRef(null);
  const graphCardRef = useRef(null);

  const cardRefs = [sortCardRef, treeCardRef, graphCardRef];
  const { start, stop } = useScratchAnimation(scratchCanvasRef, cardRefs, svgLinesRef);

  useEffect(() => {
    if (visible) {
      setTimeout(start, 420);
    } else {
      stop();
    }
    return stop;
  }, [visible]);

  function pick(tab) {
    stop();
    onPick(tab);
  }

  return (
    <div id="mode-overlay" className={visible ? 'show' : ''}>
      <div id="mode-ring">
        <canvas id="scratch-canvas" ref={scratchCanvasRef} width={520} height={520} />

        <svg
          id="mode-lines"
          ref={svgLinesRef}
          viewBox="0 0 520 520"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
        >
          <line x1="260" y1="260" x2="260" y2="90"  stroke="#ff8c4244" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="260" y1="260" x2="110" y2="420" stroke="#00ff9d44" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="260" y1="260" x2="410" y2="420" stroke="#a855f744" strokeWidth="1" strokeDasharray="4 4" />
        </svg>

        <div id="mode-center">
          <div id="mode-center-title">select mode</div>
          <div id="mode-center-label">AlgoASM</div>
        </div>

        {/* SORT card — top */}
        <div className="mode-card" id="mc-sort" ref={sortCardRef} onClick={() => pick('sort')}>
          <div className="mode-icon-wrap">📊</div>
          <div className="mode-name">Sort</div>
          <div className="mode-desc">Bubble · Selection<br />Insertion · Quick · Merge</div>
        </div>

        {/* TREE card — bottom-left */}
        <div className="mode-card" id="mc-tree" ref={treeCardRef} onClick={() => pick('tree')}>
          <div className="mode-icon-wrap">🌳</div>
          <div className="mode-name">Trees</div>
          <div className="mode-desc">Binary Search Tree<br />Red-Black Tree</div>
        </div>

        {/* GRAPH card — bottom-right */}
        <div className="mode-card" id="mc-graph" ref={graphCardRef} onClick={() => pick('graph')}>
          <div className="mode-icon-wrap">🕸️</div>
          <div className="mode-name">Graph</div>
          <div className="mode-desc">Breadth-First Search<br />Depth-First Search</div>
        </div>
      </div>
    </div>
  );
}
