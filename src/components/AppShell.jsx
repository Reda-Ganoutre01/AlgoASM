import Header from './Header';
import SidePanel from './SidePanel';
import CanvasView from './CanvasView';
import Footer from './Footer';

export default function AppShell({
  tab, algo, running, sortN, activeTree, uiTick,
  engine, treeEngine,
  onTabSwitch, onAlgoChange, onSizeChange, onStep, onToggleRun, onReset, onSpeedChange,
  onActiveTreeChange, onInsert, onTreeReset,
}) {
  return (
    <div id="app-shell" className="visible">
      <Header
        tab={tab} algo={algo} running={running} sortN={sortN}
        onTabSwitch={onTabSwitch} onAlgoChange={onAlgoChange}
        onSizeChange={onSizeChange} onStep={onStep}
        onToggleRun={onToggleRun} onReset={onReset} onSpeedChange={onSpeedChange}
      />

      <div id="app">
        <SidePanel
          tab={tab} algo={algo} activeTree={activeTree}
          running={running} uiTick={uiTick}
          engine={engine} treeEngine={treeEngine}
        />
        <CanvasView
          tab={tab} running={running} activeTree={activeTree}
          engine={engine} treeEngine={treeEngine} uiTick={uiTick}
          onActiveTreeChange={onActiveTreeChange}
          onInsert={onInsert}
          onTreeReset={onTreeReset}
        />
      </div>

      <Footer />
    </div>
  );
}
