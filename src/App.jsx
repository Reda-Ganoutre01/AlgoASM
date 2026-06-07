import { useState, useEffect, useCallback } from 'react';
import IntroScreen     from './screens/IntroScreen';
import ModeMenuScreen  from './screens/ModeMenuScreen';
import AppShell        from './components/AppShell';
import { useAlgoEngine }  from './hooks/useAlgoEngine';
import { useTreeEngine }  from './hooks/useTreeEngine';

export default function App() {
  const [screen, setScreen]     = useState('intro');   // 'intro' | 'menu' | 'app'
  const [tab,    setTab]        = useState('sort');
  const [algo,   setAlgo]       = useState('bubble');
  const [running, setRunning]   = useState(false);
  const [sortN,  setSortN]      = useState(50);
  const [activeTree, setActiveTree] = useState('bst');
  const [uiTick, setUiTick]    = useState(0); // increment to force SidePanel re-render

  const engine     = useAlgoEngine();
  const treeEngine = useTreeEngine();

  // Wire run-done callback so render loop can trigger UI update
  window.__onRunDone = () => {
    setRunning(false);
    setUiTick(t => t + 1);
  };

  // ── Initialise app ─────────────────────────────────────────────────────────
  function startApp(initialTab) {
    engine.tab.current   = initialTab;
    engine.algo.current  = initialTab === 'graph' ? 'bfs' : 'bubble';
    setAlgo(engine.algo.current);
    treeEngine.resetBST();
    treeEngine.resetRBT();
    if (initialTab === 'sort') engine.resetSort();
    else if (initialTab === 'graph') engine.resetGraph();
    setTab(initialTab);
    setScreen('app');
  }

  // ── Tab switch ─────────────────────────────────────────────────────────────
  const handleTabSwitch = useCallback((t) => {
    engine.running.current = false; engine.acc.current = 0; engine.phl.current = -1;
    engine.tab.current = t;
    setRunning(false);

    if (t === 'sort') {
      if (!['bubble','selection','insertion','quick','merge'].includes(engine.algo.current)) {
        engine.algo.current = 'bubble';
        setAlgo('bubble');
      }
      engine.resetSort();
    } else if (t === 'tree') {
      treeEngine.resetBST(); treeEngine.resetRBT();
    } else if (t === 'graph') {
      if (!['bfs','dfs'].includes(engine.algo.current)) {
        engine.algo.current = 'bfs';
        setAlgo('bfs');
      }
      engine.resetGraph();
    }
    setTab(t);
    setUiTick(n => n + 1);
  }, [engine, treeEngine]);

  // ── Algo change ────────────────────────────────────────────────────────────
  const handleAlgoChange = useCallback((v) => {
    engine.algo.current = v; engine.running.current = false; engine.acc.current = 0;
    setAlgo(v); setRunning(false);
    if (tab === 'sort') engine.resetSort();
    if (tab === 'graph') engine.resetGraph();
    setUiTick(n => n + 1);
  }, [engine, tab]);

  // ── Size change ────────────────────────────────────────────────────────────
  const handleSizeChange = useCallback((v) => {
    engine.SORT_N.current = v; engine.running.current = false;
    setSortN(v); setRunning(false);
    if (tab === 'sort') engine.resetSort();
    setUiTick(n => n + 1);
  }, [engine, tab]);

  // ── Step ───────────────────────────────────────────────────────────────────
  const handleStep = useCallback(() => {
    if (tab === 'tree') return;
    if (engine.running.current) { engine.running.current = false; setRunning(false); }
    const done = engine.oneStep();
    if (done) engine.sortDone.current = tab === 'sort';
    setUiTick(n => n + 1);
  }, [engine, tab]);

  // ── Toggle run ─────────────────────────────────────────────────────────────
  const handleToggleRun = useCallback(() => {
    if (tab === 'tree') return;
    engine.running.current = !engine.running.current;
    engine.acc.current = 0;
    engine.lastT.current = performance.now();
    setRunning(engine.running.current);
  }, [engine, tab]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    engine.running.current = false; engine.acc.current = 0; engine.phl.current = -1;
    engine.comparisons.current = 0; engine.swaps.current = 0;
    engine.sortDone.current = false;
    setRunning(false);
    if (tab === 'sort') engine.resetSort();
    else if (tab === 'tree') { treeEngine.resetBST(); treeEngine.resetRBT(); }
    else if (tab === 'graph') engine.resetGraph();
    setUiTick(n => n + 1);
  }, [engine, treeEngine, tab]);

  // ── Speed ──────────────────────────────────────────────────────────────────
  const handleSpeedChange = useCallback((v) => { engine.speed.current = v; }, [engine]);

  // ── Tree insert / reset ────────────────────────────────────────────────────
  const handleInsert = useCallback((val, type) => {
    treeEngine.insert(val, type);
    engine.stepCount.current++;
    setUiTick(n => n + 1);
  }, [treeEngine, engine]);

  const handleTreeReset = useCallback(() => {
    treeEngine.doTreeReset();
    engine.stepCount.current = 0; engine.comparisons.current = 0; engine.swaps.current = 0;
    setUiTick(n => n + 1);
  }, [treeEngine, engine]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (screen !== 'app') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      switch (e.key) {
        case ' ':          e.preventDefault(); handleToggleRun(); break;
        case 'ArrowRight': e.preventDefault(); handleStep();      break;
        case 'r': case 'R': handleReset(); break;
        case '+': case '=':
          engine.speed.current = Math.min(100, engine.speed.current + 10);
          document.getElementById('spd-r') && (document.getElementById('spd-r').value = engine.speed.current);
          break;
        case '-':
          engine.speed.current = Math.max(1, engine.speed.current - 10);
          document.getElementById('spd-r') && (document.getElementById('spd-r').value = engine.speed.current);
          break;
        case '1': handleTabSwitch('sort');  break;
        case '2': handleTabSwitch('tree');  break;
        case '3': handleTabSwitch('graph'); break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, handleToggleRun, handleStep, handleReset, handleTabSwitch, engine]);

  // ── Periodic UI tick (keeps stats fresh during animation) ─────────────────
  useEffect(() => {
    if (screen !== 'app') return;
    const iv = setInterval(() => setUiTick(n => n + 1), 80);
    return () => clearInterval(iv);
  }, [screen]);

  // ── Screens ────────────────────────────────────────────────────────────────
  return (
    <>
      {screen === 'intro' && (
        <IntroScreen onContinue={() => setScreen('menu')} />
      )}

      <ModeMenuScreen
        visible={screen === 'menu'}
        onPick={(t) => startApp(t)}
      />

      {screen === 'app' && (
        <AppShell
          tab={tab} algo={algo} running={running} sortN={sortN}
          activeTree={activeTree} uiTick={uiTick}
          engine={engine} treeEngine={treeEngine}
          onTabSwitch={handleTabSwitch}
          onAlgoChange={handleAlgoChange}
          onSizeChange={handleSizeChange}
          onStep={handleStep}
          onToggleRun={handleToggleRun}
          onReset={handleReset}
          onSpeedChange={handleSpeedChange}
          onActiveTreeChange={v => { setActiveTree(v); window.__activeTree = v; setUiTick(n => n + 1); }}
          onInsert={handleInsert}
          onTreeReset={handleTreeReset}
        />
      )}
    </>
  );
}
