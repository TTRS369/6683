// 粒子引擎：点缓冲、点云（从蒙版取样）、仿射变换、粒子转场、合成（累积 → 色调映射 → 辉光）
const W = 1920, H = 1080, TAU = Math.PI * 2;
const UI = '"Noto Sans SC", sans-serif', SERIF = '"Noto Serif SC", serif';
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const mk = (w = W, h = H) => { const o = document.createElement("canvas"); o.width = w; o.height = h; return o; };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { x = clamp((x - a) / (b - a)); return x * x * (3 - 2 * x); };
const eio = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eout = x => 1 - Math.pow(1 - x, 3);
const mix = (a, b, e) => a + (b - a) * e;
const mix3 = (a, b, e) => [mix(a[0], b[0], e), mix(a[1], b[1], e), mix(a[2], b[2], e)];
// 每颗粒子按自己的延迟错开出发，整体在 [t0, t1] 内完成
const prog = (t, t0, t1, d, S) => clamp((t - t0 - d * S * (t1 - t0)) / ((1 - S) * (t1 - t0)));
const hash = k => { const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
// 在一串 [时间, 值] 关键帧之间平滑插值
function keys(t, ks) {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) if (t < ks[i][0]) return mix(ks[i - 1][1], ks[i][1], eio((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])));
  return ks[ks.length - 1][1];
}
function rrect(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }

// ---------- 点缓冲（屏幕坐标） ----------
class Pts {
  constructor(cap) { this.cap = cap; this.x = new Float32Array(cap); this.y = new Float32Array(cap); this.r = new Float32Array(cap); this.g = new Float32Array(cap); this.b = new Float32Array(cap); this.a = new Float32Array(cap); this.n = 0; this.k = 1; }
  clear() { this.n = 0; this.k = 1; }
  push(x, y, r, g, b, a) { if (this.n >= this.cap || a < 0.003) return; const i = this.n++; this.x[i] = x; this.y[i] = y; this.r[i] = r; this.g[i] = g; this.b[i] = b; this.a[i] = a * this.k; }
}

// ---------- 点云：在一张白色蒙版上按不透明度取点（局部坐标） ----------
// density：每平方像素的点数；取样结果固定，画面才不会闪
class Cloud {
  constructor(n) { this.n = n; this.x = new Float32Array(n); this.y = new Float32Array(n); this.v = new Float32Array(n); this.ph = new Float32Array(n); this.density = 1; }
}
// rim > 0 时边缘的点更密，轮廓更清楚
function cloud(draw, box, density, seed, cap = 400000, rim = 0) {
  const [bx, by, bw, bh] = box, w = Math.ceil(bw), h = Math.ceil(bh);
  const m = mk(w, h), c = m.getContext("2d"); c.translate(-bx, -by); c.fillStyle = c.strokeStyle = "#fff"; draw(c);
  const a = c.getImageData(0, 0, w, h).data; let sum = 0; const idx = [];
  if (rim > 0) {
    const al = new Uint8ClampedArray(w * h); for (let k = 0; k < w * h; k++) al[k] = a[k * 4 + 3];
    const A = (x, y) => x < 0 || y < 0 || x >= w || y >= h ? 0 : al[y * w + x];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = al[y * w + x]; if (v < 4) continue; const e = v - Math.min(A(x - 2, y), A(x + 2, y), A(x, y - 2), A(x, y + 2)); a[(y * w + x) * 4 + 3] = clamp(v * (1 - rim * 0.45) + e * rim * 1.2, 0, 255); }
  }
  for (let k = 0; k < w * h; k++) { const al = a[k * 4 + 3]; if (al > 3) { idx.push(k); sum += al; } }
  const n = Math.min(cap, Math.round(sum / 255 * density)), cl = new Cloud(n), r = rng(seed);
  cl.density = density;
  for (let i = 0; i < n && idx.length;) {
    const k = idx[r() * idx.length | 0]; if (r() * 255 > a[k * 4 + 3]) continue;
    cl.x[i] = bx + k % w + r(); cl.y[i] = by + (k / w | 0) + r(); cl.v[i] = r(); cl.ph[i] = r() * TAU; i++;
  }
  return cl;
}
// 仿射变换 [a b c d e f]：屏幕 x = a*x + c*y + e，y = b*x + d*y + f
const A = (a, b, c, d, e, f) => [a, b, c, d, e, f];
const amul = (P, Q) => [P[0] * Q[0] + P[2] * Q[1], P[1] * Q[0] + P[3] * Q[1], P[0] * Q[2] + P[2] * Q[3], P[1] * Q[2] + P[3] * Q[3], P[0] * Q[4] + P[2] * Q[5] + P[4], P[1] * Q[4] + P[3] * Q[5] + P[5]];
const atr = (x, y) => [1, 0, 0, 1, x, y], asc = (sx, sy = sx) => [sx, 0, 0, sy, 0, 0];
const arot = th => [Math.cos(th), Math.sin(th), -Math.sin(th), Math.cos(th), 0, 0];
// 镜头：cam = {x, y, s} 是画面中心对准的世界坐标和缩放；p 是视差（远景 < 1）
const camT = (cam, p = 1) => [cam.s, 0, 0, cam.s, 960 - cam.x * p * cam.s, 540 - cam.y * cam.s];
const ap = (T, x, y) => [T[0] * x + T[2] * y + T[4], T[1] * x + T[3] * y + T[5]];

