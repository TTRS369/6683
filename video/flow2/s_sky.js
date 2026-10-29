// 场景⑥ 星河：树上的叶子和雪飞上天，汇成一条流动的星河。重拍上，星星连成以前那些东西的样子（两只杯子、那扇窗、秋千、长椅），一会儿又散回星河里。
// 场景⑦ 一个光点：103.74 低音退出，整条星河收成一个光点，在一片黑里慢慢呼吸，然后往下沉，沉成海边天亮前的那点光。
const RD = 60000, SKY_C = [0, -1500, 0];
const sdir = (az, el) => [Math.sin(az) * Math.cos(el), -Math.sin(el), Math.cos(az) * Math.cos(el)];
const bandEl = az => 0.42 + 0.3 * az + 0.07 * Math.sin(az * 2.3);
let GX, GNEB, GST, CONS;
function buildSky() {
  const r = rng(601);
  // 星河 [方位角, 偏离中线, 随机, 颜色随机]
  const g = []; for (let i = 0; i < 150000; i++) { const u = r(), v = r(), gs = Math.sqrt(-2 * Math.log(u + 1e-9)) * Math.cos(TAU * v), w = gs * (r() < 0.8 ? 0.045 : 0.13); g.push(mix(-1.9, 1.9, r()), w, r(), r()); } GX = new Float32Array(g);
  // 星河里彩色的星云（大而淡的光斑）
  const nb = []; for (let i = 0; i < 260; i++) nb.push(mix(-1.8, 1.8, r()), (r() - 0.5) * 0.16, 900 + r() * 2200, r() * 4 | 0, r()); GNEB = new Float32Array(nb);
  // 天上的星星（在整个天空）
  const st = []; for (let i = 0; i < 3800; i++) st.push(mix(-2.2, 2.2, r()), Math.asin(r()) * 1.1 + 0.02, r(), r() < 0.04 ? 1 : 0); GST = new Float32Array(st);
  // 星座：以前那些东西的轮廓（局部坐标，单位约 1/10 弧度）
  const cup = ox => [[[ox - 0.5, -0.6], [ox + 0.5, -0.6], [ox + 0.38, 0.6], [ox - 0.38, 0.6], [ox - 0.5, -0.6]], [[ox + 0.47, -0.32], [ox + 0.8, -0.22], [ox + 0.78, 0.12], [ox + 0.42, 0.22]]];
  CONS = [
    { t: 88.96, az: -0.38, el: 0.36, s: 0.085, lines: [...cup(-0.9), ...cup(0.95)] },
    { t: 92.4, az: 0.32, el: 0.6, s: 0.1, lines: [[[-1, -0.75], [1, -0.75], [1, 0.75], [-1, 0.75], [-1, -0.75]], [[0, -0.75], [0, 0.75]], [[-1, 0], [1, 0]]] },
    { t: 95.84, az: -0.15, el: 0.66, s: 0.11, lines: [[[-1.3, 1], [-1.1, -0.9], [1.1, -0.9], [1.3, 1]], [[-0.75, -0.9], [-0.75, 0.55]], [[-0.35, -0.9], [-0.35, 0.55]], [[-0.85, 0.55], [-0.25, 0.55]], [[0.35, -0.9], [0.52, 0.5]], [[0.75, -0.9], [0.92, 0.5]], [[0.42, 0.52], [1.02, 0.48]]] },
    { t: 99.28, az: 0.2, el: 0.48, s: 0.1, lines: [[[-1.2, 0.1], [1.2, 0.1]], [[-1.2, -0.25], [1.2, -0.25]], [[-1.2, -0.6], [1.2, -0.6]], [[-1, 0.1], [-1, 0.7]], [[1, 0.1], [1, 0.7]], [[-1.05, -0.6], [-1.05, 0.1]], [[1.05, -0.6], [1.05, 0.1]]] },
  ];
  for (const k of CONS) { k.v = []; for (const l of k.lines) for (const p of l) if (!k.v.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.05)) k.v.push(p); }
}
// 星河收拢到的那个点（屏幕坐标）
const PT = [960, 470];
const STARS = {
  cam(E) { const yaw = trk(E, [[84, 0.12], [96, 0.02], [106, -0.04]]), pit = trk(E, [[84, -0.1], [92, -0.36], [104, -0.47]]); return mkCam(SKY_C[0], SKY_C[1], SKY_C[2], yaw, pit); },
  pts(B, E, c, cams) {
    FOG = [RD, RD * 4, RD * 4];
    const conv = E > S.drop - 0.2;                                     // 收成一个点
    const put = (x, y, z, cr, cg, cb, a, q) => {
      if (!proj(c, x, y, z)) return; let sx = PX, sy = PY;
      if (conv) { const u = eio(clamp((E - S.drop - q * 0.9) / 1.3)); if (u > 0) { const th = 2.2 * u, dx = (sx - PT[0]) * (1 - u), dy = (sy - PT[1]) * (1 - u); sx = PT[0] + dx * Math.cos(th) - dy * Math.sin(th); sy = PT[1] + dx * Math.sin(th) + dy * Math.cos(th); a *= Math.pow(1 - u, 1.6) * (1 + 2 * Math.sin(Math.PI * u)); } }   // 旋着收进去
      B.push(sx, sy, cr, cg, cb, a);
    };
    const on = ss(85.5, 89, E);
    // 星河：沿着带子慢慢流，边上有一缕缕的丝
    for (let i = 0; i < GX.length; i += 4) {
      const q = GX[i + 2], az = GX[i] + 0.012 * (E - 86) * (0.6 + q), w = GX[i + 1] + 0.018 * Math.sin(az * 9 + E * 0.25 + q * 5), el = bandEl(az) + w;
      const d = sdir(az, el), aw = Math.abs(w) / 0.05, hue = 0.5 + 0.5 * Math.sin(az * 2.6 + 1), qc = GX[i + 3];
      let cr, cg, cb; if (aw < 0.6) { cr = 1; cg = 0.9; cb = 0.78; } else if (qc < hue * 0.6) { cr = 1; cg = 0.58; cb = 0.82; } else { cr = 0.52; cg = 0.66; cb = 1; }
      const lane = 1 - 0.65 * Math.exp(-Math.pow((w - 0.012) / 0.009, 2));   // 星河中间偏一点有一道暗的尘带
      const a = on * (0.1 + 0.32 * Math.exp(-aw * aw * 0.8)) * lane * (0.7 + 0.3 * Math.sin(E * (1 + q * 2) + q * 40));
      put(d[0] * RD, SKY_C[1] + d[1] * RD, d[2] * RD, cr, cg, cb, a, q);
    }
    if (!conv || E < S.drop + 1.6) {
      const fade = conv ? 1 - ss(S.drop, S.drop + 1.4, E) : 1;
      for (let k = 0; k < GNEB.length; k += 5) { const az = GNEB[k] + 0.012 * (E - 86) * 0.8, d = sdir(az, bandEl(az) + GNEB[k + 1]); wspr(c, d[0] * RD, SKY_C[1] + d[1] * RD, d[2] * RD, GNEB[k + 2] * 0.6, on * fade * 0.035, TI(["rose", "cyan", "gold", "cool"][GNEB[k + 3]]), null, 0, 0, 0, 1, 0, 260); }
    }
    for (let i = 0; i < GST.length; i += 4) {
      const q = GST[i + 2], d = sdir(GST[i], GST[i + 1]), tw = 0.55 + 0.45 * Math.sin(E * (0.8 + q * 2.5) + q * 60);
      if (GST[i + 3]) { if (!conv || E < S.drop + 1) wspr(c, d[0] * RD, SKY_C[1] + d[1] * RD, d[2] * RD, 60 + q * 60, on * tw * 0.8 * (conv ? 1 - ss(S.drop, S.drop + 1, E) : 1), TI("white")); }
      else put(d[0] * RD, SKY_C[1] + d[1] * RD, d[2] * RD, 0.85, 0.9, 1, on * 0.55 * tw, q);
    }
    // 星座：重拍上亮起来，停一会儿，再顺着星河散开
    for (const k of CONS) {
      const t = E - k.t; if (t < -0.2 || t > 4.2) continue;
      const a = ss(-0.2, 0.7, t) * (1 - ss(2.6, 4.2, t)), drift = ss(2.4, 4.2, t);
      const ctr = sdir(k.az, k.el); if (!proj(c, ctr[0] * RD, SKY_C[1] + ctr[1] * RD, ctr[2] * RD)) continue;
      const cx = PX, cy = PY; proj(c, ...(d => [d[0] * RD, SKY_C[1] + d[1] * RD, d[2] * RD])(sdir(k.az + 0.1, bandEl(k.az + 0.1)))); const fx = PX - cx, fy = PY - cy;
      const sc = k.s * FOC;
      const at = (p, h) => [cx + p[0] * sc + fx * drift * (1 + h * 2) * 1.5 + (h - 0.5) * 60 * drift, cy + p[1] * sc + fy * drift * (1 + h * 2) * 1.5 + (hash(h * 7) - 0.5) * 60 * drift];
      for (const l of k.lines) for (let j = 0; j + 1 < l.length; j++) {
        const L = Math.hypot(l[j + 1][0] - l[j][0], l[j + 1][1] - l[j][1]) * sc, n = Math.round(L / 1.5);
        for (let m = 0; m < n; m++) { const u = (m + 0.5) / n, h = hash(k.t + j * 3.1 + m * 0.37), p = at([mix(l[j][0], l[j + 1][0], u), mix(l[j][1], l[j + 1][1], u)], h); B.push(p[0], p[1], 1, 0.92, 0.82, 0.5 * a * (1 - drift * 0.5)); }
      }
      for (const v of k.v) { const h = hash(v[0] * 13 + v[1] * 7), p = at(v, h); spr(p[0], p[1], 18, 18, 0, a * 0.9, TI("white")); spr(p[0], p[1], 48, 48, 0, a * 0.18, TI("gold")); }
    }
  },
  bg(ctx, E, c, a) {
    ctx.globalAlpha = a; ctx.fillStyle = "#020309"; ctx.fillRect(0, 0, W, H);
    const hy = horizonY(c); if (hy < H) { const g = ctx.createLinearGradient(0, hy - 260, 0, hy); g.addColorStop(0, "rgba(30,40,80,0)"); g.addColorStop(1, "rgba(30,40,80,0.5)"); ctx.fillStyle = g; ctx.fillRect(0, hy - 260, W, 260); ctx.fillStyle = "#020307"; ctx.fillRect(0, hy, W, H - hy); }
    ctx.globalAlpha = 1;
  },
  over(ctx, E, c, a) {},
};

