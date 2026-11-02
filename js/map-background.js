/* ==========================================================================
   Mapit DevCon — Procedural vector map background
   Everything here is generated as SVG geometry (no tiles, no map library,
   no text snippets). Layers:
     base  : coordinate grid · muted roads · topographic contours ·
             rendering tiles · tracing polygons · pulsing origin points
   The plane is tilted/panned with CSS 3D transforms driven by scroll.
   ========================================================================== */
(() => {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const host = document.getElementById('map-bg');
  if (!host) return;
  const plane = host.querySelector('.map-plane');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  /* ---------- helpers ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(20261123); // deterministic: same map every visit
  const rr = (a, b) => a + rand() * (b - a);
  const f = (n) => n.toFixed(1);

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  // Catmull-Rom → cubic Bézier (closed loop)
  function closedPath(pts) {
    const n = pts.length;
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ` +
           `${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
    }
    return d + 'Z';
  }
  // Catmull-Rom → cubic Bézier (open path)
  function openPath(pts) {
    const n = pts.length;
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ` +
           `${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
    }
    return d;
  }
  function hexPoints(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + i * Math.PI / 3;
      pts.push(`${f(cx + r * Math.cos(a))},${f(cy + r * Math.sin(a))}`);
    }
    return pts.join(' ');
  }

  /* ---------- world ---------- */
  const CX = 800, CY = 600;                                   // focus centre
  const EXT = { x0: -1500, y0: -1300, x1: 3100, y1: 2500 };   // background coverage

  const svg = el('svg', { xmlns: NS, focusable: 'false', preserveAspectRatio: 'xMidYMid slice' });
  plane.appendChild(svg);

  /* defs */
  const defs = el('defs', null, svg);
  const gNode = el('radialGradient', { id: 'g-node' }, defs);
  el('stop', { offset: '0%', 'stop-color': '#6493F7', 'stop-opacity': '0.6' }, gNode);
  el('stop', { offset: '45%', 'stop-color': '#4D79D6', 'stop-opacity': '0.18' }, gNode);
  el('stop', { offset: '100%', 'stop-color': '#4D79D6', 'stop-opacity': '0' }, gNode);
  const gZone = el('radialGradient', { id: 'g-zone' }, defs);
  el('stop', { offset: '0%', 'stop-color': '#B4C7EF', 'stop-opacity': '0.28' }, gZone);
  el('stop', { offset: '40%', 'stop-color': '#6493F7', 'stop-opacity': '0.16' }, gZone);
  el('stop', { offset: '100%', 'stop-color': '#4D79D6', 'stop-opacity': '0' }, gZone);

  /* ---- grid ---- */
  const grid = el('g', { class: 'm-grid' }, svg);
  for (let x = Math.ceil(EXT.x0 / 80) * 80; x <= EXT.x1; x += 80) {
    el('line', { x1: x, y1: EXT.y0, x2: x, y2: EXT.y1, class: x % 400 === 0 ? 'major' : '' }, grid);
  }
  for (let y = Math.ceil(EXT.y0 / 80) * 80; y <= EXT.y1; y += 80) {
    el('line', { x1: EXT.x0, y1: y, x2: EXT.x1, y2: y, class: y % 400 === 0 ? 'major' : '' }, grid);
  }

  /* ---- roads ---- */
  const roads = el('g', null, svg);
  const baseAngle = -0.32;
  for (let i = 0; i < 12; i++) {
    const a = baseAngle + rr(-0.18, 0.18) + (i % 2 ? Math.PI / 2 : 0);
    const px = rr(-600, 2200), py = rr(-500, 1700);
    const L = 5200;
    const x1 = px - Math.cos(a) * L, y1 = py - Math.sin(a) * L;
    const x2 = px + Math.cos(a) * L, y2 = py + Math.sin(a) * L;
    const d = `M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}`;
    el('path', { d, class: 'm-road m-road--a' }, roads);
    el('path', { d, class: 'm-road-c' }, roads);
  }
  for (let i = 0; i < 34; i++) {
    const a = baseAngle + (rand() > 0.5 ? Math.PI / 2 : 0) + rr(-0.06, 0.06);
    const px = rr(-400, 2000), py = rr(-300, 1500);
    const L = rr(180, 620);
    el('path', {
      d: `M${f(px)},${f(py)} L${f(px + Math.cos(a) * L)},${f(py + Math.sin(a) * L)}`,
      class: 'm-road m-road--b',
    }, roads);
  }

  /* ---- topographic contours ---- */
  const contours = el('g', null, svg);
  const peaks = [
    [330, 300, 10], [1240, 820, 11], [1360, 210, 7], [560, 1010, 8],
    [-320, 680, 10], [1960, 480, 9], [820, -340, 8], [180, 1720, 9], [1560, 1640, 9], [2300, 1300, 7], [-700, -200, 8],
  ];
  peaks.forEach(([cx, cy, rings]) => {
    const p1 = rr(0, 6.28), p2 = rr(0, 6.28), p3 = rr(0, 6.28);
    const sx = rr(0.8, 1.35), sy = rr(0.8, 1.2), rot = rr(0, Math.PI);
    for (let i = 0; i < rings; i++) {
      const r = 22 + i * rr(28, 36);
      const pts = [];
      const N = 44;
      for (let k = 0; k < N; k++) {
        const t = (k / N) * Math.PI * 2;
        const wob = 1 + 0.17 * Math.sin(3 * t + p1 + i * 0.12) + 0.09 * Math.sin(5 * t + p2 - i * 0.2) + 0.05 * Math.sin(2 * t + p3);
        const lx = Math.cos(t) * r * wob * sx, ly = Math.sin(t) * r * wob * sy;
        pts.push([cx + lx * Math.cos(rot) - ly * Math.sin(rot), cy + lx * Math.sin(rot) + ly * Math.cos(rot)]);
      }
      el('path', { d: closedPath(pts), class: 'm-contour' + (i % 4 === 3 ? ' idx' : '') }, contours);
    }
  });

  /* ---- rendering tiles (sweeping in like a tile pyramid loading) ---- */
  const tiles = el('g', null, svg);
  [[960, 240, 5, 4, 0], [160, 720, 4, 3, 3.2], [1280, 1040, 4, 2, 5.4], [-240, 160, 3, 3, 1.6], [1840, 800, 3, 4, 4.4]]
    .forEach(([x0, y0, cols, rows, delay]) => {
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          el('rect', {
            x: x0 + c * 80 + 2, y: y0 + r * 80 + 2, width: 76, height: 76, rx: 3,
            class: 'm-tile', style: `--d:${(delay + (c + r) * 0.16).toFixed(2)}s`,
          }, tiles);
        }
      }
    });

  /* ---- tracing polygons (feature geometry being rendered) ---- */
  const polys = el('g', null, svg);
  for (let i = 0; i < 22; i++) {
    const cx = rr(-200, 1800), cy = rr(-100, 1300);
    const sides = 4 + Math.floor(rand() * 3);
    const R = rr(28, 72);
    const rot = rr(0, Math.PI * 2);
    const pts = [];
    for (let k = 0; k < sides; k++) {
      const a = rot + (k / sides) * Math.PI * 2 + rr(-0.25, 0.25);
      const rad = R * rr(0.7, 1.1);
      pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
    }
    const delay = rr(0, 12).toFixed(2);
    el('path', {
      d: 'M' + pts.map((p) => `${f(p[0])},${f(p[1])}`).join(' L') + ' Z',
      pathLength: 1, class: 'm-poly', style: `--d:${delay}s`,
    }, polys);
    pts.forEach((p) => el('rect', { x: f(p[0] - 2.5), y: f(p[1] - 2.5), width: 5, height: 5, class: 'm-vertex', style: `--d:${delay}s` }, polys));
  }

  /* ---- pulsing spatial origin points ---- */
  const origins = el('g', null, svg);
  [[520, 420], [1080, 560], [760, 880], [1360, 420], [240, 900], [980, 170], [1500, 760], [80, 360], [1180, 1120]]
    .forEach(([x, y], i) => {
      const g = el('g', { class: 'm-origin', transform: `translate(${x} ${y})` }, origins);
      el('path', { d: 'M-16,0 H-7 M7,0 H16 M0,-16 V-7 M0,7 V16', class: 'cross' }, g);
      const base = (i * 0.47) % 3.4;
      el('circle', { r: 10, class: 'ring', style: `--d:${base.toFixed(2)}s` }, g);
      el('circle', { r: 10, class: 'ring', style: `--d:${(base + 1.7).toFixed(2)}s` }, g);
      el('circle', { r: 6, class: 'base' }, g);
      el('circle', { r: 3, class: 'core' }, g);
    });

  /* =======================================================================
     Fit viewBox to viewport (keeps feature scale sensible on any screen)
     ======================================================================= */
  function fit() {
    const pw = innerWidth * 1.8, ph = innerHeight * 1.8;
    const ppu = Math.min(2, Math.max(0.6, Math.min(innerWidth / 1150, innerHeight / 760)));
    const vw = pw / ppu, vh = ph / ppu;
    svg.setAttribute('viewBox', `${f(CX - vw / 2)} ${f(CY - vh / 2)} ${f(vw)} ${f(vh)}`);
  }
  fit();

  /* =======================================================================
     Scroll-driven pan & tilt (smoothed with rAF lerp)
     ======================================================================= */
  const cur = { rx: 24, rz: -8, tx: 0, ty: 0, s: 1.05 };
  const tgt = { ...cur };
  let mouseX = 0, mouseY = 0;
  let running = false;

  function computeTarget() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const p = Math.min(1, Math.max(0, scrollY / max));
    tgt.rx = 24 + p * 20;                                         // tilt deeper as you scroll
    tgt.rz = -8 + p * 16 + mouseX * 1.6;                          // slow rotation
    tgt.tx = -Math.sin(p * Math.PI) * innerWidth * 0.07 - mouseX * 18;   // lateral drift
    tgt.ty = -p * innerHeight * 0.32 - mouseY * 12;               // pan with content
    tgt.s = 1.05 + p * 0.12;
  }

  function apply() {
    plane.style.transform =
      `translate3d(${f(cur.tx)}px, ${f(cur.ty)}px, 0) rotateX(${cur.rx.toFixed(2)}deg) rotateZ(${cur.rz.toFixed(2)}deg) scale(${cur.s.toFixed(3)})`;
  }

  function tick() {
    let moving = false;
    for (const k in cur) {
      const diff = tgt[k] - cur[k];
      if (Math.abs(diff) > 0.002) { cur[k] += diff * 0.075; moving = true; }
      else cur[k] = tgt[k];
    }
    apply();
    if (moving) requestAnimationFrame(tick);
    else running = false;
  }

  function kick() {
    computeTarget();
    if (reduceMotion) { Object.assign(cur, tgt); apply(); return; }
    if (!running) { running = true; requestAnimationFrame(tick); }
  }

  if (reduceMotion) {
    apply();
  } else {
    addEventListener('scroll', kick, { passive: true });
    if (finePointer) {
      addEventListener('mousemove', (e) => {
        mouseX = e.clientX / innerWidth - 0.5;
        mouseY = e.clientY / innerHeight - 0.5;
        kick();
      }, { passive: true });
    }
    kick();
  }

  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { fit(); kick(); }, 120);
  });

  // Pause SVG (SMIL) animations when the tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) svg.pauseAnimations(); else svg.unpauseAnimations();
  });
  if (reduceMotion) svg.pauseAnimations();
})();
