/* ==========================================================================
   Mapit DevCon — Custom map-pin cursor
   A miniature, semi-transparent mapit-icon.svg whose tip is the hotspot.
   Only enabled for fine pointers (mouse / trackpad); touch is untouched.
   ========================================================================== */
(() => {
  'use strict';

  if (!matchMedia('(pointer: fine)').matches) return;

  const PIN_W = 22;                       // rendered width (px)
  const PIN_H = PIN_W * (48 / 41);        // keep SVG aspect (41×48)
  const HOT_X = PIN_W / 2;                // tip is bottom-centre of the pin
  const HOT_Y = PIN_H;

  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  const img = new Image();
  img.className = 'cursor__pin';
  img.src = 'assets/mapit-icon.svg';
  img.alt = '';
  img.width = PIN_W;
  cursor.appendChild(img);
  document.body.appendChild(cursor);
  document.documentElement.classList.add('has-cursor');

  let x = -100, y = -100, queued = false;
  const render = () => {
    cursor.style.transform = `translate3d(${x - HOT_X}px, ${y - HOT_Y}px, 0)`;
    queued = false;
  };

  const INTERACTIVE = 'a, button, [role="button"], label, input, select, textarea, summary, .schedule__zoom';

  addEventListener('mousemove', (e) => {
    x = e.clientX; y = e.clientY;
    cursor.classList.add('is-visible');
    if (!queued) { queued = true; requestAnimationFrame(render); }
  }, { passive: true });

  document.addEventListener('mouseover', (e) => {
    cursor.classList.toggle('is-hover', !!e.target.closest(INTERACTIVE));
  });

  document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
  document.addEventListener('mouseenter', () => cursor.classList.add('is-visible'));

  addEventListener('mousedown', (e) => {
    cursor.classList.add('is-down');
    const ripple = document.createElement('span');
    ripple.className = 'cursor-ripple';
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    document.body.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    setTimeout(() => ripple.remove(), 1000); // safety for reduced-motion
  });
  addEventListener('mouseup', () => cursor.classList.remove('is-down'));

  // Native <dialog> renders in the top layer; keep the pin above it.
  const lb = document.getElementById('schedule-lightbox');
  if (lb) {
    lb.addEventListener('close', () => document.body.appendChild(cursor));
    window.addEventListener('mapit:lightbox-open', () => lb.appendChild(cursor));
  }
})();
