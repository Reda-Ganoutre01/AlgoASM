export default function Header({
  tab, algo, running, sortN,
  onTabSwitch, onAlgoChange, onSizeChange, onStep, onToggleRun, onReset, onSpeedChange,
}) {
  const isTree = tab === 'tree';

  const sortOptions = [
    ['bubble',    'Bubble Sort'],
    ['selection', 'Selection Sort'],
    ['insertion', 'Insertion Sort'],
    ['quick',     'Quick Sort'],
    ['merge',     'Merge Sort'],
  ];
  const graphOptions = [
    ['bfs', 'BFS — Breadth First'],
    ['dfs', 'DFS — Depth First'],
  ];

  const options = tab === 'sort' ? sortOptions : tab === 'graph' ? graphOptions : [];

  return (
    <header id="hdr">
      <div id="logo">
        <div id="logo-icon">⚡</div>
        <span id="logo-name">AlgoASM</span>
      </div>

      <nav id="tabs">
        <button id="tab-sort"  className={`tb${tab === 'sort'  ? ' on' : ''}`} onClick={() => onTabSwitch('sort')}>📊 SORT</button>
        <button id="tab-tree"  className={`tb${tab === 'tree'  ? ' on' : ''}`} onClick={() => onTabSwitch('tree')}>🌳 TREES</button>
        <button id="tab-graph" className={`tb${tab === 'graph' ? ' on' : ''}`} onClick={() => onTabSwitch('graph')}>🕸 GRAPH</button>
      </nav>

      <div id="ctrls">
        <select
          id="asel"
          className="sel"
          value={isTree ? '' : algo}
          disabled={isTree}
          onChange={e => onAlgoChange(e.target.value)}
        >
          {isTree
            ? <option value="">— Tree Mode —</option>
            : options.map(([v, l]) => <option key={v} value={v}>{l}</option>)
          }
        </select>

        {tab === 'sort' && (
          <div className="sz-grp" id="sz-grp">
            <span className="sz-lbl">N=</span>
            <input
              type="range" id="sz-r" min="10" max="120" value={sortN}
              onChange={e => onSizeChange(Number(e.target.value))}
            />
            <span className="sz-lbl" id="sz-v">{sortN}</span>
          </div>
        )}

        <button id="btn-stp" className="btn btn-stp" disabled={isTree} onClick={onStep}>▸ STEP</button>
        <button id="btn-run" className="btn btn-run" disabled={isTree} onClick={onToggleRun}>
          {running ? '⏸ PAUSE' : '▶ START'}
        </button>
        <button id="btn-rst" className="btn btn-rst" onClick={onReset}>↺ RESET</button>

        <div className="spd-g">
          <span className="spd-l">SPD</span>
          <input type="range" id="spd-r" min="1" max="100" defaultValue="50" onChange={e => onSpeedChange(Number(e.target.value))} />
        </div>
      </div>
    </header>
  );
}
