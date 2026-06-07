/* ════════════════════════════════════════════════
   INTRO ANIMATION
════════════════════════════════════════════════ */
(function(){
  const ic=document.getElementById('intro-canvas');
  const ix=ic.getContext('2d');
  let W,H,towers=[],t=0,logoReady=false,rafId;

  function resize(){W=ic.width=innerWidth;H=ic.height=innerHeight;}
  resize();window.addEventListener('resize',resize);

  // Build towers
  function initTowers(){
    towers=[];
    const count=Math.floor(W/13)+1;
    for(let i=0;i<count;i++){
      const rand=Math.random();
      towers.push({
        x:i*13,w:10,
        target:rand<0.15?0:60+Math.random()*H*0.75,
        cur:0,spd:2+Math.random()*5,
        delay:Math.random()*55,
        hue:190+Math.random()*45,done:false,
      });
    }
  }
  initTowers();

  // Build letter spans for title
  const title='AlgoASM';
  const el=document.getElementById('intro-title');
  el.innerHTML='';
  title.split('').forEach((ch,i)=>{
    const span=document.createElement('span');
    span.className='title-letter';
    span.textContent=ch==' '?'\u00a0':ch;
    span.style.animationDelay=(0.8+i*0.08)+'s';
    el.appendChild(span);
  });

  function drawFrame(){
    rafId=requestAnimationFrame(drawFrame);
    t++;

    // Background
    ix.fillStyle='#000';ix.fillRect(0,0,W,H);

    // Nebula
    const g=ix.createRadialGradient(W/2,H*0.9,0,W/2,H*0.4,Math.max(W,H)*0.85);
    g.addColorStop(0,'#00203855');g.addColorStop(0.5,'#00101e33');g.addColorStop(1,'transparent');
    ix.fillStyle=g;ix.fillRect(0,0,W,H);

    // Towers
    let allDone=true;
    for(const tw of towers){
      if(t<tw.delay){allDone=false;continue;}
      if(!tw.done){
        tw.cur=Math.min(tw.cur+tw.spd,tw.target);
        if(tw.cur<tw.target)allDone=false; else tw.done=true;
      }
      if(tw.cur<=0)continue;
      const y=H-tw.cur;
      // Glow
      const gl=ix.createLinearGradient(tw.x,y,tw.x,H);
      gl.addColorStop(0,`hsla(${tw.hue},80%,50%,0.04)`);
      gl.addColorStop(1,`hsla(${tw.hue},80%,40%,0.2)`);
      ix.fillStyle=gl;ix.fillRect(tw.x-5,y,tw.w+10,tw.cur);
      // Bar
      const bar=ix.createLinearGradient(tw.x,y,tw.x,H);
      bar.addColorStop(0,`hsla(${tw.hue},90%,65%,0.85)`);
      bar.addColorStop(1,`hsla(${tw.hue},70%,40%,0.5)`);
      ix.fillStyle=bar;ix.fillRect(tw.x,y,tw.w,tw.cur);
      // Glint
      ix.fillStyle=`hsla(${tw.hue},100%,90%,0.75)`;ix.fillRect(tw.x,y,tw.w,1.5);
      // Shimmer
      if(allDone) tw.cur+=Math.sin(t*0.035+tw.x)*0.5;
    }
    // Scanlines
    ix.fillStyle='rgba(0,0,0,0.05)';
    for(let y=0;y<H;y+=3)ix.fillRect(0,y,W,1);

    if(allDone&&!logoReady){
      logoReady=true;
      document.getElementById('intro-press').style.pointerEvents='all';
    }
  }
  rafId=requestAnimationFrame(drawFrame);

  window._stopIntroRaf=()=>cancelAnimationFrame(rafId);
  window._introLogoReady=()=>logoReady;
})();

/* ════ TIRE-SCRATCH ANIMATION ════ */
let _scratchRaf=null;

