// ── Color palette ─────────────────────────────────────────────────────────────
export const C = {
  bg:'#080b12', card:'#111827', border:'#1e2a3a', bhl:'#2d3f57',
  cyan:'#00d4ff', cdim:'#00d4ff22', green:'#00ff9d', gdim:'#00ff9d18',
  orange:'#ff8c42', red:'#ff4757', purple:'#a855f7', yellow:'#fbbf24',
  blue:'#3b82f6', t1:'#f0f6ff', t2:'#8899b4', t3:'#4a5568',
};

// ── Complexity table ───────────────────────────────────────────────────────────
export const CX = {
  bubble:   {b:'O(n)',      a:'O(n²)',      w:'O(n²)',      s:'O(1)'},
  selection:{b:'O(n²)',     a:'O(n²)',      w:'O(n²)',      s:'O(1)'},
  insertion:{b:'O(n)',      a:'O(n²)',      w:'O(n²)',      s:'O(1)'},
  quick:    {b:'O(n log n)',a:'O(n log n)', w:'O(n²)',      s:'O(log n)'},
  merge:    {b:'O(n log n)',a:'O(n log n)', w:'O(n log n)', s:'O(n)'},
  bfs:      {b:'O(V+E)',    a:'O(V+E)',     w:'O(V+E)',     s:'O(V)'},
  dfs:      {b:'O(V+E)',    a:'O(V+E)',     w:'O(V+E)',     s:'O(V)'},
  bst:      {b:'O(log n)', a:'O(log n)',   w:'O(n)',       s:'O(n)'},
  rbt:      {b:'O(log n)', a:'O(log n)',   w:'O(log n)',   s:'O(n)'},
};

// ── Info descriptions ──────────────────────────────────────────────────────────
export const INFO = {
  bubble:   'Compares adjacent elements and swaps if out of order. Repeats each pass until no swaps needed.',
  selection:'Finds the minimum in the unsorted region and swaps it to the front. Always O(n²).',
  insertion:'Inserts each element into its correct position in the sorted prefix. Great on nearly-sorted data.',
  quick:    'Picks a pivot, partitions smaller/larger elements, then recurses on both halves. Very fast in practice.',
  merge:    'Bottom-up: merges sorted runs of width 1→2→4→8… Stable — equal elements keep their order.',
  bfs:      'Queue-based: visits all neighbours before going deeper. Finds shortest path on unweighted graphs.',
  dfs:      'Stack-based: goes as deep as possible before backtracking. Great for cycle detection.',
  bst:      'Binary Search Tree: left<node<right. Balanced gives O(log n), degenerate gives O(n).',
  rbt:      'Self-balancing BST. Root=black, no consecutive reds, equal black-height all paths. Always O(log n).',
};

// ── Pseudocode ─────────────────────────────────────────────────────────────────
export const PSEUDO = {
  bubble:   ['procedure bubbleSort(A)','  for i ← 0 to n-2','    for j ← 0 to n-i-2','      compare A[j], A[j+1]','      if A[j] > A[j+1]','        swap(A[j], A[j+1])','  return A'],
  selection:['procedure selectionSort(A)','  for i ← 0 to n-2','    min ← i','    for j ← i+1 to n-1','      if A[j] < A[min]','        min ← j','    swap(A[i], A[min])','  return A'],
  insertion:['procedure insertionSort(A)','  for i ← 1 to n-1','    j ← i','    while j>0 and A[j-1]>A[j]','      swap(A[j-1], A[j])','      j ← j - 1','  return A'],
  quick:    ['quickSort(lo, hi):','  stack ← [(lo,hi)]','  while stack ≠ ∅','    (lo,hi) ← pop()','    pivot ← A[hi]; i ← lo-1','    for j ← lo to hi-1','      if A[j] ≤ pivot','        i++; swap(A[i],A[j])','    place pivot at i+1','    push sub-ranges'],
  merge:    ['mergeSort(A)  // bottom-up','  width ← 1','  while width < n','    for each pair of runs','      merge(left, mid, right)','    width ← width × 2'],
  bfs:      ['BFS(start):','  visited[start] ← true','  queue ← [start]','  while queue ≠ ∅','    node ← dequeue()','    for each neighbour','      if not visited','        mark + enqueue'],
  dfs:      ['DFS(start):','  visited[start] ← true','  stack ← [start]','  while stack ≠ ∅','    node ← top()','    if unvisited neighbour','      mark + push','    else','      pop() // backtrack'],
  bst:      ['BST_insert(val):','  cur ← root','  loop','    if val < cur.val','      go left','    else go right','    if slot empty','      place node here'],
  rbt:      ['RBT_insert(val):','  insert as BST (RED)','  fixup:','    while parent=RED','      if uncle=RED','        recolor all 3','      elif inner child','        rotate to outer','      else','        recolor+rotate gp','  root ← BLACK'],
};

// ── Graph data ─────────────────────────────────────────────────────────────────
export const GN = 9;
export const GA = [
  [0,1,1,0,0,0,0,0,0],[1,0,0,1,1,0,0,0,0],[1,0,0,0,0,1,0,0,0],
  [0,1,0,0,0,0,1,0,0],[0,1,0,0,0,0,0,1,0],[0,0,1,0,0,0,0,0,1],
  [0,0,0,1,0,0,0,0,0],[0,0,0,0,1,0,0,0,0],[0,0,0,0,0,1,0,0,0],
];
export const GX = [300,180,420,100,260,480,100,260,480];
export const GY = [ 60,160,160,260,260,260,360,360,360];
