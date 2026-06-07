import { useRef } from 'react';

/**
 * Tire-scratch canvas animation for the mode-menu overlay.
 * Returns { start, stop } functions.
 * cardRefs: array of 3 refs → [sort, tree, graph] mode-card elements
 * scratchCanvasRef: ref to the scratch canvas element
 * svgLinesRef: ref to the SVG element containing connector lines
 */
export function useScratchAnimation(scratchCanvasRef, cardRefs, svgLinesRef) {
  const rafRef = useRef(null);

  function start() {
    const sc = scratchCanvasRef.current;
    if (!sc) return;
    const sx = sc.getContext('2d');
    const CX = 260, CY = 260;
    const ORBIT_R = 190;

    const cards = cardRefs.map((ref, i) => ({
      el: ref.current,
      color: ['#ff8c42', '#00ff9d', '#a855f7'][i],
      baseAngle: -Math.PI / 2 + i * (2 * Math.PI / 3),
    }));

    const tires = [
      { r: ORBIT_R,     angle: -Math.PI/2,                 speed: 0.016,  width: 8, color:'#ff8c42', alpha: 0.80, smoke: true  },
      { r: ORBIT_R,     angle: -Math.PI/2 + 2*Math.PI/3,   speed: 0.016,  width: 8, color:'#00ff9d', alpha: 0.80, smoke: true  },
      { r: ORBIT_R,     angle: -Math.PI/2 + 4*Math.PI/3,   speed: 0.016,  width: 8, color:'#a855f7', alpha: 0.80, smoke: false },
      { r: ORBIT_R*0.6, angle: 0,                           speed: -0.030, width: 5, color:'#00d4ff', alpha: 0.55, smoke: false },
    ];

    const particles = [];
    function spawnParticle(tire) {
      const px = CX + Math.cos(tire.angle) * tire.r;
      const py = CY + Math.sin(tire.angle) * tire.r;
      const tang = tire.angle + (tire.speed > 0 ? Math.PI / 2 : -Math.PI / 2);
      const spread = (Math.random() - 0.5) * 1.2;
      const v = 0.5 + Math.random() * 1.8;
      particles.push({
        x: px, y: py,
        vx: Math.cos(tang + spread) * v,
        vy: Math.sin(tang + spread) * v,
        life: 1, decay: 0.014 + Math.random() * 0.02,
        size: 1 + Math.random() * 3,
        col: tire.color,
        type: Math.random() < 0.5 ? 'smoke' : 'chunk',
      });
    }

    const TRAIL = 280;
    tires.forEach(t => { t.history = []; t.wobble = 0; });

    let frame = 0;
    let orbitAngle = 0;
    const ORBIT_SPEED = 0.016;

    // Fade cards in
    setTimeout(() => cards.forEach(c => c.el && c.el.classList.add('visible')), 200);

    function draw() {
      rafRef.current = requestAnimationFrame(draw);
      frame++;
      orbitAngle += ORBIT_SPEED;

      // Update card positions
      cards.forEach((c) => {
        const angle = c.baseAngle + orbitAngle;
        const px = CX + Math.cos(angle) * ORBIT_R;
        const py = CY + Math.sin(angle) * ORBIT_R;
        if (c.el) c.el.style.transform = `translate(${px - CX}px,${py - CY}px)`;
        c._px = px; c._py = py;
      });

      // Update SVG connector lines
      if (svgLinesRef.current) {
        const lines = svgLinesRef.current.querySelectorAll('line');
        cards.forEach((c, i) => {
          if (lines[i]) {
            lines[i].setAttribute('x2', c._px.toFixed(1));
            lines[i].setAttribute('y2', c._py.toFixed(1));
          }
        });
      }

      // Scratch canvas
      sx.fillStyle = 'rgba(0,0,0,0.022)';
      sx.fillRect(0, 0, 520, 520);

      tires[0].angle = cards[0].baseAngle + orbitAngle;
      tires[1].angle = cards[1].baseAngle + orbitAngle;
      tires[2].angle = cards[2].baseAngle + orbitAngle;
      tires[3].angle += tires[3].speed;

      for (const t of tires) {
        t.wobble = Math.sin(frame * 0.09 + t.r) * 0.006;
        if (t === tires[3]) t.angle += t.wobble;

        const px = CX + Math.cos(t.angle) * t.r;
        const py = CY + Math.sin(t.angle) * t.r;
        t.history.push({ x: px, y: py });
        if (t.history.length > TRAIL) t.history.shift();

        if (t.history.length > 2) {
          for (let i = 1; i < t.history.length; i++) {
            const prog = i / t.history.length;
            const prev = t.history[i - 1], cur = t.history[i];
            const alpha = prog * t.alpha * (0.65 + Math.sin(i * 0.22) * 0.35);
            const noise = 1 + Math.sin(i * 0.41 + frame * 0.06) * 0.55;
            const w = t.width * noise * prog;

            sx.beginPath(); sx.moveTo(prev.x, prev.y); sx.lineTo(cur.x, cur.y);
            sx.strokeStyle = `rgba(6,5,3,${alpha * 0.88})`;
            sx.lineWidth = w + 2; sx.lineCap = 'round'; sx.stroke();

            sx.beginPath(); sx.moveTo(prev.x, prev.y); sx.lineTo(cur.x, cur.y);
            sx.strokeStyle = t.color + Math.floor(alpha * 170).toString(16).padStart(2, '0');
            sx.lineWidth = Math.max(0.4, w * 0.32); sx.stroke();

            if (i % 5 === 0) {
              const perp = Math.atan2(cur.y - prev.y, cur.x - prev.x) + Math.PI / 2;
              for (const sign of [1, -1]) {
                sx.beginPath();
                sx.moveTo(cur.x, cur.y);
                sx.lineTo(cur.x + Math.cos(perp) * sign * t.width * 0.55,
                           cur.y + Math.sin(perp) * sign * t.width * 0.55);
                sx.strokeStyle = `rgba(200,180,140,${alpha * 0.2})`;
                sx.lineWidth = 0.7; sx.stroke();
              }
            }
          }
        }

        const grd = sx.createRadialGradient(px, py, 0, px, py, t.width * 2.5);
        grd.addColorStop(0, t.color + 'dd');
        grd.addColorStop(0.5, t.color + '44');
        grd.addColorStop(1, 'transparent');
        sx.beginPath(); sx.arc(px, py, t.width * 2.5, 0, Math.PI * 2);
        sx.fillStyle = grd; sx.fill();

        if (t.smoke && frame % 3 === 0) spawnParticle(t);
        else if (!t.smoke && frame % 7 === 0) spawnParticle(t);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.95; p.vy *= 0.95;
        p.life -= p.decay;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        if (p.type === 'smoke') {
          const r = p.size * (2.2 - p.life) * 3.5;
          const sg = sx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
          sg.addColorStop(0, `rgba(55,45,35,${p.life * 0.16})`);
          sg.addColorStop(1, 'transparent');
          sx.beginPath(); sx.arc(p.x, p.y, r, 0, Math.PI * 2);
          sx.fillStyle = sg; sx.fill();
        } else {
          sx.beginPath(); sx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          sx.fillStyle = p.col + Math.floor(p.life * 200).toString(16).padStart(2, '0');
          sx.fill();
        }
      }

      const hgrd = sx.createRadialGradient(CX, CY, 0, CX, CY, 38);
      hgrd.addColorStop(0, 'rgba(0,212,255,0.14)');
      hgrd.addColorStop(1, 'transparent');
      sx.beginPath(); sx.arc(CX, CY, 38, 0, Math.PI * 2);
      sx.fillStyle = hgrd; sx.fill();
    }

    draw();
  }

  function stop() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  return { start, stop };
}
