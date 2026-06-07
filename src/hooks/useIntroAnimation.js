import { useEffect, useRef } from 'react';

/**
 * Runs the intro canvas animation (bar towers + nebula + scanlines).
 * Returns a ref that becomes true once all towers have risen.
 */
export function useIntroAnimation(canvasRef) {
  const logoReadyRef = useRef(false);

  useEffect(() => {
    const ic = canvasRef.current;
    if (!ic) return;
    const ix = ic.getContext('2d');
    let W, H, towers = [], t = 0, rafId;

    function resize() { W = ic.width = innerWidth; H = ic.height = innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    function initTowers() {
      towers = [];
      const count = Math.floor(W / 13) + 1;
      for (let i = 0; i < count; i++) {
        const rand = Math.random();
        towers.push({
          x: i * 13, w: 10,
          target: rand < 0.15 ? 0 : 60 + Math.random() * H * 0.75,
          cur: 0, spd: 2 + Math.random() * 5,
          delay: Math.random() * 55,
          hue: 190 + Math.random() * 45, done: false,
        });
      }
    }
    initTowers();

    function drawFrame() {
      rafId = requestAnimationFrame(drawFrame);
      t++;

      ix.fillStyle = '#000'; ix.fillRect(0, 0, W, H);
      const g = ix.createRadialGradient(W / 2, H * 0.9, 0, W / 2, H * 0.4, Math.max(W, H) * 0.85);
      g.addColorStop(0, '#00203855'); g.addColorStop(0.5, '#00101e33'); g.addColorStop(1, 'transparent');
      ix.fillStyle = g; ix.fillRect(0, 0, W, H);

      let allDone = true;
      for (const tw of towers) {
        if (t < tw.delay) { allDone = false; continue; }
        if (!tw.done) {
          tw.cur = Math.min(tw.cur + tw.spd, tw.target);
          if (tw.cur < tw.target) allDone = false; else tw.done = true;
        }
        if (tw.cur <= 0) continue;
        const y = H - tw.cur;
        const gl = ix.createLinearGradient(tw.x, y, tw.x, H);
        gl.addColorStop(0, `hsla(${tw.hue},80%,50%,0.04)`);
        gl.addColorStop(1, `hsla(${tw.hue},80%,40%,0.2)`);
        ix.fillStyle = gl; ix.fillRect(tw.x - 5, y, tw.w + 10, tw.cur);
        const bar = ix.createLinearGradient(tw.x, y, tw.x, H);
        bar.addColorStop(0, `hsla(${tw.hue},90%,65%,0.85)`);
        bar.addColorStop(1, `hsla(${tw.hue},70%,40%,0.5)`);
        ix.fillStyle = bar; ix.fillRect(tw.x, y, tw.w, tw.cur);
        ix.fillStyle = `hsla(${tw.hue},100%,90%,0.75)`; ix.fillRect(tw.x, y, tw.w, 1.5);
        if (allDone) tw.cur += Math.sin(t * 0.035 + tw.x) * 0.5;
      }
      ix.fillStyle = 'rgba(0,0,0,0.05)';
      for (let y = 0; y < H; y += 3) ix.fillRect(0, y, W, 1);

      if (allDone && !logoReadyRef.current) {
        logoReadyRef.current = true;
      }
    }
    rafId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef]);

  return logoReadyRef;
}
