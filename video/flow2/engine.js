// 第五版的三维粒子引擎：透视镜头（偏航+俯仰）、风场、柔光贴图、场景之间的粒子流动转场
// 依赖 ../late/core.js（Pts、cloud、splatAll、composite、morph、glow、rgb、mix3 ...）
const FOC = 1250;
const sm = x => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
function kf(t, ks) { if (t <= ks[0][0]) return ks[0][1]; for (let i = 1; i < ks.length; i++) if (t < ks[i][0]) return mix(ks[i - 1][1], ks[i][1], sm((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0]))); return ks[ks.length - 1][1]; }
// 样条轨道：经过关键帧时速度连续
function trk(t, ks) {
  const n = ks.length; if (t <= ks[0][0]) return ks[0][1]; if (t >= ks[n - 1][0]) return ks[n - 1][1];
  let i = 0; while (t > ks[i + 1][0]) i++;
  const [t0, p0] = ks[i], [t1, p1] = ks[i + 1], h = t1 - t0, u = (t - t0) / h;
  const m = j => (j <= 0 || j >= n - 1) ? 0 : (ks[j + 1][1] - ks[j - 1][1]) / (ks[j + 1][0] - ks[j - 1][0]);
  const m0 = m(i) * h, m1 = m(i + 1) * h, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1;
}
// 三维向量轨道：ks = [[t, [x,y,z]], ...]
const trk3 = (t, ks) => [0, 1, 2].map(j => trk(t, ks.map(k => [k[0], k[1][j]])));

// ---------- 镜头 ----------
const mkCam = (x, y, z, yaw, pitch) => ({ x, y, z, yaw, p: pitch, cy: Math.cos(yaw), sy: Math.sin(yaw), cp: Math.cos(pitch), sp: Math.sin(pitch) });
function lookCam(x, y, z, tx, ty, tz) { const dx = tx - x, dz = tz - z; return mkCam(x, y, z, Math.atan2(dx, dz), Math.atan2(ty - y, Math.hypot(dx, dz))); }
// 位置和注视点都按样条走的镜头
const pathCam = (E, pos, tgt) => { const p = trk3(E, pos), q = trk3(E, tgt); return lookCam(p[0], p[1], p[2], q[0], q[1], q[2]); };
let PX = 0, PY = 0, PZ = 0;
function proj(c, x, y, z) {
  const dx = x - c.x, dy = y - c.y, dz0 = z - c.z, rx = dx * c.cy - dz0 * c.sy, rz = dx * c.sy + dz0 * c.cy;
  const yy = dy * c.cp - rz * c.sp, zz = dy * c.sp + rz * c.cp;
  if (zz < 30) return false; const k = FOC / zz; PX = 960 + rx * k; PY = 540 + yy * k; PZ = zz; return true;
}
// 远近亮度：近处更亮（覆盖面更大），远处被雾吞掉。每个场景的尺度不同，进场景时设置
let FOG = [900, 1800, 2800];
const depthA = z => Math.min(1.7, Math.pow(FOG[0] / z, 0.6)) * Math.exp(-Math.max(0, z - FOG[1]) / FOG[2]);
// 风场：流函数的旋度，处处无散度
function curl(x, y, t, o) {
  const a1 = 0.011 * x + 0.017 * y + 0.7 * t, a2 = -0.023 * x + 0.013 * y + 1.1 * t + 2, a3 = 0.041 * x - 0.037 * y + 1.7 * t + 4;
  o[0] = (Math.cos(a1) * 0.017 + 0.6 * Math.cos(a2) * 0.013 - 0.3 * Math.cos(a3) * 0.037) * 40;
  o[1] = (-Math.cos(a1) * 0.011 + 0.6 * Math.cos(a2) * 0.023 - 0.3 * Math.cos(a3) * 0.041) * 40;
}
const CV = [0, 0];
// 世界里的一个点 → 粒子缓冲
function P3(B, c, x, y, z, r, g, b, a) { if (!proj(c, x, y, z)) return false; B.push(PX, PY, r, g, b, a * depthA(PZ)); return true; }
// 一条线段上的点（带一点固定的粗细抖动，每帧一样）
function seg3(B, c, ax, ay, az, bx, by, bz, n, col, a, seed, th = 2) {
  for (let i = 0; i < n; i++) { const u = (i + hash(seed + i * 1.3)) / n, j1 = (hash(seed * 3.1 + i) - 0.5) * th, j2 = (hash(seed * 7.7 + i) - 0.5) * th; P3(B, c, mix(ax, bx, u) + j1, mix(ay, by, u) + j2, mix(az, bz, u) + j1 * 0.5, col[0], col[1], col[2], a); }
}

