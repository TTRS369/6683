// 场景⑤ 一棵树和树下一张空长椅，镜头慢慢绕着它转。四季各七秒：
// 春（开花、花瓣飘）→ 夏（满树的绿、萤火虫）→ 秋（叶子变红、一片片落下来，落在地上和长椅上）→ 冬（光秃的枝、下雪、雪慢慢盖住一切）
const TS = { spring: 58, summer: 65, autumn: 72, winter: 79, end: 86 };
const BENCH = [1900, 0, -900];
let TCX = 0;                                             // 树冠的中心（镜头绕着它转）
let TBR, TTIP, TLF, TPET, TFF, TSNOW, TGND, TBEN;
function buildTree() {
  const r = rng(501), br = [], tips = [];
  // 递归长树枝：每根枝 = [起点, 终点, 粗细]
  const grow = (x, y, z, dx, dy, dz, len, rad, depth) => {
    const ex = x + dx * len, ey = y + dy * len, ez = z + dz * len; br.push([x, y, z, ex, ey, ez, rad]);
    if (depth === 0) { tips.push([ex, ey, ez]); return; }
    const n = depth > 5 ? 3 : (r() < 0.6 ? 2 : 3);
    for (let k = 0; k < n; k++) {
      // 在垂直于当前方向的平面里随便选一个方向偏出去，再往上、往外拉一点
      let ax = r() - 0.5, ay = r() - 0.5, az = r() - 0.5; const dot = ax * dx + ay * dy + az * dz; ax -= dot * dx; ay -= dot * dy; az -= dot * dz;
      const al = Math.hypot(ax, ay, az) || 1, ang = mix(0.35, 0.8, r()), out = Math.hypot(ex, ez) || 1;
      let nx = dx * Math.cos(ang) + ax / al * Math.sin(ang) + ex / out * 0.12, ny = dy * Math.cos(ang) + ay / al * Math.sin(ang) - 0.12, nz = dz * Math.cos(ang) + az / al * Math.sin(ang) + ez / out * 0.12;
      const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      grow(ex, ey, ez, nx, ny, nz, len * mix(0.7, 0.86, r()), rad * mix(0.56, 0.68, r()), depth - 1);
    }
  };
  grow(0, 0, 0, 0.03, -1, 0.02, 1500, 270, 7);
  // 树枝上的点（圆柱表面）：存法线，画的时候按视线算出轮廓光
  const p = [];
  for (const [x0, y0, z0, x1, y1, z1, rad] of br) {
    const L = Math.hypot(x1 - x0, y1 - y0, z1 - z0), dx = (x1 - x0) / L, dy = (y1 - y0) / L, dz = (z1 - z0) / L;
    let ux = -dz, uy = 0, uz = dx; if (Math.hypot(ux, uz) < 0.1) { ux = 1; uz = 0; } const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
    const vx = dy * uz - dz * uy, vy = dz * ux - dx * uz, vz = dx * uy - dy * ux;
    const n = Math.round(L * (0.05 + rad * 0.011));
    for (let i = 0; i < n; i++) { const t = r(), ph = r() * TAU, c = Math.cos(ph), s = Math.sin(ph), nx = ux * c + vx * s, ny = uy * c + vy * s, nz = uz * c + vz * s, rr = rad * mix(1, 0.75, t); p.push(x0 + dx * L * t + nx * rr, y0 + dy * L * t + ny * rr, z0 + dz * L * t + nz * rr, nx, ny, nz); }
  }
  TBR = new Float32Array(p); TTIP = tips; TCX = tips.reduce((s, t) => s + t[0], 0) / tips.length;
  // 叶子 / 花：每个枝头一簇 [x, y, z, 随机1, 随机2, 随机3]
  const lf = []; for (const [x, y, z] of tips) for (let k = 0; k < 9; k++) { const a = r() * TAU, b = Math.acos(2 * r() - 1), rr = 80 + 240 * Math.cbrt(r()); lf.push(x + Math.sin(b) * Math.cos(a) * rr, y + Math.cos(b) * rr * 0.7 - 60, z + Math.sin(b) * Math.sin(a) * rr, r(), r(), r()); }
  TLF = new Float32Array(lf);
  // 春天飘落的花瓣 [起点 x, 起点 y, 起点 z, 速度, 相位]
  const pe = []; for (let i = 0; i < 700; i++) { const t = tips[r() * tips.length | 0]; pe.push(t[0], t[1], t[2], 500 + r() * 400, r()); } TPET = new Float32Array(pe);
  // 夏夜的萤火虫
  const ff = []; for (let i = 0; i < 220; i++) ff.push(mix(-5000, 5000, r()), -mix(150, 2400, r()), mix(-4500, 4500, r()), r()); TFF = new Float32Array(ff);
  // 雪 [x, 起始高度, z, 速度, 相位]
  const sn = []; for (let i = 0; i < 3200; i++) sn.push(mix(-9000, 9000, r()), r(), mix(-8000, 8000, r()), 520 + r() * 360, r()); TSNOW = new Float32Array(sn);
  // 地面
  const g = []; for (let i = 0; i < 80000; i++) { const a = r() * TAU, rr = 9000 * Math.sqrt(r()); g.push(Math.cos(a) * rr, -r() * 20, Math.sin(a) * rr, r()); } TGND = new Float32Array(g);
  // 长椅：三条座板、两条靠背板、四条腿；[x, y, z, 是否朝上（会积雪）]
  const bn = [], bl = (ax, ay, az, bx, by, bz, n, top) => { for (let i = 0; i < n; i++) { const u = r(); bn.push(mix(ax, bx, u) + (r() - 0.5) * 10, mix(ay, by, u) + (r() - 0.5) * 6, mix(az, bz, u) + (r() - 0.5) * 10, top); } };
  for (const dz of [-170, -40, 90]) bl(-750, -450, dz, 750, -450, dz, 1500, 1);
  for (const dy of [-640, -800]) bl(-750, dy, 170, 750, dy, 190, 1500, 0);
  for (const dx of [-650, 650]) { bl(dx, 0, -190, dx, -450, -190, 260, 0); bl(dx, 0, 150, dx, -450, 150, 260, 0); bl(dx, -450, 160, dx, -860, 200, 300, 0); bl(dx, -450, -200, dx, -450, 160, 240, 0); }
  TBEN = new Float32Array(bn);
}
const FOG_TREE = [5000, 12000, 14000];
// 季节的权重（带一点重叠，像慢慢变过去）
const seasonW = E => { const sp = 1 - ss(64, 66, E), su = ss(64, 66, E) * (1 - ss(71, 73.5, E)), au = ss(71, 73.5, E) * (1 - ss(78.5, 80.5, E)), wi = ss(78.5, 80.5, E); return [sp, su, au, wi]; };
const sway = (y, E, ph) => { const h = Math.max(0, -y / 6500); return h * h * (55 + 35 * Math.sin(E * 0.31)) * Math.sin(E * 0.9 + ph); };
// 一片叶子在秋天落下来的位置（落地以后停在那里）
function leafFall(i, E, o) {
  const x0 = TLF[i], y0 = TLF[i + 1], z0 = TLF[i + 2], tf = TS.autumn + 1.2 + TLF[i + 4] * 6.2, v = 900 + TLF[i + 5] * 700;
  if (E < tf) { o[0] = x0 + sway(y0, E, x0 * 0.001); o[1] = y0; o[2] = z0; o[3] = 0; return; }
  const tl = tf + (-y0) / v, t = Math.min(E, tl) - tf, ph = TLF[i + 3] * 20;
  o[0] = x0 + sway(y0, tf, x0 * 0.001) + Math.sin(t * 2.3 + ph) * 260 + t * 200; o[1] = Math.min(0, y0 + v * t) - 6; o[2] = z0 + Math.cos(t * 1.9 + ph) * 200 + t * 120; o[3] = E >= tl ? 2 : 1;
}
const TLB = [0, 0, 0, 0];
const TREE = {
  cam(E) {
    const a = trk(E, [[56, -0.6], [TS.end + 2, 0.62]]), R = trk(E, [[56, 10200], [TS.end + 2, 9000]]), y = trk(E, [[56, -1200], [TS.end + 2, -1700]]);
    const ty = trk(E, [[56, -2900], [TS.end + 2, -3300]]);
    return lookCam(TCX + Math.sin(a) * R, y, -Math.cos(a) * R, TCX, ty, 0);
  },
  pts(B, E, c, cams) {
    FOG = FOG_TREE;
    const [sp, su, au, wi] = seasonW(E);
    // 视线方向（从树指向镜头），用来算树枝的轮廓光
    let vx = c.x, vy = c.y + 2600, vz = c.z; const vl = Math.hypot(vx, vy, vz); vx /= vl; vy /= vl; vz /= vl;
    const bc = [mix3(mix3([0.75, 0.62, 0.7], [0.5, 0.68, 0.62], su), [0.95, 0.66, 0.45], au), [0.85, 0.92, 1], wi];
    const bcol = mix3(bc[0], bc[1], bc[2]), frost = wi * ss(80, 84, E);
    for (let i = 0; i < TBR.length; i += 6) {
      const nx = TBR[i + 3], ny = TBR[i + 4], nz = TBR[i + 5], rim = Math.pow(1 - Math.abs(nx * vx + ny * vy + nz * vz), 3), top = Math.max(0, -ny);
      const y = TBR[i + 1], sw = sway(y, E, TBR[i] * 0.001);
      P3(B, c, TBR[i] + sw, y, TBR[i + 2] + sw * 0.4, bcol[0], bcol[1], bcol[2], 0.05 + 0.32 * rim + 0.08 * top + frost * 0.45 * top * top);
    }
    // 叶子和花
    const leafA = 1 - ss(TS.winter - 0.5, TS.winter + 1.5, E);
    if (leafA > 0.01) for (let i = 0; i < TLF.length; i += 6) {
      const q1 = TLF[i + 3], q2 = TLF[i + 4];
      // 春：七成的枝头开花，一朵朵依次开；夏：全换成绿叶；秋：从绿变黄变红，然后落下
      const bloom = ss(TS.spring + 0.3 + q1 * 2.6, TS.spring + 1.3 + q1 * 2.6, E) * (q2 < 0.7 ? 1 : 0), green = ss(63.8 + q1 * 2, 65.3 + q1 * 2, E), turn = ss(71 + q2 * 2.5, 73 + q2 * 2.5, E);
      leafFall(i, E, TLB); const st = TLB[3];
      const a0 = sp * bloom * (1 - green) + green * (st === 2 ? 0.55 * (1 - ss(80, 83.5, E)) : 1);
      if (a0 < 0.01) continue;
      let ti, size = 46;
      if (green < 0.5) ti = q1 < 0.5 ? TI("petal") : TI("petal2");
      else if (turn < 0.5) { ti = q1 < 0.55 ? TI("leafG") : TI("leafG2"); size = 56; }
      else { ti = q1 < 0.45 ? TI("leaf") : (q1 < 0.88 ? TI("leaf2") : TI("amber")); size = 52; }
      const sa = green < 0.5 ? 0.55 : (turn < 0.5 ? 0.36 : 0.3);
      const fl = 0.75 + 0.25 * Math.sin(E * (1.2 + q1) + q2 * 30);
      if (st === 1) { leafFall(i, E - 1 / 60, TB); wspr(c, TLB[0], TLB[1], TLB[2], size, a0 * 0.3, ti, c, TB[0], TB[1], TB[2], 1.8, E * 3 + q1 * 9); }
      else wspr(c, TLB[0], TLB[1], TLB[2], size, a0 * sa * fl * leafA, ti, null, 0, 0, 0, st === 2 ? 2 : 1.3, q1 * 6);
    }
    // 春天的花瓣雨
    const petOn = sp * ss(TS.spring + 1.5, TS.spring + 3.5, E);
    if (petOn > 0.01) for (let k = 0; k < TPET.length; k += 5) {
      const v = TPET[k + 3], ph = TPET[k + 4], y0 = TPET[k + 1], dur = -y0 / v, s = ((E - 50) / dur + ph) % 1, t = s * dur;
      const pos = (t2, o) => { o[0] = TPET[k] + Math.sin(t2 * 1.7 + ph * 20) * 240 + t2 * 520; o[1] = y0 + v * t2; o[2] = TPET[k + 2] + Math.cos(t2 * 1.3 + ph * 11) * 220; };
      pos(t, TLB); const x = TLB[0], y = TLB[1], z = TLB[2]; pos(t - 1 / 30, TLB);
      wspr(c, x, y, z, 30, petOn * 0.7 * ss(0, 0.08, s) * (1 - ss(0.9, 1, s)), ph < 0.5 ? TI("petal") : TI("petal2"), c, TLB[0], TLB[1], TLB[2], 2, E * 4 + ph * 9);
    }
    // 夏夜的萤火虫
    if (su > 0.01) for (let k = 0; k < TFF.length; k += 4) {
      const q = TFF[k + 3]; curl(TFF[k] * 0.0007 + E * 0.05, TFF[k + 2] * 0.0007, E * 0.2 + q * 7, CV);
      const x = TFF[k] + CV[0] * 900 + Math.sin(E * 0.5 + q * 30) * 300, y = TFF[k + 1] + Math.sin(E * 0.8 + q * 20) * 160, z = TFF[k + 2] + CV[1] * 900;
      const blink = Math.pow(Math.max(0, Math.sin(E * (1.1 + q * 0.9) + q * 50)), 6);
      wspr(c, x, y, z, 20, su * blink, TI("gold"));
    }
    // 雪
    const snowOn = ss(TS.winter - 1.2, TS.winter + 1.8, E) * (1 - ss(TS.end + 0.5, TS.end + 2.5, E));
    if (snowOn > 0.01) for (let k = 0; k < TSNOW.length; k += 5) {
      const v = TSNOW[k + 3], ph = TSNOW[k + 4], s = ((E - 70) * v / 9000 + TSNOW[k + 1]) % 1, y = -9000 + s * 9000;
      const x = TSNOW[k] + Math.sin(E * 0.7 + ph * 30) * 260 + (E - 80) * 160, z = TSNOW[k + 2] + Math.cos(E * 0.6 + ph * 20) * 200;
      wspr(c, x, y, z, 16 + ph * 14, snowOn * 0.75 * ss(0, 0.05, s) * (1 - ss(0.96, 1, s)), ph < 0.6 ? TI("snow") : TI("snow2"), c, x - 160 / 30, y - v / 30, z);
    }
    // 地面：春天落了一层花瓣（粉）、秋天一层落叶（暖）、冬天积雪（白，越来越亮）
    const snowG = ss(79.5, 85, E), gc = mix3(mix3(mix3([0.55, 0.45, 0.6], [0.3, 0.45, 0.4], su), [0.75, 0.45, 0.3], au), [0.82, 0.9, 1], snowG);
    for (let i = 0; i < TGND.length; i += 4) { const d = Math.hypot(TGND[i], TGND[i + 2]) / 9000; P3(B, c, TGND[i], TGND[i + 1], TGND[i + 2], gc[0], gc[1], gc[2], (0.05 + 0.04 * TGND[i + 3] + 0.1 * snowG) * (1 - d * d)); }
    // 长椅：冬天座板上积起一层雪
    for (let i = 0; i < TBEN.length; i += 4) { const top = TBEN[i + 3], s = top * snowG; P3(B, c, BENCH[0] + TBEN[i], BENCH[1] + TBEN[i + 1] - s * 14, BENCH[2] + TBEN[i + 2], mix(0.75, 0.95, s), mix(0.72, 0.97, s), mix(0.8, 1, s), 0.32 + 0.4 * s); }
  },
  bg(ctx, E, c, a) {
    const [sp, su, au, wi] = seasonW(E);
    const tops = [[20, 26, 52], [6, 12, 30], [30, 18, 34], [6, 10, 22]], hors = [[112, 84, 120], [26, 50, 74], [168, 86, 52], [44, 56, 84]], w = [sp, su, au, wi];
    const mixc = cs => [0, 1, 2].map(j => Math.round(cs.reduce((s, col, k) => s + col[j] * w[k], 0)));
    const hy = horizonY(c);
    ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, hy - 1000, 0, hy); g.addColorStop(0, `rgb(${mixc(tops)})`); g.addColorStop(1, `rgb(${mixc(hors)})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Math.max(0, hy));
    const gg = ctx.createLinearGradient(0, hy, 0, H); gg.addColorStop(0, `rgb(${mixc(hors).map(v => v * 0.55 | 0)})`); gg.addColorStop(0.35, `rgb(${mixc(hors).map(v => v * 0.2 | 0)})`); gg.addColorStop(1, "#040408"); ctx.fillStyle = gg; ctx.fillRect(0, hy, W, H - hy);
    // 远处低低的山丘，和地平线上的一层雾
    ctx.fillStyle = `rgb(${mixc(hors).map(v => v * 0.3 | 0)})`; ctx.beginPath(); let st = false;
    for (const [x, y] of STREE) { if (!proj(c, x * 1.6, y * 0.55, 34000)) continue; if (!st) { ctx.moveTo(PX, PY); st = true; } else ctx.lineTo(PX, PY); }
    ctx.lineTo(W + 50, hy + 40); ctx.lineTo(-50, hy + 40); ctx.closePath(); ctx.fill();
    const hz = ctx.createLinearGradient(0, hy - 90, 0, hy + 70); hz.addColorStop(0, `rgba(${mixc(hors)},0)`); hz.addColorStop(0.55, `rgba(${mixc(hors)},0.45)`); hz.addColorStop(1, `rgba(${mixc(hors)},0)`); ctx.fillStyle = hz; ctx.fillRect(0, hy - 90, W, 160);
    // 秋天落日的暖光，夏夜一轮淡淡的月亮
    if (au > 0.01 && proj(c, 26000, -1800, 80000)) glow(ctx, PX, PY, 900, "255,150,80", 0.35 * au * a);
    if (su > 0.01 && proj(c, -36000, -30000, 70000)) { ctx.globalCompositeOperation = "lighter"; glow(ctx, PX, PY, 90, "230,236,255", 0.35 * su * a); glow(ctx, PX, PY, 22, "245,248,255", 0.9 * su * a); ctx.globalCompositeOperation = "source-over"; }
    ctx.globalAlpha = 1;
  },
  over(ctx, E, c, a) {},
};
