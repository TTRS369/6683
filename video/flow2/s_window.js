// 场景②（雨夜）和场景⑨（晴天）：同一扇窗、同一张桌子
// ② 开头那三个字写在窗玻璃上，像雾气一样化成雨珠流下来；镜头退开，桌上两只杯子，一只冒着热气，热气慢慢散尽
// ⑨ 雨停了，阳光照进来（按光线追踪落到桌上，窗棂的影子也在），桌上只剩一只杯子
const WIN = { x0: -520, x1: 520, y0: -760, y1: -30, z: 900 }, CUPA = [-120, 0, 430], CUPB = [115, 0, 480];
const WCORNERS = [[WIN.x0, WIN.y0, WIN.z], [WIN.x1, WIN.y0, WIN.z], [WIN.x1, WIN.y1, WIN.z], [WIN.x0, WIN.y1, WIN.z]];
const SUN = (() => { const d = [-0.38, 0.62, -0.69], l = Math.hypot(...d); return d.map(v => v / l); })();   // 阳光方向（从窗外斜着往下照进屋）
let WF, WT, WCUP, WBD, WDR, WBK, NT, TX, TY, TU, TBX, TBY, WST, WDM, WRAIN;
// 光线追踪：一个点沿阳光往回走到窗户平面，落在玻璃上（不在窗棂上）就是被照亮
function sunlit(x, y, z) {
  const t = (WIN.z - z) / -SUN[2]; if (t < 0) return 0; const wx = x - SUN[0] * t, wy = y - SUN[1] * t;
  if (wx < WIN.x0 + 8 || wx > WIN.x1 - 8 || wy < WIN.y0 + 8 || wy > WIN.y1 - 8) return 0;
  if (Math.abs(wx) < 10 || Math.abs(wy + 395) < 9) return 0;                                   // 窗棂的影子
  return 1;
}
function buildWindow() {
  const r = rng(201);
  // 窗框（两层深度，有一点立体）+ 窗台
  const f = [], line = (ax, ay, bx, by, z, n, b) => { for (let i = 0; i < n; i++) { const u = r(); f.push(mix(ax, bx, u) + (r() - 0.5) * 7, mix(ay, by, u) + (r() - 0.5) * 7, z, b); } };
  for (const z of [WIN.z, WIN.z - 22]) {
    const b = z === WIN.z ? 0.55 : 0.32;
    line(WIN.x0, WIN.y0, WIN.x1, WIN.y0, z, 1700, b); line(WIN.x0, WIN.y1, WIN.x1, WIN.y1, z, 1700, b);
    line(WIN.x0, WIN.y0, WIN.x0, WIN.y1, z, 1200, b); line(WIN.x1, WIN.y0, WIN.x1, WIN.y1, z, 1200, b);
    line(0, WIN.y0, 0, WIN.y1, z, 1100, b * 0.9); line(WIN.x0, -395, WIN.x1, -395, z, 1500, b * 0.9);
  }
  for (let i = 0; i < 2600; i++) f.push(mix(-570, 570, r()), -30 + (r() - 0.5) * 5, mix(880, 950, r()), 0.4);
  WF = new Float32Array(f);
  // 桌面：前沿一条亮线，桌面越靠窗越亮
  const t = [];
  for (let i = 0; i < 6000; i++) t.push(mix(-760, 760, r()), 150 + (r() - 0.5) * 4, 0.55);
  for (let i = 0; i < 26000; i++) { const z = mix(150, 880, Math.sqrt(r())), x = mix(-760, 760, r()); t.push(x, z, 0.05 + 0.2 * ss(350, 880, z) * (Math.abs(x) < 540 ? 1 : 0.4)); }
  WT = new Float32Array(t);
  // 杯子：上宽下窄的马克杯。侧面越靠左右边缘越亮（窗光从背后勾出轮廓）；杯口一圈最亮；A 杯里有一点暖色的茶
  const cp = [];
  for (const [ci, [cx, , cz]] of [[0, CUPA], [1, CUPB]].map(([i, c]) => [i, c])) {
    for (let i = 0; i < 3400; i++) { const ph = r() * TAU, h = r() * 92, rad = mix(34, 44, h / 92); cp.push(cx + Math.cos(ph) * rad, -h, cz + Math.sin(ph) * rad, 0.1 + 0.9 * Math.pow(Math.abs(Math.cos(ph)), 4), ci, 0); }
    for (let i = 0; i < 1000; i++) { const ph = r() * TAU; cp.push(cx + Math.cos(ph) * 44, -92, cz + Math.sin(ph) * 44, 0.85, ci, 0); }
    for (let i = 0; i < 400; i++) { const ph = r() * TAU; cp.push(cx + Math.cos(ph) * 40.5, -89, cz + Math.sin(ph) * 40.5, 0.4, ci, 0); }
    for (let i = 0; i < 420; i++) { const ph = r() * TAU; cp.push(cx + Math.cos(ph) * 34, 0, cz + Math.sin(ph) * 34, 0.35, ci, 0); }
    for (let i = 0; i < 700; i++) { const a = mix(-1.45, 1.45, r()), rr = 24 + (r() - 0.5) * 7; cp.push(cx + 44 + 6 + Math.cos(a) * rr * 0.75, -48 + Math.sin(a) * rr, cz + (r() - 0.5) * 7, 0.55, ci, 0); }
    for (let i = 0; i < (ci ? 260 : 520); i++) { const ph = r() * TAU, rr = Math.sqrt(r()) * 39; cp.push(cx + Math.cos(ph) * rr, -76, cz + Math.sin(ph) * rr, 0.22, ci, 1); }
  }
  WCUP = new Float32Array(cp);
  // 玻璃上静止的小雨珠
  const bd = []; for (let i = 0; i < 2400; i++) bd.push(mix(WIN.x0 + 10, WIN.x1 - 10, r()), mix(WIN.y0 + 10, WIN.y1 - 10, r()), 0.18 + r() * 0.3, r());
  WBD = new Float32Array(bd);
  // 顺着玻璃往下淌的雨滴 [x, 起点, 速度, 相位]
  const dr = []; for (let i = 0; i < 150; i++) dr.push(mix(WIN.x0 + 20, WIN.x1 - 20, r()), r() * 730, 40 + r() * 120, r()); WDR = new Float32Array(dr);
  // 窗外城市的虚焦光斑
  const bk = []; for (let i = 0; i < 170; i++) bk.push(mix(-2600, 2600, r()), mix(-2200, 400, Math.pow(r(), 0.7)), mix(3500, 7500, r()), 25 + r() * 50, r() < 0.55 ? 0 : r() < 0.6 ? 1 : 2, r()); WBK = new Float32Array(bk);
  // 窗外的雨
  const rn = []; for (let i = 0; i < 1300; i++) rn.push(mix(-1100, 1100, r()), r() * 1500, mix(1100, 3200, r()), 1000 + r() * 400); WRAIN = new Float32Array(rn);
  // 字（和手机消息里放大的那三个字同样大小、同样位置），以及它们化成雨珠后落的位置
  const tc = cloud(c => { c.textAlign = "center"; c.textBaseline = "middle"; c.font = `400 220px ${SERIF}`; c.fillText("他走了", 0, 0); }, [-520, -160, 1040, 320], 0.75, 3);
  NT = tc.n; TX = new Float32Array(NT); TY = new Float32Array(NT); TU = new Float32Array(NT); TBX = new Float32Array(NT); TBY = new Float32Array(NT);
  let xmin = 1e9, xmax = -1e9; for (let i = 0; i < NT; i++) { TX[i] = tc.x[i] * 0.96; TY[i] = -150 + tc.y[i] * 0.96; xmin = Math.min(xmin, TX[i]); xmax = Math.max(xmax, TX[i]); }
  for (let i = 0; i < NT; i++) { TU[i] = (TX[i] - xmin) / (xmax - xmin); TBX[i] = TX[i] + (r() - 0.5) * 70; TBY[i] = Math.min(WIN.y1 - 12, TY[i] + 50 + Math.pow(r(), 0.7) * 520); }
  // 热气 [起点 x 偏移, z 偏移, 相位, 随机]
  const st = []; for (let i = 0; i < 3800; i++) st.push((r() - 0.5) * 46, (r() - 0.5) * 46, r(), r()); WST = new Float32Array(st);
  // 阳光里的浮尘
  const dm = []; for (let i = 0; i < 900; i++) dm.push(mix(-650, 400, r()), mix(-760, -5, r()), mix(260, 880, r()), r()); WDM = new Float32Array(dm);
}
const FOG_ROOM = [600, 2600, 5000];
const textCol = [0.88, 0.93, 1], beadCol = [0.72, 0.83, 1];
// 字 → 雨珠：从右往左，字一点点往下滑，散成玻璃上的雨珠
function textBead(i, E, o) {
  const s = E - (S.peel + (1 - TU[i]) * 1.5 + hash(i * 1.37) * 0.45);
  if (s <= 0) { o[0] = TX[i]; o[1] = TY[i]; o[2] = 0; return; }
  curl(TX[i], TY[i], E, CV); const g = 1 - Math.exp(-s * 1.5);
  const fx = TX[i] + CV[0] * 14 * g, fy = TY[i] + 10 * s + 32 * s * s, e = sm((s - 0.25) / 1.5);
  o[0] = mix(fx, TBX[i], e); o[1] = mix(fy, TBY[i], e); o[2] = e;
}
const TB = [0, 0, 0];