// ---------- 柔光贴图 ----------
// 有形状、有大小的东西（花瓣、落叶、雪、灯、光斑、水汽）用预先渲染的柔光斑画：按远近缩放，按运动方向拉长；也画进粒子层，一起发光
const TEXC = {
  white: "255,248,236", cool: "200,220,255", warm: "255,214,160", gold: "255,206,128", rose: "255,156,160", cyan: "160,224,255",
  petal: "255,186,214", petal2: "255,240,246", leafG: "150,220,120", leafG2: "96,180,96", leaf: "232,138,64", leaf2: "190,72,52",
  snow: "240,247,255", snow2: "205,222,255", red: "255,70,56", amber: "255,170,80", steam: "235,238,245", sun: "255,236,190",
};
const TEXN = Object.keys(TEXC), TEXL = [];
function buildTex() { for (const k of TEXN) { const c = mk(64, 64), g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 31); gr.addColorStop(0, `rgba(${TEXC[k]},1)`); gr.addColorStop(0.3, `rgba(${TEXC[k]},0.6)`); gr.addColorStop(1, `rgba(${TEXC[k]},0)`); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); TEXL.push(c); } }
const TI = n => TEXN.indexOf(n);
const SCAP = 240000, SX = new Float32Array(SCAP), SY = new Float32Array(SCAP), SW = new Float32Array(SCAP), SH = new Float32Array(SCAP), SA = new Float32Array(SCAP), SAL = new Float32Array(SCAP), ST = new Uint8Array(SCAP);
let NS = 0, SK = 1, CLIP = null, OCC = null;            // CLIP = [x0,y0,x1,y1]：只在这个屏幕框里画（比如窗外的东西只出现在窗里）；OCC = 挡在前面的屏幕多边形
function inPoly(x, y, p) { let c = false; for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) if ((p[i + 1] > y) !== (p[j + 1] > y) && x < (p[j] - p[i]) * (y - p[i + 1]) / (p[j + 1] - p[i + 1]) + p[i]) c = !c; return c; }
function spr(x, y, w, h, ang, a, ti) {
  a *= SK; if (NS >= SCAP || a < 0.004 || x < -150 || x > W + 150 || y < -150 || y > H + 150) return;
  if (CLIP && (x < CLIP[0] || x > CLIP[2] || y < CLIP[1] || y > CLIP[3])) return;
  if (OCC) for (const p of OCC) if (inPoly(x, y, p)) return;
  SX[NS] = x; SY[NS] = y; SW[NS] = w; SH[NS] = h; SA[NS] = ang; SAL[NS] = Math.min(1, a); ST[NS] = ti; NS++;
}
// 世界里一颗有大小的粒子：size 是半径（世界单位）；给出上一刻的位置时沿运动方向拉长
function wspr(cam, x, y, z, size, a, ti, camB, xb, yb, zb, shape = 1, rot = 0, maxD = 60) {
  if (!proj(cam, x, y, z)) return; const sx = PX, sy = PY, pz = PZ, d0 = 2 * size * FOC / pz, d = Math.max(1.6, Math.min(maxD, d0)), dA = depthA(pz) * (d0 > maxD * 0.35 ? Math.pow(maxD * 0.35 / d0, 1.5) : 1) * (pz < 200 ? Math.pow(pz / 200, 2) : 1);
  let w = d * shape, h = d, ang = rot, cx = sx, cy = sy;
  if (camB && proj(camB, xb, yb, zb)) { const dx = sx - PX, dy = sy - PY, len = Math.hypot(dx, dy); if (len > d * 0.35) { ang = Math.atan2(dy, dx); w = Math.max(w, d + len * 1.5); cx = sx - dx * 0.5; cy = sy - dy * 0.5; } }
  spr(cx, cy, w, h, ang, a * dA * Math.min(1, d / 2.2), ti);
}
function drawSprites() {
  pctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < NS; i++) { pctx.globalAlpha = SAL[i]; const ca = Math.cos(SA[i]), sa = Math.sin(SA[i]), w = SW[i] / 64, h = SH[i] / 64; pctx.setTransform(ca * w, sa * w, -sa * h, ca * h, SX[i], SY[i]); pctx.drawImage(TEXL[ST[i]], -32, -32); }
  pctx.setTransform(1, 0, 0, 1, 0, 0); pctx.globalAlpha = 1; pctx.globalCompositeOperation = "source-over";
}
// 把世界里的矩形投影到屏幕，得到外接框（做 CLIP、画窗里的天空用）
function screenBox(c, pts) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, ok = 0; for (const [x, y, z] of pts) if (proj(c, x, y, z)) { ok++; x0 = Math.min(x0, PX); y0 = Math.min(y0, PY); x1 = Math.max(x1, PX); y1 = Math.max(y1, PY); } return ok ? [x0, y0, x1, y1] : null; }
// 地平线在屏幕上的高度（沿镜头朝向很远的地面点）
const horizonY = (c, d = 80000) => proj(c, c.x + c.sy * d, 0, c.z + c.cy * d) ? PY : 540;
// 世界里的四边形 → 屏幕上的路径（画背景用）
function quadPath(ctx, c, pts) { ctx.beginPath(); let first = true; for (const [x, y, z] of pts) { if (!proj(c, x, y, z)) continue; if (first) { ctx.moveTo(PX, PY); first = false; } else ctx.lineTo(PX, PY); } ctx.closePath(); }
