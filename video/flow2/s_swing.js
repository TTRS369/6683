// 场景④ 黄昏的公园：两架秋千，左边那架静止，右边那架还在轻轻地荡，越荡越小。
// 一盏路灯刚亮，地上一圈暖光；风吹下几片叶子。单位是毫米，地面 y = 0。
const SWT = -2250, SWL = 1800, SWX = [-620, 620], LAMP = [1800, -3350, 4200];
let SGR, SFR, SLP, SLF, STREE, SSTAR;
function buildSwing() {
  const r = rng(401);
  // 地面：稀疏的草地；秋千底下磨秃了一块（点少）
  const g = []; for (let i = 0; i < 90000; i++) { const x = mix(-6000, 7500, r()), z = mix(-3500, 9000, Math.pow(r(), 0.8)); let b = 0.03 + r() * 0.03; for (const sx of SWX) { const d = Math.hypot((x - sx) / 500, z / 900); if (d < 1) b *= 0.35 + 0.65 * d; } g.push(x, -r() * 25, z, b); }
  SGR = new Float32Array(g);
  // 秋千架：顶梁 + 两边的 A 字腿
  const f = [], seg = (a, b, n, br) => { for (let i = 0; i < n; i++) { const u = r(); f.push(mix(a[0], b[0], u) + (r() - 0.5) * 18, mix(a[1], b[1], u) + (r() - 0.5) * 18, mix(a[2], b[2], u) + (r() - 0.5) * 18, br); } };
  seg([-1400, SWT, 0], [1400, SWT, 0], 5200, 0.42);
  for (const sx of [-1400, 1400]) for (const sz of [-750, 750]) seg([sx, SWT, 0], [sx * 1.08, 0, sz], 2600, 0.32);
  SFR = new Float32Array(f);
  // 路灯：灯杆 + 灯罩
  const lp = []; for (let i = 0; i < 4200; i++) { const ph = r() * TAU; lp.push(LAMP[0] + Math.cos(ph) * 40, LAMP[1] + 120 + r() * (-LAMP[1] - 120), LAMP[2] + Math.sin(ph) * 40, 0.05 + 0.4 * Math.pow(Math.abs(Math.cos(ph)), 6)); }
  for (let i = 0; i < 900; i++) { const ph = r() * TAU, h = r(); lp.push(LAMP[0] + Math.cos(ph) * mix(50, 110, h), LAMP[1] - 30 + h * 80, LAMP[2] + Math.sin(ph) * mix(50, 110, h), 0.16); }
  SLP = new Float32Array(lp);
  // 落叶 [x, 起始高度, z, 速度, 相位, 颜色]
  const lf = []; for (let i = 0; i < 14; i++) lf.push(mix(-2200, 1800, r()), r(), mix(-1600, 1400, r()), 240 + r() * 200, r(), r() < 0.5 ? 0 : 1); SLF = new Float32Array(lf);
  // 远处的树林轮廓（只用来画背景）
  // 一棵棵树冠（半椭圆）叠成的轮廓，大小不一
  const crowns = []; for (let x = -70000; x < 70000; x += 500 + r() * 1400) crowns.push([x, 400 + r() * 1000, 300 + r() * 600 + (r() < 0.15 ? 450 : 0)]);
  STREE = []; for (let i = 0; i <= 1400; i++) { const x = mix(-70000, 70000, i / 1400); let h = 260; for (const [cx, w, hh] of crowns) { const u = (x - cx) / w; if (Math.abs(u) < 1) h = Math.max(h, 260 + hh * Math.sqrt(1 - u * u)); } STREE.push([x, -h - 70 * Math.sin(x * 0.011) * Math.sin(x * 0.0043) - 45 * Math.sin(x * 0.031 + 1)]); }
  SSTAR = []; for (let i = 0; i < 50; i++) SSTAR.push([mix(-40000, 40000, r()), -mix(9000, 30000, r()), 60000, r()]);
}
const FOG_PARK = [2500, 7000, 9000];
// 右边的秋千：一开始荡得比较大，慢慢停下来；左边的不动
function swingAng(k, E) { if (k === 0) return 0.012 * Math.sin(E * 0.9); const t = E - 45; return 0.3 * Math.exp(-t / 9) * Math.sin(TAU * t / 2.58); }
const SWING = {
  cam(E) { return pathCam(E, [[47, [-1900, -820, -3500]], [S.chorus + 2, [-1250, -760, -2650]]], [[47, [450, -1150, 300]], [S.chorus + 2, [520, -1120, 300]]]); },
  pts(B, E, c, cams) {
    FOG = FOG_PARK;
    const lampOn = ss(50.4, 52.2, E);
    // 地面：路灯下一圈暖光
    for (let i = 0; i < SGR.length; i += 4) {
      const x = SGR[i], z = SGR[i + 2], d = Math.hypot(x - LAMP[0], z - LAMP[2]) / 2600, pool = lampOn * Math.exp(-d * d * 1.6);
      P3(B, c, x, SGR[i + 1], z, mix(0.42, 1, pool), mix(0.5, 0.8, pool), mix(0.78, 0.5, pool), SGR[i + 3] * (0.8 + 2.2 * pool));
    }
    for (let i = 0; i < SFR.length; i += 4) P3(B, c, SFR[i], SFR[i + 1], SFR[i + 2], 0.62, 0.68, 0.9, SFR[i + 3] * 0.8);
    for (let i = 0; i < SLP.length; i += 4) P3(B, c, SLP[i], SLP[i + 1], SLP[i + 2], 0.7, 0.72, 0.85, SLP[i + 3]);
    // 两架秋千：链子和座板。动的那架用三个子帧画出动态模糊
    for (let k = 0; k < 2; k++) {
      const sx = SWX[k], ns = k ? 3 : 1;
      for (let m = 0; m < ns; m++) {
        const th = swingAng(k, E - m / 360), cy = Math.cos(th), sz = Math.sin(th), cm = cams[m], a = 1 / ns, warm = 0.35 * lampOn;
        const col = [mix(0.72, 1, warm), mix(0.78, 0.86, warm), mix(1, 0.7, warm)];
        for (const dx of [-210, 210]) seg3(B, cm, sx + dx, SWT, 0, sx + dx, SWT + SWL * cy, SWL * sz, 300, col, 0.75 * a, k * 31 + dx);
        // 座板（450×180，跟着链子一起转）
        for (let i = 0; i < 900; i++) {
          const u = hash(k * 13 + i * 0.71) - 0.5, v = hash(k * 17 + i * 1.37) - 0.5, edge = i < 600, ux = edge ? (i % 2 ? Math.sign(u) * 0.5 : u) : u, vz = edge ? (i % 2 ? v : Math.sign(v) * 0.5) : v;
          P3(B, cm, sx + ux * 460, SWT + SWL * cy - vz * 180 * sz, SWL * sz + vz * 180 * cy, col[0], col[1], col[2], (edge ? 0.6 : 0.12) * a);   // 座板始终和链子垂直
        }
      }
    }
    // 灯泡
    wspr(c, LAMP[0], LAMP[1] + 40, LAMP[2], 90, lampOn * 0.95, TI("warm"), null, 0, 0, 0, 1, 0, 90);
    wspr(c, LAMP[0], LAMP[1] + 40, LAMP[2], 30, lampOn, TI("white"));
    // 落叶：被风吹着打转往下落
    for (let k = 0; k < SLF.length; k += 6) {
      const v = SLF[k + 3], ph = SLF[k + 4], tt = ((E - 40) * v / 3400 + SLF[k + 1]) % 1, y = -3400 + tt * 3400;
      const pos = (t2, o) => { curl(SLF[k] * 0.001 + t2 * 0.3, ph * 7, t2 * 0.4, CV); o[0] = SLF[k] + Math.sin(t2 * 1.3 + ph * 9) * 260 + CV[0] * 260 + (t2 - 50) * 90; o[2] = SLF[k + 2] + Math.cos(t2 * 1.1 + ph * 5) * 200; };
      pos(E, TB); const x = TB[0], z = TB[2]; pos(E - 1 / 30, TB);
      const fade = ss(0, 0.06, tt) * (1 - ss(0.94, 1, tt));
      wspr(c, x, y, z, 26, 0.7 * fade, SLF[k + 5] ? TI("leaf") : TI("leaf2"), c, TB[0], y - v / 30, TB[2], 2.2, E * (1.5 + ph * 2) + ph * 9, 16);
    }
  },
  bg(ctx, E, c, a) {
    ctx.globalAlpha = a;
    // 黄昏的天：顶上深蓝，地平线一层暖色
    const hy = horizonY(c, 60000);
    const g = ctx.createLinearGradient(0, hy - 900, 0, hy + 10); g.addColorStop(0, "#070b1c"); g.addColorStop(0.55, "#1d2142"); g.addColorStop(0.85, "#5b3d4e"); g.addColorStop(1, "#a8644c");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, hy + 10);
    ctx.fillStyle = "#06070b"; ctx.fillRect(0, hy, W, H - hy);
    glow(ctx, 1500, hy, 700, "220,130,90", 0.25);
    ctx.globalCompositeOperation = "lighter"; for (const [x, y, z, q] of SSTAR) if (proj(c, x, y, z) && PY < hy - 120) glow(ctx, PX, PY, 3, "220,230,255", 0.5 * (0.6 + 0.4 * Math.sin(E * (0.7 + q) + q * 40)) * a); ctx.globalCompositeOperation = "source-over";
    // 远处的树林剪影
    ctx.fillStyle = "#07080e"; ctx.beginPath(); let st = false;
    for (const [x, y] of STREE) { if (!proj(c, x, y, 20000)) continue; if (!st) { ctx.moveTo(PX, PY); st = true; } else ctx.lineTo(PX, PY); }
    ctx.lineTo(W + 50, hy + 30); ctx.lineTo(-50, hy + 30); ctx.closePath(); ctx.fill();
    // 路灯在地上的一圈光，秋千的影子被拉得很长，跟着一起晃
    const lampOn = ss(50.4, 52.2, E);
    if (lampOn > 0.01) {
      const ring = []; for (let i = 0; i < 48; i++) { const t = i / 48 * TAU; if (proj(c, LAMP[0] + Math.cos(t) * 5200, 0, LAMP[2] + Math.sin(t) * 5200)) ring.push([PX, PY]); }
      if (ring.length > 40 && proj(c, LAMP[0], 0, LAMP[2])) {
        const cx = PX, cy = PY, rx = Math.max(...ring.map(p => Math.abs(p[0] - cx))), ry = Math.max(...ring.map(p => Math.abs(p[1] - cy)));
        ctx.save(); ctx.translate(cx, cy); ctx.scale(rx, ry); const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); pg.addColorStop(0, `rgba(150,105,62,${0.55 * lampOn * a})`); pg.addColorStop(0.45, `rgba(90,62,40,${0.3 * lampOn * a})`); pg.addColorStop(1, "rgba(40,30,24,0)");
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
        // 影子：从灯沿直线投到地上
        const sh = (x, y, z) => { const t = -LAMP[1] / (y - LAMP[1]); return proj(c, LAMP[0] + (x - LAMP[0]) * t, 0, LAMP[2] + (z - LAMP[2]) * t); };
        ctx.save(); ctx.strokeStyle = `rgba(8,8,12,${0.55 * lampOn * a})`; ctx.lineCap = "round"; ctx.filter = "blur(2px)";
        const ln = (p, q, w) => { if (!sh(...p)) return; const x0 = PX, y0 = PY; if (!sh(...q)) return; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(PX, PY); ctx.stroke(); };
        for (let k = 0; k < 2; k++) { const th = swingAng(k, E), sx = SWX[k], y = SWT + SWL * Math.cos(th), z = SWL * Math.sin(th); for (const dx of [-210, 210]) ln([sx + dx, SWT, 0], [sx + dx, y, z], 3); ln([sx - 230, y, z], [sx + 230, y, z], 12); }
        ln([-1400, SWT, 0], [1400, SWT, 0], 5); for (const sx of [-1400, 1400]) for (const sz of [-750, 750]) ln([sx, SWT, 0], [sx * 1.08, -1, sz], 5);
        ctx.restore();
      }
    }
    if (proj(c, LAMP[0], LAMP[1] + 40, LAMP[2])) { ctx.globalCompositeOperation = "lighter"; glow(ctx, PX, PY, 380, "255,200,140", 0.22 * lampOn * a); ctx.globalCompositeOperation = "source-over"; }
    ctx.globalAlpha = 1;
  },
  over(ctx, E, c, a) {},
};
