import { useEffect, useRef } from 'react';
import { useIntroAnimation } from '../hooks/useIntroAnimation';

export default function IntroScreen({ onContinue }) {
  const canvasRef = useRef(null);
  const pressRef  = useRef(null);
  const logoReadyRef = useIntroAnimation(canvasRef);

  // Build letter spans programmatically
  const title = 'AlgoASM';

  function handleClick() {
    if (!logoReadyRef.current) return;
    onContinue();
  }

  // Enable pointer-events on press button once logo is ready
  useEffect(() => {
    const iv = setInterval(() => {
      if (logoReadyRef.current && pressRef.current) {
        pressRef.current.classList.add('ready');
        clearInterval(iv);
      }
    }, 100);
    return () => clearInterval(iv);
  }, [logoReadyRef]);

  // Keyboard: Space / Enter
  useEffect(() => {
    function onKey(e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleClick(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div id="intro">
      <canvas id="intro-canvas" ref={canvasRef} />
      <div id="intro-ring" />
      <div id="intro-ring2" />

      <div id="intro-logo">
        <div id="intro-title">
          {title.split('').map((ch, i) => (
            <span
              key={i}
              className="title-letter"
              style={{ animationDelay: (0.8 + i * 0.08) + 's' }}
            >
              {ch === ' ' ? '\u00a0' : ch}
            </span>
          ))}
        </div>
        <div id="intro-tagline">Algorithm Visualiser</div>
        <div id="intro-authors">By Reda Ganoutre &amp; Youssef Elmeliani</div>
      </div>

      <div
        id="intro-press"
        className="beat"
        ref={pressRef}
        onClick={handleClick}
      >
        CLICK TO CONTINUE
      </div>
    </div>
  );
}