function startScratchAnim(){
  const sc = document.getElementById('scratch-canvas');
  const sx = sc.getContext('2d');
  const CX = 260, CY = 260;         // canvas center
  const ORBIT_R = 190;               // card orbit radius (px from center)

  // Cards to orbit
  const cards = [
    { el: document.getElementById('mc-sort'),  color:'#ff8c42', baseAngle: -Math.PI/2         }, // top
    { el: document.getElementById('mc-tree'),  color:'#00ff9d', baseAngle: -Math.PI/2 + 2*Math.PI/3 }, // bottom-left
    { el: document.getElementById('mc-graph'), color:'#a855f7', baseAngle: -Math.PI/2 + 4*Math.PI/3 }, // bottom-right
  ];

  // SVG connector lines
  const svgLines = document.querySelectorAll('#mode-lines line');

  // Three scratch tires aligned to each card orbit radius
  const tires = [
    { r: ORBIT_R,     angle: -Math.PI/2,                   speed:  0.016, width: 8,  color:'#ff8c42', alpha: 0.80, smoke: true  },
    { r: ORBIT_R,     angle: -Math.PI/2 + 2*Math.PI/3,     speed:  0.016, width: 8,  color:'#00ff9d', alpha: 0.80, smoke: true  },
    { r: ORBIT_R,     angle: -Math.PI/2 + 4*Math.PI/3,     speed:  0.016, width: 8,  color:'#a855f7', alpha: 0.80, smoke: false },
    { r: ORBIT_R*0.6, angle: 0,                             speed: -0.030, width: 5,  color:'#00d4ff', alpha: 0.55, smoke: false },
  ];

  const particles = [];
  function spawnParticle(tire){
    const px = CX + Math.cos(tire.angle)*tire.r;
    const py = CY + Math.sin(tire.angle)*tire.r;
    const tang = tire.angle + (tire.speed > 0 ? Math.PI/2 : -Math.PI/2);
    const spread = (Math.random()-0.5)*1.2;
    const v = 0.5 + Math.random()*1.8;
    particles.push({
      x:px,y:py,
      vx:Math.cos(tang+spread)*v,
      vy:Math.sin(tang+spread)*v,
      life:1, decay:0.014+Math.random()*0.02,
      size:1+Math.random()*3,
      col:tire.color,
      type:Math.random()<0.5?'smoke':'chunk',
    });
  }

  const TRAIL = 280;
  tires.forEach(t => { t.history=[]; t.wobble=0; });

  let frame = 0;
  let orbitAngle = 0;   // master orbit angle for all three cards
  const ORBIT_SPEED = 0.016;  // must match tire[0..2].speed

  // Fade cards in
  setTimeout(()=>cards.forEach(c=>c.el.classList.add('visible')), 200);

  function draw(){
    _scratchRaf = requestAnimationFrame(draw);
    frame++;
    orbitAngle += ORBIT_SPEED;

    /* ── UPDATE CARD POSITIONS ── */
    cards.forEach((c, i) => {
      const angle = c.baseAngle + orbitAngle;
      const px = CX + Math.cos(angle)*ORBIT_R;  // position in 520px canvas space
      const py = CY + Math.sin(angle)*ORBIT_R;
      // Convert to ring-div space (left/top already centered at 260,260)
      // el is positioned left:260px top:260px with margin -70 -70
      c.el.style.transform = `translate(${px-CX}px,${py-CY}px)`;
      // Store screen position for SVG lines
      c._px = px; c._py = py;
    });

    /* ── UPDATE SVG CONNECTOR LINES ── */
    cards.forEach((c, i) => {
      if(svgLines[i]){
        svgLines[i].setAttribute('x2', c._px.toFixed(1));
        svgLines[i].setAttribute('y2', c._py.toFixed(1));
      }
    });

    /* ── SCRATCH CANVAS ── */
    sx.fillStyle = 'rgba(0,0,0,0.022)';
    sx.fillRect(0,0,520,520);

    // Sync tire angles to orbit
    tires[0].angle = cards[0].baseAngle + orbitAngle;
    tires[1].angle = cards[1].baseAngle + orbitAngle;
    tires[2].angle = cards[2].baseAngle + orbitAngle;
    tires[3].angle += tires[3].speed;  // inner ring free-spinning

    for(const t of tires){
      t.wobble = Math.sin(frame*0.09 + t.r)*0.006;
      if(t === tires[3]) t.angle += t.wobble; // only wobble inner

      const px = CX + Math.cos(t.angle)*t.r;
      const py = CY + Math.sin(t.angle)*t.r;
      t.history.push({x:px, y:py});
      if(t.history.length > TRAIL) t.history.shift();

      if(t.history.length > 2){
        for(let i=1; i<t.history.length; i++){
          const prog = i/t.history.length;
          const prev = t.history[i-1], cur = t.history[i];
          const alpha = prog * t.alpha * (0.65 + Math.sin(i*0.22)*0.35);
          const noise = 1 + Math.sin(i*0.41 + frame*0.06)*0.55;
          const w = t.width * noise * prog;

          // Rubber underlay
          sx.beginPath(); sx.moveTo(prev.x,prev.y); sx.lineTo(cur.x,cur.y);
          sx.strokeStyle = `rgba(6,5,3,${alpha*0.88})`;
          sx.lineWidth = w + 2; sx.lineCap = 'round'; sx.stroke();

          // Colour tint
          sx.beginPath(); sx.moveTo(prev.x,prev.y); sx.lineTo(cur.x,cur.y);
          sx.strokeStyle = t.color + Math.floor(alpha*170).toString(16).padStart(2,'0');
          sx.lineWidth = Math.max(0.4, w*0.32); sx.stroke();

          // Chalk edge marks every 5 segments
          if(i%5===0){
            const perp = Math.atan2(cur.y-prev.y, cur.x-prev.x) + Math.PI/2;
            for(const sign of [1,-1]){
              sx.beginPath();
              sx.moveTo(cur.x, cur.y);
              sx.lineTo(cur.x + Math.cos(perp)*sign*t.width*0.55,
                        cur.y + Math.sin(perp)*sign*t.width*0.55);
              sx.strokeStyle = `rgba(200,180,140,${alpha*0.2})`;
              sx.lineWidth = 0.7; sx.stroke();
            }
          }
        }
      }

      // Hot-spot glow at contact
      const grd = sx.createRadialGradient(px,py,0,px,py,t.width*2.5);
      grd.addColorStop(0, t.color+'dd');
      grd.addColorStop(0.5, t.color+'44');
      grd.addColorStop(1, 'transparent');
      sx.beginPath(); sx.arc(px,py,t.width*2.5,0,Math.PI*2);
      sx.fillStyle = grd; sx.fill();

      if(t.smoke && frame%3===0) spawnParticle(t);
      else if(!t.smoke && frame%7===0) spawnParticle(t);
    }

    // Particles
    for(let i=particles.length-1; i>=0; i--){
      const p = particles[i];
      p.x+=p.vx; p.y+=p.vy;
      p.vx*=0.95; p.vy*=0.95;
      p.life -= p.decay;
      if(p.life<=0){particles.splice(i,1);continue;}
      if(p.type==='smoke'){
        const r = p.size*(2.2-p.life)*3.5;
        const sg = sx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);
        sg.addColorStop(0, `rgba(55,45,35,${p.life*0.16})`);
        sg.addColorStop(1, 'transparent');
        sx.beginPath(); sx.arc(p.x,p.y,r,0,Math.PI*2);
        sx.fillStyle = sg; sx.fill();
      } else {
        sx.beginPath(); sx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);
        sx.fillStyle = p.col + Math.floor(p.life*200).toString(16).padStart(2,'0');
        sx.fill();
      }
    }

    // Center hub glow
    const hgrd = sx.createRadialGradient(CX,CY,0,CX,CY,38);
    hgrd.addColorStop(0,'rgba(0,212,255,0.14)');
    hgrd.addColorStop(1,'transparent');
    sx.beginPath(); sx.arc(CX,CY,38,0,Math.PI*2);
    sx.fillStyle = hgrd; sx.fill();
  }

  draw();
}

