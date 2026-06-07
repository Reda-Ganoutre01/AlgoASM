import { useRef } from 'react';
import { useRenderLoop } from '../hooks/useRenderLoop';
import { C } from '../data/algoData';

export default function CanvasView({ tab, running, activeTree, onActiveTreeChange, engine, treeEngine, onInsert, onTreeReset, uiTick }) {
  const canvasRef = useRef(null);
  const insValRef = useRef(null);

  // Expose activeTree to render loop via window (avoids closure issues)
  window.__activeTree = activeTree;

  useRenderLoop(canvasRef, engine, treeEngine);

  function handleInsert() {
    const val = parseInt(insValRef.current.value);
    if (isNaN(val) || val < 1 || val > 999) {
      insValRef.current.style.borderColor = C.red;
      setTimeout(() => insValRef.current.style.borderColor = '', 700);
      return;
    }
    insValRef.current.value = '';
    onInsert(val, activeTree);
  }

  function handleInsertKey(e) { if (e.key === 'Enter') handleInsert(); }

  const hasData =
    running ||
    (tab === 'sort'  && engine.stepCount.current > 0) ||
    (tab === 'graph' && engine.stepCount.current > 0) ||
    (tab === 'tree'  && (treeEngine.bstNodes.current.length > 0 || treeEngine.rbtNodes.current.length > 0));

  return (
    <div id="cvwrap">
      <canvas id="cv" ref={canvasRef} />

      {/* Empty state */}
      <div id="cv-prompt" className={hasData || tab === 'tree' ? 'hidden' : ''}>
        <div id="cv-prompt-icon">▶</div>
        <div id="cv-prompt-text">Press START to visualise</div>
        <div id="cv-prompt-hint">or press <b>SPACE</b> · <b>→</b> to step</div>
      </div>

      {/* Tree insert bar */}
      <div id="tree-bar" className={tab !== 'tree' ? 'hidden' : ''}>
        <span className="ins-lbl">Tree:</span>
        <select
          id="tree-type"
          value={activeTree}
          onChange={e => onActiveTreeChange(e.target.value)}
        >
          <option value="bst">BST</option>
          <option value="rbt">RBT</option>
        </select>
        <span className="ins-lbl">Insert:</span>
        <input
          id="ins-val"
          type="number"
          min="1" max="999"
          placeholder="value"
          ref={insValRef}
          onKeyDown={handleInsertKey}
        />
        <button className="btn btn-run" style={{ padding: '5px 11px' }} onClick={handleInsert}>ADD</button>
        <button className="btn btn-rst" style={{ padding: '5px 11px' }} onClick={onTreeReset}>↺</button>
      </div>

      {/* Keyboard strip */}
      <div id="kstrip" className={tab === 'tree' ? 'hidden' : ''}>
        <span className="kh"><span className="k">Space</span>Play/Pause</span>
        <span className="kh"><span className="k">→</span>Step</span>
        <span className="kh"><span className="k">R</span>Reset</span>
        <span className="kh"><span className="k">+/-</span>Speed</span>
      </div>
    </div>
  );
}