// 把一个点云按变换画进点缓冲。bright 是"实心区域"的目标亮度，会根据缩放自动补偿点的密度
// o.jit 漂动幅度（像素），o.tw 闪烁量，o.fn(i, out) 可以逐点改位置/亮度
const _o = { x: 0, y: 0, a: 1 };
function draw(P, cl, T, col, bright, t, o = {}) {
  if (bright <= 0.002 || !cl) return;
  const q = Math.abs(T[0] * T[3] - T[1] * T[2]) || 1e-6, dens = cl.density / q;
  const stride = Math.max(1, Math.floor(dens / 1.6)), pa0 = Math.min(1.8, bright / dens * stride);
  const jit = o.jit ?? 0.8, tw = o.tw ?? 0.25, fn = o.fn, r = col[0], g = col[1], b = col[2];
  const x0 = o.cull ?? -40, x1 = W + 40;
  for (let i = (o.off || 0) % stride; i < cl.n; i += stride) {
    const ph = cl.ph[i], v = cl.v[i];
    let x = cl.x[i], y = cl.y[i], a = pa0 * (1 - tw + tw * Math.sin(t * (1.5 + v * 2.5) + ph));
    if (fn) { _o.x = x; _o.y = y; _o.a = a; if (fn(i, _o) === false) continue; x = _o.x; y = _o.y; a = _o.a; }
    let sx = T[0] * x + T[2] * y + T[4] + Math.sin(t * 0.9 + ph) * jit, sy = T[1] * x + T[3] * y + T[5] + Math.cos(t * 0.7 + ph * 1.7) * jit;
    if (o.post) { _o.x = sx; _o.y = sy; _o.a = a; if (o.post(v, ph, _o) === false) continue; sx = _o.x; sy = _o.y; a = _o.a; }
    if (sx < x0 || sx > x1 || sy < -40 || sy > H + 40) continue;
    P.push(sx, sy, r, g, b, a);
  }
}

// ---------- 粒子转场：上一个画面的粒子飞起来，重新拼成下一个画面 ----------
function morph(PA, PB, e, out, o = {}) {
  const n = Math.max(PA.n, PB.n), lift = o.lift ?? 260, swirl = o.swirl ?? 180, S = o.S ?? 0.55;
  for (let k = 0; k < n; k++) {
    const h1 = hash(k), h2 = hash(k + 7.31), h3 = hash(k * 1.7 + 2.1);
    const ia = k < PA.n ? k : (k * 7919) % Math.max(1, PA.n), ib = k < PB.n ? k : (k * 7919) % Math.max(1, PB.n);
    const aA = k < PA.n ? PA.a[ia] : 0, aB = k < PB.n ? PB.a[ib] : 0;
    // 先离开的是上方的粒子，像被风从上往下掀起
    const d = o.order === "x" ? clamp((PA.n ? PA.x[ia] : 0) / W) * 0.6 + h1 * 0.4 : clamp((PA.n ? PA.y[ia] : 0) / H) * 0.5 + h1 * 0.5;
    const u = eio(clamp((e - d * S) / (1 - S)));
    const ax = PA.n ? PA.x[ia] : PB.x[ib], ay = PA.n ? PA.y[ia] : PB.y[ib], bx = PB.n ? PB.x[ib] : ax, by = PB.n ? PB.y[ib] : ay;
    const arc = Math.sin(Math.PI * u);
    const x = mix(ax, bx, u) + (h2 - 0.5) * 2 * swirl * arc, y = mix(ay, by, u) - lift * (0.4 + h3) * arc;
    const r = mix(PA.n ? PA.r[ia] : PB.r[ib], PB.n ? PB.r[ib] : PA.r[ia], u), g = mix(PA.n ? PA.g[ia] : PB.g[ib], PB.n ? PB.g[ib] : PA.g[ia], u), b = mix(PA.n ? PA.b[ia] : PB.b[ib], PB.n ? PB.b[ib] : PA.b[ia], u);
    out.push(x, y, r, g, b, mix(aA, aB, u) * (1 + 0.6 * arc));
  }
}