const WINDOW_NIGHT = {
  cam(E) {
    if (E <= S.peel) return mkCam(0, -150, -200, 0, 0);
    return pathCam(E, [[S.peel, [0, -150, -200]], [18.5, [0, -270, -260]], [29.87, [-30, -235, -60]], [32, [-34, -232, -30]]],
      [[S.peel, [0, -150, 900]], [18.5, [-10, -130, 430]], [29.87, [-60, -100, 430]], [32, [-62, -98, 430]]]);
  },
  pts(B, E, c, cams) {
    FOG = FOG_ROOM;
    const room = ss(11.3, 14.5, E), fr = WF, cold = [0.55, 0.66, 0.95];             // 字交接时屋里的东西慢慢浮现
    for (let i = 0; i < fr.length; i += 4) P3(B, c, fr[i], fr[i + 1], fr[i + 2], cold[0], cold[1], cold[2], fr[i + 3] * room);
    const tb = WT; for (let i = 0; i < tb.length; i += 3) P3(B, c, tb[i], 0, tb[i + 1], 0.5, 0.6, 0.9, tb[i + 2] * room);
    // 杯子
    const steamOn = 1 - ss(21.5, 28.5, E);
    for (let i = 0; i < WCUP.length; i += 6) {
      const tea = WCUP[i + 5]; if (tea) { P3(B, c, WCUP[i], WCUP[i + 1], WCUP[i + 2], 1, 0.78, 0.5, room * WCUP[i + 3] * (WCUP[i + 4] ? 0.6 : 0.7 + 0.5 * steamOn)); continue; }
      P3(B, c, WCUP[i], WCUP[i + 1], WCUP[i + 2], 0.74, 0.84, 1, room * WCUP[i + 3] * 0.8);
    }
    // 玻璃上的雨珠
    for (let i = 0; i < WBD.length; i += 4) P3(B, c, WBD[i], WBD[i + 1], WIN.z - 2, beadCol[0], beadCol[1], beadCol[2], room * WBD[i + 2] * (0.8 + 0.2 * Math.sin(E * 1.3 + WBD[i + 3] * 9)));
    // 字化成的雨珠
    for (let i = 0; i < NT; i++) {
      const moving = E > S.peel && E < S.peel + 4.2, ns = moving ? 3 : 1;
      for (let k = 0; k < ns; k++) { textBead(i, E + [0, -1 / 360, -2 / 360][k], TB); const e = TB[2], col = e > 0 ? beadCol : textCol; P3(B, cams[k], TB[0], TB[1], WIN.z - 2, mix(textCol[0], col[0], e), mix(textCol[1], col[1], e), 1, mix(0.95, 0.38, e) / ns); }
    }
    // 顺着玻璃往下淌的雨滴（带一小段水痕）
    const dOn = ss(S.peel + 1, S.peel + 4, E);
    for (let k = 0; k < WDR.length; k += 4) {
      const x0 = WDR[k], v = WDR[k + 2], ph = WDR[k + 3], cyc = 730 + 260, p = (WDR[k + 1] + v * E + ph * cyc) % cyc; if (p > 730) continue;
      const y = WIN.y0 + p, x = x0 + Math.sin(p * 0.03 + ph * 9) * 6;
      wspr(c, x, y, WIN.z - 3, 2.3, 0.75 * dOn, TI("cool"), c, x, y - v / 60, WIN.z - 3);
      for (let j = 1; j < 9; j++) if (p - j * 6 > 0) P3(B, c, x, y - j * 6, WIN.z - 2, 0.7, 0.8, 1, 0.22 * (1 - j / 9) * dOn);
    }
    // 窗外：雨、城市的虚焦光斑（只在窗里出现）
    CLIP = screenBox(c, WCORNERS); const sk0 = SK; SK *= room;
    if (CLIP) {
      for (let k = 0; k < WRAIN.length; k += 4) { const v = WRAIN[k + 3], y = -1400 + (WRAIN[k + 1] + v * E) % 1500, x = WRAIN[k], z = WRAIN[k + 2]; wspr(c, x, y, z, 1.2, 0.3, TI("cool"), c, x - 4, y - v * 0.025, z); }
      for (let k = 0; k < WBK.length; k += 6) { const tw = 0.6 + 0.4 * Math.sin(E * (0.4 + WBK[k + 5]) + WBK[k + 5] * 20); wspr(c, WBK[k], WBK[k + 1], WBK[k + 2], WBK[k + 3], 0.9 * tw, TI(["warm", "cool", "amber"][WBK[k + 4]]), null, 0, 0, 0, 1, 0, 70); }
    }
    CLIP = null; SK = sk0;
    // 热气：从 A 杯升起，慢慢变淡，最后散尽
    if (steamOn > 0.01) for (let k = 0; k < 2600 * 4; k += 4) {
      const L = 5.5, s = ((E - 11) / L + WST[k + 2]) % 1, age = s * L, ageB = age - 1 / 120;
      const pos = (ag, o) => { curl(WST[k] * 3 + ag * 9, ag * 30, E * 0.6 + WST[k + 3] * 5, CV); o[0] = CUPA[0] + WST[k] * (1 + ag * 0.15) + CV[0] * 16 * ag; o[1] = -92 - ag * 40 - ag * ag * 2.2; o[2] = CUPA[2] + WST[k + 1] + CV[1] * 10 * ag; };
      pos(age, TB); const x = TB[0], y = TB[1], z = TB[2]; pos(ageB, TB);
      wspr(c, x, y, z, 1.6 + age * 0.9, room * steamOn * 0.05 * Math.pow(1 - s, 1.4) * ss(0, 0.1, s), TI("steam"), c, TB[0], TB[1], TB[2]);
    }
  },
  bg(ctx, E, c, a) {
    ctx.globalAlpha = a;
    const g = ctx.createRadialGradient(960, 520, 100, 960, 520, 1200); g.addColorStop(0, "#0a1020"); g.addColorStop(1, "#020309"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 窗里的夜空：深蓝，靠下有城市的微光
    const box = screenBox(c, WCORNERS);
    const room = ss(11.3, 14.5, E);
    if (box) { ctx.globalAlpha = a * room; const sg = ctx.createLinearGradient(0, box[1], 0, box[3]); sg.addColorStop(0, "#0b1530"); sg.addColorStop(1, "#1d2a52"); ctx.fillStyle = sg; quadPath(ctx, c, WCORNERS); ctx.fill(); ctx.globalAlpha = a; }
    // 窗光落在桌上的一片冷光
    if (proj(c, 0, 0, 760)) { glow(ctx, PX, PY, 520, "90,120,200", 0.14 * room); }
    // 字底（风起之前），保证开头的字锐利
    const crisp = 1 - ss(S.peel - 0.1, S.peel + 0.6, E);
    if (crisp > 0 && proj(c, 0, -150, WIN.z)) { ctx.save(); ctx.globalAlpha = 0.5 * crisp * a; ctx.fillStyle = "rgb(225,235,255)"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `400 ${220 * 0.96 * FOC / PZ}px ${SERIF}`; ctx.fillText("他走了", PX, PY); ctx.restore(); }
    ctx.globalAlpha = 1;
  },
  over(ctx, E, c, a) {},
};

const WINDOW_DAY = {
  cam(E) { return pathCam(E, [[160, [-30, -235, -60]], [S.end, [-15, -215, 70]]], [[160, [0, -110, 450]], [S.end, [15, -100, 460]]]); },
  pts(B, E, c, cams) {
    FOG = FOG_ROOM;
    const warm = [1, 0.9, 0.76];
    for (let i = 0; i < WF.length; i += 4) P3(B, c, WF[i], WF[i + 1], WF[i + 2], warm[0], warm[1], warm[2], WF[i + 3] * 0.9);
    // 桌面：窗户形状的阳光落在桌上
    for (let i = 0; i < WT.length; i += 3) { const x = WT[i], z = WT[i + 1], lit = sunlit(x, 0, z); P3(B, c, x, 0, z, mix(0.6, 1, lit), mix(0.62, 0.9, lit), mix(0.75, 0.7, lit), WT[i + 2] * 0.7 + lit * 0.12); }   // 桌上的光斑主要画在背景里（平滑），点只给一点质感
    // 只剩一只杯子（B）
    for (let i = 0; i < WCUP.length; i += 6) {
      if (WCUP[i + 4] === 0) continue; const lit = sunlit(WCUP[i], WCUP[i + 1], WCUP[i + 2]);
      if (WCUP[i + 5]) { P3(B, c, WCUP[i], WCUP[i + 1], WCUP[i + 2], 1, 0.8, 0.55, WCUP[i + 3] * 0.6); continue; }
      P3(B, c, WCUP[i], WCUP[i + 1], WCUP[i + 2], mix(0.9, 1, lit), mix(0.88, 0.92, lit), mix(0.9, 0.78, lit), WCUP[i + 3] * (0.75 + lit * 0.5));
    }
    // 玻璃上还没干的几颗水珠，闪一下
    for (let i = 0; i < WBD.length; i += 4) { if (WBD[i + 3] > 0.14) continue; P3(B, c, WBD[i], WBD[i + 1], WIN.z - 2, 1, 0.96, 0.88, 0.5 * (0.6 + 0.4 * Math.sin(E * 2 + WBD[i + 3] * 60))); }
    // 阳光里的浮尘：只有在光柱里才亮
    for (let k = 0; k < WDM.length; k += 4) {
      const q = WDM[k + 3]; curl(WDM[k] * 0.5, WDM[k + 1] * 0.5, E * 0.15 + q * 4, CV);
      const x = WDM[k] + CV[0] * 30 + Math.sin(E * 0.2 + q * 9) * 20, y = WDM[k + 1] + CV[1] * 30 + ((E * 6 + q * 100) % 40) - 20, z = WDM[k + 2];
      const lit = sunlit(x, y, z); if (lit < 0.5) continue;
      wspr(c, x, y, z, 1.1 + q * 1.4, 0.55 * (0.5 + 0.5 * Math.sin(E * (0.8 + q) + q * 30)), TI("sun"));
    }
  },
  bg(ctx, E, c, a) {
    ctx.globalAlpha = a;
    const g = ctx.createRadialGradient(960, 480, 100, 960, 480, 1300); g.addColorStop(0, "#2a2620"); g.addColorStop(1, "#0b0a0a"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 窗外：明亮的白天（过曝的暖白）
    const box = screenBox(c, WCORNERS);
    if (box) {
      ctx.save(); quadPath(ctx, c, WCORNERS); ctx.clip();
      const sg = ctx.createLinearGradient(0, box[1], 0, box[3]); sg.addColorStop(0, "#b9cfe6"); sg.addColorStop(0.55, "#e9e2d4"); sg.addColorStop(1, "#f4d7ae"); ctx.fillStyle = sg; ctx.fillRect(box[0], box[1], box[2] - box[0], box[3] - box[1]);
      ctx.filter = "blur(26px)"; const bw = box[2] - box[0], bh = box[3] - box[1];
      const fr = rng(77); for (let i = 0; i < 26; i++) { const u = fr(), v = 0.45 + fr() * 0.6, rr = 0.04 + fr() * 0.08, side = u < 0.4 || u > 0.72; if (!side && v < 0.8) continue; ctx.fillStyle = `rgba(${fr() < 0.5 ? "84,98,72" : "112,118,88"},${0.18 + fr() * 0.14})`; ctx.beginPath(); ctx.ellipse(box[0] + u * bw, box[1] + v * bh, rr * bw, rr * bw * 0.8, 0, 0, TAU); ctx.fill(); }   // 窗外虚焦的树叶
      ctx.filter = "none"; glow(ctx, box[0] + bw * 0.82, box[1] + bh * 0.12, bw * 0.45, "255,246,220", 0.6);
      // 窗框和窗棂：亮窗前面的深色剪影
      ctx.fillStyle = "rgba(24,20,18,0.92)"; const bar = (x0, y0, x1, y1) => { quadPath(ctx, c, [[x0, y0, WIN.z], [x1, y0, WIN.z], [x1, y1, WIN.z], [x0, y1, WIN.z]]); ctx.fill(); };
      bar(-12, WIN.y0, 12, WIN.y1); bar(WIN.x0, -407, WIN.x1, -383); bar(WIN.x0, WIN.y0, WIN.x1, WIN.y0 + 14); bar(WIN.x0, WIN.y1 - 14, WIN.x1, WIN.y1); bar(WIN.x0, WIN.y0, WIN.x0 + 14, WIN.y1); bar(WIN.x1 - 14, WIN.y0, WIN.x1, WIN.y1);
      ctx.restore();
    }
    // 光柱：每块玻璃一束，从窗户斜着落到桌上（柔化）
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(14px)";
    for (const [px0, px1, py0, py1] of [[WIN.x0 + 8, -10, WIN.y0 + 8, -404], [10, WIN.x1 - 8, WIN.y0 + 8, -404], [WIN.x0 + 8, -10, -386, WIN.y1 - 8], [10, WIN.x1 - 8, -386, WIN.y1 - 8]]) {
      const top = [[px0, py0, WIN.z], [px1, py0, WIN.z]], bot = [[px1, py1, WIN.z], [px0, py1, WIN.z]];
      const hit = ([x, y, z]) => { const t = (0 - y) / SUN[1]; return [x + SUN[0] * t, 0, z + SUN[2] * t]; };
      const poly = [top[0], top[1], hit(bot[0]), hit(bot[1])]; const sh = screenBox(c, poly); if (!sh) continue;
      const lg = ctx.createLinearGradient(0, sh[1], 0, sh[3]); lg.addColorStop(0, `rgba(255,236,200,${0.2 * a})`); lg.addColorStop(1, `rgba(255,236,200,${0.06 * a})`);
      ctx.fillStyle = lg; quadPath(ctx, c, [top[0], top[1], hit(top[1]), hit(top[0])]); ctx.fill();
      // 落在桌上的那块光（窗格的形状）
      ctx.fillStyle = `rgba(255,228,180,${0.3 * a})`; quadPath(ctx, c, [hit(top[0]), hit(top[1]), hit(bot[0]), hit(bot[1])]); ctx.fill();
    }
    ctx.restore(); ctx.globalAlpha = 1;
  },
  over(ctx, E, c, a) {},
};
