const INTRO_ON_LOAD = true;
const RADIUS = 16;
const RETURN_SECONDS = 8;

const box = document.querySelector('.portrait');
const fallback = box.querySelector('img');
const CSS = 350, PAD = 100, IMG = 150, dpr = window.devicePixelRatio || 1;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cv = document.createElement('canvas');
cv.setAttribute('aria-label', 'Amogh, drawn in dots');
cv.width = CSS * dpr; cv.height = CSS * dpr;
const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);

let P = [], dot = 1, m = { x: -999, y: -999 }, scatterAt = null, raf = null;

const img = new Image();
img.onload = () => {
  const w = img.width, h = img.height, t = document.createElement('canvas');
  t.width = w; t.height = h;
  const tx = t.getContext('2d'); tx.drawImage(img, 0, 0);
  const d = tx.getImageData(0, 0, w, h).data, s = IMG / w;
  const intro = INTRO_ON_LOAD && 'intro' in box.dataset && !still;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 128) {
    const hx = PAD + x * s, hy = PAD + y * s;
    if (intro) {
      const a = Math.random() * 6.283, r = 40 + Math.random() * 130;
      P.push({ hx, hy, x: CSS / 2 + Math.cos(a) * r, y: CSS / 2 + Math.sin(a) * r, vx: 0, vy: 0, delay: Math.random() * 0.6 });
    } else P.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0 });
  }
  dot = Math.max(s, 1 / dpr) * 1.05;
  if (intro) scatterAt = performance.now() - 250;
  fallback.replaceWith(cv);
  still ? draw() : wake();
};
img.src = fallback.src;

function draw() {
  ctx.clearRect(0, 0, CSS, CSS); ctx.fillStyle = '#2a2622';
  for (const p of P) ctx.fillRect(p.x, p.y, dot, dot);
}

function tick() {
  const { x: mx, y: my } = m, R2 = RADIUS * RADIUS;
  let energy = 0;
  ctx.clearRect(0, 0, CSS, CSS); ctx.fillStyle = '#2a2622';
  const T = scatterAt ? (performance.now() - scatterAt) / 1000 / RETURN_SECONDS : 2;
  if (T >= 2) scatterAt = null;
  for (const p of P) {
    const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
    if (d2 < R2 && d2 > 0.01) { const d = Math.sqrt(d2), f = (1 - d / RADIUS) * 2.4; p.vx += dx / d * f; p.vy += dy / d * f; }
    let k = 0.045, damp = 0.86;
    if (T < 2) {
      const u = Math.min(1, Math.max(0, (T - (p.delay || 0) * 0.5) / 0.7)), e = u * u * (3 - 2 * u);
      k = 0.0008 + 0.044 * e; damp = 0.94 - 0.08 * e;
    }
    p.vx += (p.hx - p.x) * k; p.vy += (p.hy - p.y) * k;
    p.vx *= damp; p.vy *= damp; p.x += p.vx; p.y += p.vy;
    energy += Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(p.hx - p.x) + Math.abs(p.hy - p.y);
    ctx.fillRect(p.x, p.y, dot, dot);
  }
  raf = energy > 0.5 || mx > -999 || scatterAt ? requestAnimationFrame(tick) : null;
}

function wake() { if (!raf && P.length) raf = requestAnimationFrame(tick); }

if (!still) {
  const move = e => {
    const r = cv.getBoundingClientRect(), p = e.touches ? e.touches[0] : e;
    m = { x: p.clientX - r.left, y: p.clientY - r.top }; wake();
  };
  const leave = () => { m = { x: -999, y: -999 }; wake(); };
  box.addEventListener('pointermove', move);
  box.addEventListener('pointerleave', leave);
  box.addEventListener('touchmove', move, { passive: true });
  box.addEventListener('touchend', leave);
  box.addEventListener('click', () => {
    for (const p of P) {
      const a = Math.random() * 6.283, v = 1.5 + Math.random() * 4.5;
      p.vx += Math.cos(a) * v; p.vy += Math.sin(a) * v; p.delay = Math.random() * 0.6;
    }
    scatterAt = performance.now(); wake();
  });
}