// ---------- 合成 ----------
const ACC = new Float32Array(W * H * 3), PC = mk(), pctx = PC.getContext("2d"), IMG = pctx.createImageData(W, H);
const SM = mk(W / 4, H / 4), sctx = SM.getContext("2d"), SM2 = mk(W / 8, H / 8), sctx2 = SM2.getContext("2d");
const LUT = new Uint8ClampedArray(4096); for (let i = 0; i < 4096; i++) LUT[i] = 255 * (1 - Math.exp(-1.5 * i / 512));
function splatAll(P) {
  ACC.fill(0);
  const X = P.x, Y = P.y, R = P.r, G = P.g, B = P.b, AL = P.a;
  for (let i = 0; i < P.n; i++) {
    const x = X[i], y = Y[i], x0 = Math.floor(x), y0 = Math.floor(y); if (x0 < 0 || y0 < 0 || x0 >= W - 1 || y0 >= H - 1) continue;
    const fx = x - x0, fy = y - y0, a = AL[i], r = R[i] * a, g = G[i] * a, b = B[i] * a, k = (y0 * W + x0) * 3, k2 = k + W * 3;
    let w = (1 - fx) * (1 - fy); ACC[k] += r * w; ACC[k + 1] += g * w; ACC[k + 2] += b * w;
    w = fx * (1 - fy); ACC[k + 3] += r * w; ACC[k + 4] += g * w; ACC[k + 5] += b * w;
    w = (1 - fx) * fy; ACC[k2] += r * w; ACC[k2 + 1] += g * w; ACC[k2 + 2] += b * w;
    w = fx * fy; ACC[k2 + 3] += r * w; ACC[k2 + 4] += g * w; ACC[k2 + 5] += b * w;
  }
  const px = IMG.data;
  for (let k = 0, j = 0, o = 0; k < W * H; k++, j += 3, o += 4) {
    px[o] = LUT[Math.min(4095, ACC[j] * 512 | 0)]; px[o + 1] = LUT[Math.min(4095, ACC[j + 1] * 512 | 0)]; px[o + 2] = LUT[Math.min(4095, ACC[j + 2] * 512 | 0)]; px[o + 3] = 255;
  }
  pctx.putImageData(IMG, 0, 0);
}
// 粒子层叠加到画面上，附带两级辉光（近处柔光 + 远处大光晕）
function composite(ctx, bloom = 0.85, wide = 0.35) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "lighter";
  ctx.drawImage(PC, 0, 0);
  sctx.globalCompositeOperation = "copy"; sctx.filter = "blur(3px)"; sctx.drawImage(PC, 0, 0, W / 4, H / 4); sctx.filter = "none";
  ctx.globalAlpha = bloom; ctx.drawImage(SM, 0, 0, W, H);
  if (wide > 0) { sctx2.globalCompositeOperation = "copy"; sctx2.filter = "blur(6px)"; sctx2.drawImage(SM, 0, 0, W / 8, H / 8); sctx2.filter = "none"; ctx.globalAlpha = wide; ctx.drawImage(SM2, 0, 0, W, H); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
}
// 柔光圆（灯、光斑）
function glow(c, x, y, r, col, a) { if (a <= 0.003 || r <= 0) return; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.35, `rgba(${col},${a * 0.35})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
const rgb = (c, k = 255) => `${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)}`;
