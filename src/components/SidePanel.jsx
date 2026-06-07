import { useEffect, useRef } from 'react';
import { CX, INFO, PSEUDO } from '../data/algoData';

export default function SidePanel({ tab, algo, activeTree, running, uiTick, engine, treeEngine }) {
  const prevCmpRef = useRef(0);
  const prevSwRef  = useRef(0);
  const cmpElRef   = useRef(null);
  const swElRef    = useRef(null);
  const pScrollRef = useRef(null);

  // Derived values
  const comparisons = engine.comparisons.current;
  const swapsVal    = engine.swaps.current;
  const stepCount   = engine.stepCount.current;
  const phl         = engine.phl.current;

  const size =
    tab === 'sort'  ? engine.SORT_N.current :
    tab === 'graph' ? 9 :
    activeTree === 'bst' ? treeEngine.bstNodes.current.length : treeEngine.rbtNodes.current.length;

  const isDone =
    tab === 'sort'  ? engine.sortDone.current :
    tab === 'graph' ? engine.gdone.current : false;

  const badgeClass = isDone ? 'd' : running ? 'g' : 'r';
  const badgeText  = isDone ? 'COMPLETE' : running ? 'RUNNING' : 'READY';

  const key = tab === 'tree' ? (activeTree === 'rbt' ? 'rbt' : 'bst') : algo;
  const cx  = CX[key] || CX.bubble;

  // Stat pop animation
  useEffect(() => {
    if (comparisons !== prevCmpRef.current && cmpElRef.current) {
      cmpElRef.current.classList.remove('stat-pop');
      void cmpElRef.current.offsetWidth;
      cmpElRef.current.classList.add('stat-pop');
      prevCmpRef.current = comparisons;
    }
  }, [comparisons]);

  useEffect(() => {
    if (swapsVal !== prevSwRef.current && swElRef.current) {
      swElRef.current.classList.remove('stat-pop');
      void swElRef.current.offsetWidth;
      swElRef.current.classList.add('stat-pop');
      prevSwRef.current = swapsVal;
    }
  }, [swapsVal]);

  // Pseudocode
  const lines = PSEUDO[key] || [];

  useEffect(() => {
    if (pScrollRef.current) {
      const hl = pScrollRef.current.querySelector('.hl');
      if (hl) hl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [phl, uiTick]);

  // Legend
  let legendItems = [];
  if (tab === 'sort') {
    legendItems = [
      ['#ff8c42','Compare A'],['#ff4757','Compare B'],
      ['#fbbf24','Pivot'],['#00ff9d','Sorted'],['#3b82f6','Unsorted'],
    ];
  } else if (tab === 'graph') {
    legendItems = [['#fbbf24','Current'],['#00d4ff','Visited'],['#4a5568','Unvisited']];
  } else if (activeTree === 'bst') {
    legendItems = [['#00d4ff','BST Node'],['#00ff9d','New Insert']];
  } else {
    legendItems = [['#ff4757','Red Node'],['#3b82f6','Black Node'],['#00ff9d','New Insert']];
  }

  return (
    <aside id="side">
      {/* Status + stats */}
      <div className="psec">
        <div id="sbadge" className={badgeClass}>
          <div className="sdot" />
          <span>{badgeText}</span>
        </div>
        <div className="sgrid">
          <div className="sc cc"><div className="sl">COMPARISONS</div><div className="sv vc" ref={cmpElRef}>{comparisons}</div></div>
          <div className="sc co"><div className="sl">SWAPS</div><div className="sv vo" ref={swElRef}>{swapsVal}</div></div>
          <div className="sc cg"><div className="sl">SIZE</div><div className="sv vg">{size}</div></div>
          <div className="sc cp"><div className="sl">STEP</div><div className="sv vp">{stepCount}</div></div>
        </div>
      </div>

      {/* Complexity */}
      <div className="psec">
        <div className="ptit">Complexity</div>
        <div className="cxr"><span className="cxl">Best</span>   <span className="cxv b">{cx.b}</span></div>
        <div className="cxr"><span className="cxl">Average</span><span className="cxv a">{cx.a}</span></div>
        <div className="cxr"><span className="cxl">Worst</span>  <span className="cxv w">{cx.w}</span></div>
        <div className="cxr"><span className="cxl">Space</span>  <span className="cxv s">{cx.s}</span></div>
      </div>

      {/* Legend */}
      <div className="psec">
        <div className="ptit">Legend</div>
        <div id="leg">
          {legendItems.map(([color, label]) => (
            <div key={label} className="legr">
              <div className="legd" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Pseudocode */}
      <div className="psec" id="pseudo-sec">
        <div className="ptit">Pseudocode</div>
        <div id="pscroll" ref={pScrollRef}>
          <div id="plines">
            {lines.map((line, i) => (
              <div key={i} className={`pl${i === phl ? ' hl' : ''}`}>
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="psec" style={{ flexShrink: 0 }}>
        <div className="ptit">Info</div>
        <div className="infb">{INFO[key] || ''}</div>
      </div>
    </aside>
  );
}