// 光点的位置：先停在中间呼吸，最后沉到海边日出的地方
function pointPos(E) {
  let tx = PT[0], ty = PT[1];
  if (typeof BEACH !== "undefined") { const bc = BEACH.cam(S.beach + 1); if (proj(bc, SUNP0[0], 0, SUNP0[2])) { tx = PX; ty = PY; } }   // 目标：海边天亮前那点光（在地平线上）
  const u = sm((E - 109.5) / 4.5); return [mix(PT[0], tx, u), mix(PT[1], ty, u)];
}
let PDUST;
const POINT = {
  cam(E) { return mkCam(0, 0, 0, 0, 0); },
  pts(B, E, c, cams) {
    if (!PDUST) { const r = rng(701); PDUST = []; for (let i = 0; i < 260; i++) PDUST.push([r() * TAU, 60 + r() * 520, r()]); }
    const [x, y] = pointPos(E), br = 0.78 + 0.22 * Math.sin(TAU * (E - 104.2) / 3.44), on = ss(104.6, 106, E);
    spr(x, y, 16, 16, 0, on * br, TI("white")); spr(x, y, 60 * br, 60 * br, 0, on * 0.5 * br, TI("warm")); spr(x, y, 210, 210, 0, on * 0.12 * br, TI("gold"));
    // 一点点浮尘，围着它慢慢转
    for (const [a0, rr, q] of PDUST) { const a = a0 + E * 0.03 * (0.5 + q), rad = rr * (1 + 0.05 * Math.sin(E * 0.4 + q * 9)); B.push(x + Math.cos(a) * rad, y + Math.sin(a) * rad * 0.6, 1, 0.9, 0.78, on * 0.18 * (0.5 + 0.5 * Math.sin(E * (0.6 + q) + q * 30)) * Math.exp(-rr / 400)); }
  },
  bg(ctx, E, c, a) { ctx.globalAlpha = a; ctx.fillStyle = "#010103"; ctx.fillRect(0, 0, W, H); const [x, y] = pointPos(E), on = ss(104.6, 106, E); glow(ctx, x, y, 420, "255,214,160", 0.08 * on * a); ctx.globalAlpha = 1; },
  over(ctx, E, c, a) {},
};