function stopScratchAnim(){
  if(_scratchRaf){cancelAnimationFrame(_scratchRaf);_scratchRaf=null;}
}

function showModeMenu(){
  if(!window._introLogoReady()) return;
  window._stopIntroRaf();

  const intro=document.getElementById('intro');
  intro.classList.add('fade-out');
  setTimeout(()=>intro.style.display='none', 800);

  document.getElementById('app-shell').classList.add('visible');

  const ov=document.getElementById('mode-overlay');
  ov.classList.add('show');

  // Start tire-scratch after overlay fades in
  setTimeout(startScratchAnim, 420);
}

function pickMode(tab){
  stopScratchAnim();
  const ov=document.getElementById('mode-overlay');
  ov.style.transition='opacity 0.3s ease';
  ov.style.opacity='0';
  setTimeout(()=>{ov.style.display='none';},320);
  startApp(tab);
}

/* ════════════════════════════════════════════════
   ALGORITHM DATA
════════════════════════════════════════════════ */
const C={
  bg:'#080b12',card:'#111827',border:'#1e2a3a',bhl:'#2d3f57',
  cyan:'#00d4ff',cdim:'#00d4ff22',green:'#00ff9d',gdim:'#00ff9d18',
  orange:'#ff8c42',red:'#ff4757',purple:'#a855f7',yellow:'#fbbf24',
  blue:'#3b82f6',t1:'#f0f6ff',t2:'#8899b4',t3:'#4a5568',
};
const CX={
  bubble:   {b:'O(n)',      a:'O(n²)',     w:'O(n²)',     s:'O(1)'},
  selection:{b:'O(n²)',     a:'O(n²)',     w:'O(n²)',     s:'O(1)'},
  insertion:{b:'O(n)',      a:'O(n²)',     w:'O(n²)',     s:'O(1)'},
  quick:    {b:'O(n log n)',a:'O(n log n)',w:'O(n²)',     s:'O(log n)'},
  merge:    {b:'O(n log n)',a:'O(n log n)',w:'O(n log n)',s:'O(n)'},
  bfs:      {b:'O(V+E)',    a:'O(V+E)',    w:'O(V+E)',    s:'O(V)'},
  dfs:      {b:'O(V+E)',    a:'O(V+E)',    w:'O(V+E)',    s:'O(V)'},
  bst:      {b:'O(log n)', a:'O(log n)', w:'O(n)',      s:'O(n)'},
  rbt:      {b:'O(log n)', a:'O(log n)', w:'O(log n)', s:'O(n)'},
};
const INFO={
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
const PSEUDO={
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

/* ════════════════════════════════════════════════
   CANVAS & STATE
════════════════════════════════════════════════ */
const canvas=document.getElementById('cv');
const ctx=canvas.getContext('2d');
let tab='sort',algo='bubble',running=false,speed=50,stepCount=0;
let lastT=0,acc=0,phl=-1;
let SORT_N=50;

// Sort
let arr=[],cmpA=-1,cmpB=-1,comparisons=0,swaps=0;
let sortedIdx=new Set(),sortDone=false,sortState={};
let mergeBands=[],pivotIdx=-1;

// Trees
let bstNodes=[],rbtNodes=[],rbtRoot=-1,activeTree='bst';
const RED='red',BLACK='black';

// Graph
const GN=9;
const GA=[[0,1,1,0,0,0,0,0,0],[1,0,0,1,1,0,0,0,0],[1,0,0,0,0,1,0,0,0],
          [0,1,0,0,0,0,1,0,0],[0,1,0,0,0,0,0,1,0],[0,0,1,0,0,0,0,0,1],
          [0,0,0,1,0,0,0,0,0],[0,0,0,0,1,0,0,0,0],[0,0,0,0,0,1,0,0,0]];
const GX=[300,180,420,100,260,480,100,260,480];
const GY=[ 60,160,160,260,260,260,360,360,360];
let gvis=[],gcur=-1,gq=[],gstk=[],gdone=false,gpath=[],gedges=[];

function resizeCv(){const w=document.getElementById('cvwrap');canvas.width=w.clientWidth;canvas.height=w.clientHeight;}
window.addEventListener('resize',()=>{resizeCv();render();});

/* ════ SORT ALGORITHMS ════ */
function makeArr(){const a=[];for(let i=1;i<=SORT_N;i++)a.push(i);for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function resetSort(){arr=makeArr();comparisons=0;swaps=0;cmpA=-1;cmpB=-1;sortedIdx=new Set();sortDone=false;stepCount=0;phl=-1;mergeBands=[];pivotIdx=-1;switch(algo){case'bubble':sortState={i:0,j:0};break;case'selection':sortState={i:0,j:1,mi:0};break;case'insertion':sortState={i:1,j:1};break;case'quick':sortState={stk:[[0,arr.length-1]],lo:0,hi:arr.length-1,ph:'init',i:-1,j:0,pv:0};pivotIdx=arr.length-1;break;case'merge':sortState={w:1,lft:0,ph:'next',mL:0,mM:0,mR:0,mI:0,mJ:0,mK:0,tmp:[]};initMSeg();break;}}
function bblStp(){const s=sortState,n=arr.length;if(s.i>=n-1){for(let x=0;x<n;x++)sortedIdx.add(x);phl=6;return true;}if(s.j>=n-s.i-1){sortedIdx.add(n-s.i-1);s.i++;s.j=0;cmpA=-1;cmpB=-1;phl=1;return false;}cmpA=s.j;cmpB=s.j+1;comparisons++;phl=3;if(arr[cmpA]>arr[cmpB]){[arr[cmpA],arr[cmpB]]=[arr[cmpB],arr[cmpA]];swaps++;phl=5;}s.j++;return false;}
function selStp(){const s=sortState,n=arr.length;if(s.i>=n-1){for(let x=0;x<n;x++)sortedIdx.add(x);phl=7;return true;}if(s.j>=n){if(s.mi!==s.i){[arr[s.i],arr[s.mi]]=[arr[s.mi],arr[s.i]];swaps++;phl=6;}sortedIdx.add(s.i);s.i++;s.j=s.i+1;s.mi=s.i;cmpA=-1;cmpB=-1;return false;}cmpA=s.mi;cmpB=s.j;comparisons++;phl=4;if(arr[s.j]<arr[s.mi]){s.mi=s.j;phl=5;}s.j++;return false;}
function insStp(){const s=sortState,n=arr.length;if(s.i>=n){for(let x=0;x<n;x++)sortedIdx.add(x);phl=6;return true;}if(s.j<=0||arr[s.j-1]<=arr[s.j]){sortedIdx.add(s.i);s.i++;if(s.i<n)s.j=s.i;cmpA=-1;cmpB=-1;phl=1;return s.i>=n;}cmpA=s.j-1;cmpB=s.j;comparisons++;phl=3;if(arr[cmpA]>arr[cmpB]){[arr[cmpA],arr[cmpB]]=[arr[cmpB],arr[cmpA]];swaps++;phl=4;s.j--;}return false;}
function qkStp(){const s=sortState;if(s.stk.length===0){for(let x=0;x<arr.length;x++)sortedIdx.add(x);cmpA=-1;cmpB=-1;pivotIdx=-1;phl=2;return true;}const[lo,hi]=s.stk[s.stk.length-1];if(lo>=hi){s.stk.pop();if(lo===hi)sortedIdx.add(lo);return false;}if(s.lo!==lo||s.hi!==hi||s.ph==='init'){s.lo=lo;s.hi=hi;s.pv=arr[hi];s.i=lo-1;s.j=lo;s.ph='part';pivotIdx=hi;phl=4;}if(s.ph==='part'){if(s.j<hi){cmpA=s.j;cmpB=hi;comparisons++;phl=6;if(arr[s.j]<=s.pv){s.i++;if(s.i!==s.j){[arr[s.i],arr[s.j]]=[arr[s.j],arr[s.i]];swaps++;phl=7;}}s.j++;return false;}else{const pi=s.i+1;if(pi!==hi){[arr[pi],arr[hi]]=[arr[hi],arr[pi]];swaps++;}sortedIdx.add(pi);cmpA=pi;cmpB=-1;pivotIdx=pi;s.stk.pop();if(pi-1>lo)s.stk.push([lo,pi-1]);if(pi+1<hi)s.stk.push([pi+1,hi]);s.ph='init';phl=8;return false;}}return false;}
function initMSeg(){const s=sortState,n=arr.length;while(s.lft>=n){s.w*=2;s.lft=0;if(s.w>=n){mergeBands=[];return true;}}s.mL=s.lft;s.mM=Math.min(s.lft+s.w-1,n-1);s.mR=Math.min(s.lft+2*s.w-1,n-1);s.lft=s.mR+1;s.mI=s.mL;s.mJ=s.mM+1;s.mK=s.mL;s.tmp=arr.slice(s.mL,s.mR+1);s.ph='merge';mergeBands=[{L:s.mL,M:s.mM,R:s.mR}];return false;}
function mrgStp(){const s=sortState,n=arr.length;if(s.w>=n){for(let x=0;x<n;x++)sortedIdx.add(x);cmpA=-1;cmpB=-1;mergeBands=[];phl=5;return true;}if(s.ph==='next'){const done=initMSeg();phl=3;if(done){for(let x=0;x<n;x++)sortedIdx.add(x);return true;}return false;}const{mL,mM,mR,tmp}=s;if(s.mI<=mM&&s.mJ<=mR){cmpA=s.mI;cmpB=s.mJ;comparisons++;phl=4;if(tmp[s.mI-mL]<=tmp[s.mJ-mL]){arr[s.mK]=tmp[s.mI-mL];s.mI++;}else{arr[s.mK]=tmp[s.mJ-mL];s.mJ++;swaps++;}s.mK++;}else if(s.mI<=mM){arr[s.mK]=tmp[s.mI-mL];s.mI++;s.mK++;cmpA=-1;cmpB=-1;}else if(s.mJ<=mR){arr[s.mK]=tmp[s.mJ-mL];s.mJ++;s.mK++;cmpA=-1;cmpB=-1;}else{s.ph='next';cmpA=-1;cmpB=-1;mergeBands=[];}return false;}
function sortStp(){stepCount++;switch(algo){case'bubble':return bblStp();case'selection':return selStp();case'insertion':return insStp();case'quick':return qkStp();case'merge':return mrgStp();}return true;}

/* ════ BST ════ */
function bstIns(val,nodes){if(!nodes.length){nodes.push({val,left:-1,right:-1,x:canvas.width/2,y:55,isNew:true});return;}let i=0,dx=90;while(true){if(val===nodes[i].val)return;if(val<nodes[i].val){if(nodes[i].left===-1){nodes[i].left=nodes.length;nodes.push({val,left:-1,right:-1,x:nodes[i].x-dx,y:nodes[i].y+70,isNew:true});return;}i=nodes[i].left;}else{if(nodes[i].right===-1){nodes[i].right=nodes.length;nodes.push({val,left:-1,right:-1,x:nodes[i].x+dx,y:nodes[i].y+70,isNew:true});return;}i=nodes[i].right;}dx=Math.max(dx*0.56,22);}}
function layoutTree(nodes,root){if(!nodes.length||root===-1)return;const ord=[];function io(i){if(i===-1)return;io(nodes[i].left);ord.push(i);io(nodes[i].right);}io(root);const slot=canvas.width/(ord.length+1);ord.forEach((idx,r)=>nodes[idx].x=slot*(r+1));function dep(i,d){if(i===-1)return;nodes[i].y=55+d*72;dep(nodes[i].left,d+1);dep(nodes[i].right,d+1);}dep(root,0);}
function resetBST(){bstNodes=[];[50,30,70,20,40,60,80,10,25,35].forEach(v=>bstIns(v,bstNodes));layoutTree(bstNodes,0);bstNodes.forEach(n=>n.isNew=false);stepCount=0;}

/* ════ RBT ════ */
function rbtMk(val){return{val,color:RED,left:-1,right:-1,parent:-1,x:0,y:0,isNew:false};}
function rbtRL(z){const y=rbtNodes[z].right,p=rbtNodes[z].parent;rbtNodes[z].right=rbtNodes[y].left;if(rbtNodes[y].left!==-1)rbtNodes[rbtNodes[y].left].parent=z;rbtNodes[y].parent=p;if(p===-1)rbtRoot=y;else if(z===rbtNodes[p].left)rbtNodes[p].left=y;else rbtNodes[p].right=y;rbtNodes[y].left=z;rbtNodes[z].parent=y;}
function rbtRR(z){const y=rbtNodes[z].left,p=rbtNodes[z].parent;rbtNodes[z].left=rbtNodes[y].right;if(rbtNodes[y].right!==-1)rbtNodes[rbtNodes[y].right].parent=z;rbtNodes[y].parent=p;if(p===-1)rbtRoot=y;else if(z===rbtNodes[p].right)rbtNodes[p].right=y;else rbtNodes[p].left=y;rbtNodes[y].right=z;rbtNodes[z].parent=y;}
function rbtFix(z){while(rbtNodes[z].parent!==-1&&rbtNodes[rbtNodes[z].parent].color===RED){const p=rbtNodes[z].parent,gp=rbtNodes[p].parent;if(gp===-1)break;if(p===rbtNodes[gp].left){const u=rbtNodes[gp].right;if(u!==-1&&rbtNodes[u].color===RED){rbtNodes[p].color=BLACK;rbtNodes[u].color=BLACK;rbtNodes[gp].color=RED;z=gp;}else{if(z===rbtNodes[p].right){z=p;rbtRL(z);}rbtNodes[rbtNodes[z].parent].color=BLACK;rbtNodes[rbtNodes[rbtNodes[z].parent].parent].color=RED;rbtRR(rbtNodes[rbtNodes[z].parent].parent);}}else{const u=rbtNodes[gp].left;if(u!==-1&&rbtNodes[u].color===RED){rbtNodes[p].color=BLACK;rbtNodes[u].color=BLACK;rbtNodes[gp].color=RED;z=gp;}else{if(z===rbtNodes[p].left){z=p;rbtRR(z);}rbtNodes[rbtNodes[z].parent].color=BLACK;rbtNodes[rbtNodes[rbtNodes[z].parent].parent].color=RED;rbtRL(rbtNodes[rbtNodes[z].parent].parent);}}}rbtNodes[rbtRoot].color=BLACK;}
function rbtIns(val){let y=-1,x=rbtRoot;while(x!==-1){if(val===rbtNodes[x].val)return;y=x;x=val<rbtNodes[x].val?rbtNodes[x].left:rbtNodes[x].right;}const idx=rbtNodes.length;rbtNodes.push(rbtMk(val));rbtNodes[idx].parent=y;if(y===-1)rbtRoot=idx;else if(val<rbtNodes[y].val)rbtNodes[y].left=idx;else rbtNodes[y].right=idx;rbtFix(idx);layoutTree(rbtNodes,rbtRoot);}
function resetRBT(){rbtNodes=[];rbtRoot=-1;[41,38,31,12,19,8,55,66,22].forEach(v=>rbtIns(v));rbtNodes.forEach(n=>n.isNew=false);stepCount=0;}

/* ════ GRAPH ════ */
function resetGraph(){gvis=new Array(GN).fill(false);gcur=-1;gq=[];gstk=[];gdone=false;gpath=[];gedges=[];stepCount=0;comparisons=0;swaps=0;phl=1;if(algo==='bfs'){gq.push(0);gvis[0]=true;gcur=0;}else{gstk.push(0);gvis[0]=true;gcur=0;}gpath.push(0);}
function bfsStp(){if(gq.length===0){gdone=true;phl=7;return true;}const node=gq.shift();gcur=node;comparisons++;phl=4;for(let i=0;i<GN;i++)if(GA[node][i]&&!gvis[i]){gvis[i]=true;gq.push(i);gpath.push(i);gedges.push([node,i]);swaps++;phl=7;}stepCount++;if(gq.length===0){gdone=true;return true;}return false;}
function dfsStp(){if(gstk.length===0){gdone=true;phl=8;return true;}const node=gstk[gstk.length-1];gcur=node;comparisons++;phl=4;let f=false;for(let i=0;i<GN;i++)if(GA[node][i]&&!gvis[i]){gvis[i]=true;gstk.push(i);gpath.push(i);gedges.push([node,i]);f=true;swaps++;phl=6;break;}if(!f){gstk.pop();phl=8;}stepCount++;if(gstk.length===0){gdone=true;return true;}return false;}
function graphStp(){if(gdone)return true;return algo==='bfs'?bfsStp():dfsStp();}

/* ════ UNIFIED STEP ════ */
function oneStep(){
  let done=false;
  if(tab==='sort')done=sortStp();
  else if(tab==='graph')done=graphStp();
  updateUI();updatePseudo();
  return done;
}

/* ════ LOOP ════ */
const MS_MIN=4,MS_MAX=700;
function msPerStep(){return MS_MIN+(1-speed/100)*(MS_MAX-MS_MIN);}

let loopStarted=false;
function loop(now){
  requestAnimationFrame(loop);
  if(running){
    const dt=Math.min(now-lastT,200);lastT=now;acc+=dt;
    const ms=msPerStep();
    while(acc>=ms){
      acc-=ms;
      if(oneStep()){
        running=false;
        document.getElementById('btn-run').textContent='▶ START';
        updateUI();
        break;
      }
    }
  }else{lastT=now;}
  render();
}

/* ════ RENDER ════ */
function render(){
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  if(tab==='sort')renderSort(W,H);
  else if(tab==='tree')renderTree(W,H);
  else if(tab==='graph')renderGraph(W,H);
}

function renderSort(W,H){
  const PAD=16,bw=(W-PAD*2)/SORT_N,mxH=H-58;
  for(const b of mergeBands){
    const x1=PAD+b.L*bw,x2=PAD+(b.R+1)*bw;
    ctx.fillStyle='#ffffff06';ctx.fillRect(x1,0,x2-x1,H-34);
    ctx.fillStyle='#3b82f60a';ctx.fillRect(x1,0,(b.M-b.L+1)*bw,H-34);
    ctx.fillStyle='#a855f70a';ctx.fillRect(PAD+(b.M+1)*bw,0,(b.R-b.M)*bw,H-34);
  }
  ctx.strokeStyle=C.border;ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(PAD,H-30);ctx.lineTo(W-PAD,H-30);ctx.stroke();
  for(let i=0;i<arr.length;i++){
    const h=Math.max(2,(arr[i]/SORT_N)*mxH);
    const x=PAD+i*bw,y=H-30-h,bwi=Math.max(1,bw-1.2);
    let col=sortedIdx.has(i)?C.green:i===pivotIdx?C.yellow:i===cmpA?C.orange:i===cmpB?C.red:C.blue;
    if(i===cmpA||i===cmpB||i===pivotIdx){ctx.shadowColor=col;ctx.shadowBlur=8;}
    const g=ctx.createLinearGradient(x,y,x,y+h);
    g.addColorStop(0,col);g.addColorStop(1,col+'44');
    ctx.fillStyle=g;ctx.fillRect(x,y,bwi,h);ctx.shadowBlur=0;
    ctx.fillStyle=col+'cc';ctx.fillRect(x,y,bwi,2);
  }
  ctx.font='bold 11px JetBrains Mono,monospace';
  ctx.fillStyle=sortDone?C.green:running?C.cyan:C.t2;
  ctx.textAlign='left';ctx.textBaseline='top';
  ctx.fillText(sortDone?'✓ SORTED':running?'▶ RUNNING':'⏸ PAUSED',PAD,10);
  const prog=sortedIdx.size/SORT_N;
  ctx.fillStyle=C.border;ctx.fillRect(PAD,H-18,W-PAD*2,3);
  const pg=ctx.createLinearGradient(PAD,0,W-PAD,0);
  pg.addColorStop(0,C.cyan);pg.addColorStop(1,C.green);
  ctx.fillStyle=pg;ctx.fillRect(PAD,H-18,(W-PAD*2)*prog,3);
  ctx.textBaseline='alphabetic';ctx.textAlign='left';
}
function renderTree(W,H){
  const nodes=activeTree==='bst'?bstNodes:rbtNodes;
  const root=activeTree==='bst'?0:rbtRoot;
  if(!nodes.length||root===-1){ctx.font='13px JetBrains Mono,monospace';ctx.fillStyle=C.t3;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Empty — insert values below',W/2,H/2);ctx.textAlign='left';ctx.textBaseline='alphabetic';return;}
  for(let i=0;i<nodes.length;i++){const nd=nodes[i];for(const ch of[nd.left,nd.right]){if(ch===-1)continue;ctx.strokeStyle=C.bhl;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(nd.x,nd.y);ctx.lineTo(nodes[ch].x,nodes[ch].y);ctx.stroke();}}
  for(let i=0;i<nodes.length;i++){
    const nd=nodes[i];const R=22;
    let fill=C.card,stroke=C.cyan,tc=C.cyan;
    if(activeTree==='rbt'){fill=nd.color===RED?'#2a0810':'#091726';stroke=nd.color===RED?C.red:C.blue;tc=nd.color===RED?C.red:C.blue;}
    if(nd.isNew){fill=C.gdim;stroke=C.green;tc=C.green;}
    ctx.shadowColor=stroke;ctx.shadowBlur=nd.isNew?18:7;
    ctx.beginPath();ctx.arc(nd.x,nd.y,R,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();ctx.shadowBlur=0;
    ctx.font='bold 11px JetBrains Mono,monospace';ctx.fillStyle=tc;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(nd.val,nd.x,nd.y);
  }
  ctx.textAlign='left';ctx.textBaseline='alphabetic';
  if(activeTree==='rbt'&&rbtNodes.length){let bh=0;let c=rbtRoot;while(c!==-1){if(rbtNodes[c].color===BLACK)bh++;c=rbtNodes[c].left;}ctx.font='11px JetBrains Mono,monospace';ctx.fillStyle=C.red;ctx.fillText('● Red',14,24);ctx.fillStyle=C.blue;ctx.fillText('● Black',14,42);ctx.fillStyle=C.t3;ctx.fillText('Black-height: '+bh,14,60);}
}
function renderGraph(W,H){
  const ox=(W-580)/2,oy=Math.max(28,(H-410)/2);
  for(let i=0;i<GN;i++)for(let j=i+1;j<GN;j++){
    if(!GA[i][j])continue;
    const tr=gedges.some(([a,b])=>(a===i&&b===j)||(a===j&&b===i));
    ctx.strokeStyle=tr?C.cyan:C.border;ctx.lineWidth=tr?2:1;
    ctx.shadowColor=tr?C.cyan:'transparent';ctx.shadowBlur=tr?5:0;
    ctx.beginPath();ctx.moveTo(ox+GX[i],oy+GY[i]);ctx.lineTo(ox+GX[j],oy+GY[j]);ctx.stroke();ctx.shadowBlur=0;
  }
  for(let i=0;i<GN;i++){
    const R=22,cx=ox+GX[i],cy=oy+GY[i];
    const isCur=i===gcur,isV=gvis[i];
    let fill=C.card,stroke=C.t3,tc=C.t3;
    if(isCur){fill='#1a2600';stroke=C.yellow;tc=C.yellow;}else if(isV){fill='#091a35';stroke=C.cyan;tc=C.cyan;}
    ctx.shadowColor=stroke;ctx.shadowBlur=isCur?20:isV?8:0;
    ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
    ctx.strokeStyle=stroke;ctx.lineWidth=2.5;ctx.stroke();ctx.shadowBlur=0;
    ctx.font='bold 13px JetBrains Mono,monospace';ctx.fillStyle=tc;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(i,cx,cy);
  }
  ctx.textAlign='left';ctx.textBaseline='alphabetic';
  if(gpath.length){ctx.font='11px JetBrains Mono,monospace';ctx.fillStyle=C.cyan;ctx.fillText('Path: '+gpath.join(' → '),14,H-14);}
  if(gdone){ctx.font='bold 13px JetBrains Mono,monospace';ctx.fillStyle=C.green;ctx.textAlign='center';ctx.fillText('✓ ALL '+GN+' NODES VISITED',W/2,26);ctx.textAlign='left';}
}

/* ════ UI ════ */
let prevCmp=0,prevSw=0;
function updateUI(){
  const cmpEl=document.getElementById('scmp');
  const swEl=document.getElementById('ssw');
  if(comparisons!==prevCmp){cmpEl.textContent=comparisons;cmpEl.classList.remove('stat-pop');void cmpEl.offsetWidth;cmpEl.classList.add('stat-pop');prevCmp=comparisons;}
  if(swaps!==prevSw){swEl.textContent=swaps;swEl.classList.remove('stat-pop');void swEl.offsetWidth;swEl.classList.add('stat-pop');prevSw=swaps;}
  document.getElementById('ssz').textContent=tab==='sort'?SORT_N:tab==='graph'?GN:(activeTree==='bst'?bstNodes.length:rbtNodes.length);
  document.getElementById('sst').textContent=stepCount;
  const bdg=document.getElementById('sbadge'),txt=document.getElementById('stxt');
  const done=tab==='sort'?sortDone:tab==='graph'?gdone:false;
  if(done){bdg.className='d';txt.textContent='COMPLETE';}else if(running){bdg.className='g';txt.textContent='RUNNING';}else{bdg.className='r';txt.textContent='READY';}
  const key=tab==='tree'?(activeTree==='rbt'?'rbt':'bst'):algo;
  const cx=CX[key]||CX.bubble;
  document.getElementById('cxb').textContent=cx.b;document.getElementById('cxa').textContent=cx.a;
  document.getElementById('cxw').textContent=cx.w;document.getElementById('cxs').textContent=cx.s;
  document.getElementById('infb').textContent=INFO[key]||'';
  // empty state prompt
  const hasData=running||(tab==='sort'&&stepCount>0)||(tab==='graph'&&stepCount>0)||(tab==='tree'&&(bstNodes.length>0||rbtNodes.length>0));
  document.getElementById('cv-prompt').classList.toggle('hidden',hasData||tab==='tree');
}
function updatePseudo(){
  const key=tab==='tree'?(activeTree==='rbt'?'rbt':'bst'):algo;
  const lines=PSEUDO[key]||[];
  document.getElementById('plines').innerHTML=lines.map((l,i)=>{const hl=i===phl;return`<div class="pl${hl?' hl':''}">${l.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`;}).join('');
  const a=document.getElementById('plines').querySelector('.hl');if(a)a.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function updateLegend(){
  const el=document.getElementById('leg');let it=[];
  if(tab==='sort')it=[[C.orange,'Compare A'],[C.red,'Compare B'],[C.yellow,'Pivot'],[C.green,'Sorted'],[C.blue,'Unsorted']];
  else if(tab==='graph')it=[[C.yellow,'Current'],[C.cyan,'Visited'],[C.t3,'Unvisited']];
  else if(activeTree==='bst')it=[[C.cyan,'BST Node'],[C.green,'New Insert']];
  else it=[[C.red,'Red Node'],[C.blue,'Black Node'],[C.green,'New Insert']];
  el.innerHTML=it.map(([c,l])=>`<div class="legr"><div class="legd" style="background:${c}"></div>${l}</div>`).join('');
}
function updateAlgoSel(){
  const sel=document.getElementById('asel'),isT=tab==='tree';
  sel.innerHTML='';
  if(tab==='sort'){[['bubble','Bubble Sort'],['selection','Selection Sort'],['insertion','Insertion Sort'],['quick','Quick Sort'],['merge','Merge Sort']].forEach(([v,l])=>sel.appendChild(new Option(l,v)));sel.value=algo;sel.disabled=false;}
  else if(tab==='graph'){[['bfs','BFS — Breadth First'],['dfs','DFS — Depth First']].forEach(([v,l])=>sel.appendChild(new Option(l,v)));sel.value=algo;sel.disabled=false;}
  else{sel.appendChild(new Option('— Tree Mode —',''));sel.disabled=true;}
  document.getElementById('sz-grp').style.display=tab==='sort'?'flex':'none';
  document.getElementById('tree-bar').classList.toggle('hidden',tab!=='tree');
  document.getElementById('kstrip').classList.toggle('hidden',tab==='tree');
  const run=document.getElementById('btn-run'),stp=document.getElementById('btn-stp');
  run.disabled=isT;stp.disabled=isT;
}

/* ════ CONTROLS ════ */
function switchTab(t){
  tab=t;running=false;acc=0;phl=-1;
  document.getElementById('btn-run').textContent='▶ START';
  document.querySelectorAll('.tb').forEach(b=>b.classList.remove('on'));
  document.getElementById('tab-'+t).classList.add('on');
  if(t==='sort'){if(!['bubble','selection','insertion','quick','merge'].includes(algo))algo='bubble';resetSort();}
  else if(t==='tree'){resetBST();resetRBT();}
  else if(t==='graph'){if(!['bfs','dfs'].includes(algo))algo='bfs';resetGraph();}
  updateAlgoSel();updateLegend();updateUI();updatePseudo();
}
function onAlgoChange(v){algo=v;running=false;acc=0;document.getElementById('btn-run').textContent='▶ START';if(tab==='sort')resetSort();if(tab==='graph')resetGraph();updateUI();updatePseudo();}
function toggleRun(){
  const isT=tab==='tree';if(isT)return;
  running=!running;acc=0;lastT=performance.now();
  document.getElementById('btn-run').textContent=running?'⏸ PAUSE':'▶ START';
  updateUI();
}
function doStep(){const isT=tab==='tree';if(isT)return;if(running){running=false;document.getElementById('btn-run').textContent='▶ START';}oneStep();}
function doReset(){
  running=false;acc=0;phl=-1;prevCmp=0;prevSw=0;
  document.getElementById('btn-run').textContent='▶ START';
  if(tab==='sort')resetSort();else if(tab==='tree'){resetBST();resetRBT();}else if(tab==='graph')resetGraph();
  updateUI();updatePseudo();
}
function onSpdChg(v){speed=parseInt(v);}
function onSizeChg(v){SORT_N=parseInt(v);document.getElementById('sz-v').textContent=v;running=false;if(tab==='sort')resetSort();updateUI();updatePseudo();document.getElementById('btn-run').textContent='▶ START';}
function doInsert(){
  const tv=document.getElementById('tree-type').value;activeTree=tv;
  const inp=document.getElementById('ins-val');const val=parseInt(inp.value);
  if(isNaN(val)||val<1||val>999){inp.style.borderColor=C.red;setTimeout(()=>inp.style.borderColor='',700);return;}
  inp.value='';
  if(tv==='bst'){bstIns(val,bstNodes);layoutTree(bstNodes,0);setTimeout(()=>bstNodes.forEach(n=>n.isNew=false),1400);}
  else{rbtIns(val);setTimeout(()=>rbtNodes.forEach(n=>n.isNew=false),1400);}
  stepCount++;updateUI();updateLegend();updatePseudo();
}
function doTreeReset(){resetBST();resetRBT();stepCount=0;comparisons=0;swaps=0;prevCmp=0;prevSw=0;updateUI();updatePseudo();}
document.getElementById('tree-type').addEventListener('change',function(){activeTree=this.value;updateLegend();updateUI();updatePseudo();});
document.getElementById('ins-val').addEventListener('keydown',e=>{if(e.key==='Enter')doInsert();});

document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;
  switch(e.key){
    case' ':e.preventDefault();toggleRun();break;
    case'ArrowRight':e.preventDefault();doStep();break;
    case'r':case'R':doReset();break;
    case'+':case'=':speed=Math.min(100,speed+10);document.getElementById('spd-r').value=speed;break;
    case'-':speed=Math.max(1,speed-10);document.getElementById('spd-r').value=speed;break;
    case'1':switchTab('sort');break;
    case'2':switchTab('tree');break;
    case'3':switchTab('graph');break;
  }
});

/* ════ STARTUP ════ */
function startApp(initialTab){
  resizeCv();
  resetBST();resetRBT();
  switchTab(initialTab||'sort');
  if(!loopStarted){loopStarted=true;lastT=performance.now();requestAnimationFrame(loop);}
}

// also support Enter/Space to show menu
document.addEventListener('keydown',e=>{
  const intro=document.getElementById('intro');
  if(intro.style.display==='none')return;
  if(e.key===' '||e.key==='Enter'){e.preventDefault();showModeMenu();}
});