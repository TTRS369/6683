// 场景⑧ 天亮前的海边：低机位顺着沙滩往远处看。两行脚印一拍一步往远处走，左边那行走到一半停了，右边那行一直走下去。
// 127.9 天慢慢亮；138.19 太阳从刚才那个光点的位置升起来，海上铺出一条金色的路，一个大浪漫上来，把脚印都抹平了。
// 之后只剩一行新的脚印，朝着太阳走远。单位是毫米，地面 y = 0，海在右边。
const SUNP0 = [242000, 0, 420000], SUN_R = 9000;               // 太阳在海面上方偏右（方位约 30°）
let SUNP = SUNP0.slice();
const shoreX = z => 900 + 0.1 * z + 300 * Math.sin(z * 0.00025);
const BSTEP = 0.86, FP0 = 114.8;
const WALK = [{ off: 1950, stride: 620, n: 8, t0: FP0 }, { off: 1350, stride: 680, n: 27, t0: FP0 + 0.43 }];   // 离水边的距离
let BSEA, BSAND, BFP, BFOAM, BCLOUD;
function buildBeach() {
  const r = rng(801);
  // 海：近处密、远处疏（按距离的对数取样）
  const s = []; for (let i = 0; i < 230000; i++) { const z = 400 * Math.pow(900, r()), x0 = shoreX(z), x = x0 + r() * (z * 2.3 + 7000); s.push(x, z, r(), r()); } BSEA = new Float32Array(s);
  // 沙滩
  const d = []; for (let i = 0; i < 90000; i++) { const z = 300 * Math.pow(600, r()), x = shoreX(z) - r() * (z * 1.2 + 3000); d.push(x, z, r()); } BSAND = new Float32Array(d);
  // 一只脚印的轮廓（局部坐标：x 横向、z 朝前，单位毫米）：脚掌 + 脚跟 + 五个脚趾
  const fp = [];
  // 一只脚印：一圈轮廓（脚跟圆、足弓窄、前掌宽）+ 五个脚趾 + 很淡的里面
  const prof = [[-120, 0], [-108, 26], [-88, 36], [-60, 34], [-30, 27], [0, 29], [30, 39], [58, 45], [86, 42], [104, 32], [116, 16], [120, 0]];
  const half = z => { for (let j = 1; j < prof.length; j++) if (z <= prof[j][0]) return mix(prof[j - 1][1], prof[j][1], (z - prof[j - 1][0]) / (prof[j][0] - prof[j - 1][0])); return 0; };
  for (let i = 0; i < 220; i++) { const z = mix(-120, 120, r()), side = r() < 0.5 ? -1 : 1, arch = side < 0 ? 6 * Math.exp(-Math.pow((z + 15) / 35, 2)) : 0; fp.push(side * (half(z) - arch) + (r() - 0.5) * 3, z, 1); }
  for (let t = 0; t < 5; t++) { const tx = -26 + t * 13, tz = 142 - Math.abs(t - 0.4) * 8, tr = t === 0 ? 11 : 7 - t * 0.6; for (let i = 0; i < 16; i++) { const a = r() * TAU; fp.push(tx + Math.cos(a) * tr, tz + Math.sin(a) * tr, 0.85); } }
  for (let i = 0; i < 90; i++) { const z = mix(-110, 110, r()); fp.push((r() - 0.5) * 1.6 * half(z), z, 0.18); }
  BFP = new Float32Array(fp);
  const fo = []; for (let i = 0; i < 26000; i++) fo.push(300 * Math.pow(500, r()), r(), r()); BFOAM = new Float32Array(fo);
  // 天上的几缕云（只用来画背景）[x, y, z, 宽, 高]
  BCLOUD = []; for (let i = 0; i < 14; i++) BCLOUD.push([mix(-250000, 350000, r()), -mix(9000, 60000, r()), mix(380000, 460000, r()), mix(30000, 90000, r()), mix(1500, 4500, r())]);
}
const FOG_SEA = [3000, 60000, 160000];
// 浪：平时一波波小小地涌上来（七拍一波）；138.19 那个大浪一直漫到脚印那边，再退回去
function bigWave(E) { const t = E - S.final; return t < 0 ? 0 : t < 1.6 ? sm(t / 1.6) : 1 - sm((t - 1.6) / 3.2); }
const runup = (z, E) => 260 * Math.sin(TAU * (E - 100) / 6.02 + z * 0.00018) + bigWave(E) * (1900 + 0.11 * z);
// 一个脚印什么时候被浪抹掉：浪头漫过它的时候
function washed(x, z, tAppear, E) { if (tAppear >= S.final) return 0; for (let t = S.final; t <= Math.min(E, S.final + 1.6); t += 0.1) if (shoreX(z) - runup(z, t) < x) return ss(t, t + 0.5, E); return 0; }
function sunY(E) { return trk(E, [[100, SUN_R * 1.2], [S.final - 1.5, SUN_R * 1.1], [S.final + 1, -SUN_R * 0.3], [S.fall, -24000], [S.end, -38000]]); }   // 太阳的圆心；天亮前藏在地平线下
// 天的亮度：0 = 天亮前，1 = 日出
const dawnK = E => ss(S.rebuild, S.final + 2, E);
const BEACH = {
  cam(E) { return pathCam(E, [[110, [-1400, -700, -2600]], [S.final, [-1250, -740, 2400]], [S.fall + 2, [-1150, -800, 4800]]], [[110, [28000, -900, 60000]], [S.final, [28500, -1500, 60000]], [S.fall + 2, [29000, -2000, 60000]]]); },
  pts(B, E, c, cams) {
    FOG = FOG_SEA; SUNP[1] = sunY(E);
    const dk = dawnK(E), rise = ss(S.final - 0.8, S.final + 3, E);
    // 太阳在屏幕上的位置（海面反光的那条路对着它）
    const sx = proj(c, SUNP[0], 0, SUNP[2]) ? PX : 1100;
    // 海：小浪起伏；对着太阳的那一条亮，一闪一闪
    for (let i = 0; i < BSEA.length; i += 4) {
      const x = BSEA[i], z = BSEA[i + 1], q = BSEA[i + 2], q2 = BSEA[i + 3];
      const ph = x * 0.0021 + z * 0.0007 + E * 1.4, y = -(38 * Math.sin(ph) + 18 * Math.sin(x * 0.0047 - z * 0.0013 + E * 2.1 + 1)) * Math.min(1, z / 3000);
      if (!proj(c, x, y, z)) continue;
      const dx = (PX - sx) / (90 + 260 * Math.min(1, 6000 / z)), path = Math.exp(-dx * dx), sp = Math.pow(0.5 + 0.5 * Math.sin(q * 80 + E * (3 + q2 * 5) + ph * 3), 10);
      const crest = Math.pow(0.5 + 0.5 * Math.sin(ph), 3);                                  // 一道道涌向岸边的浪脊
      const glowI = mix(0.35, 1, dk) * (0.4 + 0.6 * rise), a = (0.05 + 0.09 * crest) * (0.6 + 0.7 * dk) + glowI * path * (0.12 + 2.0 * sp * (0.3 + 0.7 * rise));
      const w = Math.min(1, path * 1.2 * (0.3 + 0.7 * dk));
      B.push(PX, PY, mix(0.45, 1, w), mix(0.55, 0.78, w), mix(0.85, 0.5, w), a * depthA(PZ));
    }
    // 金色的路：太阳底下海面上一闪一闪的光
    if (dk > 0.05) for (let k = 0; k < 1100; k++) {
      const h1 = hash(k * 1.31), h2 = hash(k * 2.77 + 1), h3 = hash(k * 0.53 + 9), d = 1500 * Math.pow(250, h1), ux = SUNP[0] / Math.hypot(SUNP[0], SUNP[2]), uz = SUNP[2] / Math.hypot(SUNP[0], SUNP[2]);
      const x = c.x + ux * d + (h2 - 0.5) * d * 0.09 * (1 + h3), z = c.z + uz * d; if (x < shoreX(z) + 300) continue;
      const tw = Math.pow(Math.max(0, Math.sin(E * (2 + h3 * 4) + h2 * 60)), 12);
      wspr(c, x, -10, z, 30 + d * 0.002, tw * 0.9 * dk * (0.3 + 0.7 * rise), h3 < 0.5 ? TI("sun") : TI("gold"), null, 0, 0, 0, 2.2, 0, 24);
    }
    // 沙滩：越靠近水越湿越亮（映着天光）
    const sc = mix3([0.45, 0.48, 0.65], [0.95, 0.75, 0.62], dk);
    for (let i = 0; i < BSAND.length; i += 3) { const x = BSAND[i], z = BSAND[i + 1], wet = Math.exp(-Math.max(0, shoreX(z) - x) / 700); P3(B, c, x, 0, z, sc[0], sc[1], sc[2], (0.05 + 0.07 * BSAND[i + 2]) * (0.6 + 0.8 * dk) + 0.08 * wet * (0.4 + dk)); }
    // 浪花：沿着水边一条白线，跟着浪进退
    for (let i = 0; i < BFOAM.length; i += 3) {
      const z = BFOAM[i], q = BFOAM[i + 1], ru = runup(z, E), x = shoreX(z) - ru + (BFOAM[i + 2] - 0.5) * 140 + Math.pow(q, 3) * 500;   // 浪往沙滩这边（-x）涌
      const fresh = 0.5 + 0.5 * Math.sin(TAU * (E - 100) / 6.02 + z * 0.00018 + 1.2);
      P3(B, c, x, -4, z, 0.9, 0.93, 1, (0.12 + 0.25 * fresh + 0.5 * bigWave(E)) * (1 - q * 0.7) * (0.6 + 0.6 * dk));
    }
    // 脚印：一拍一步，刚踩下去的时候亮一下
    for (let w = 0; w < 2; w++) {
      const wk = WALK[w], nMax = w === 0 ? wk.n : 60;
      for (let k = 0; k < nMax; k++) {
        let tA = wk.t0 + k * BSTEP; if (w === 1 && k >= wk.n) { if (k < 31) continue; tA = S.final + 3.2 + (k - 31) * BSTEP; }   // 浪退了以后，右边那行接着走
        if (E < tA) break;
        const z = 900 + k * wk.stride, foot = k % 2, x = shoreX(z) - wk.off + (foot ? 95 : -95), wsh = washed(x, z, tA, E);
        const age = E - tA, fa = ss(0, 0.25, age) * (1 - wsh) * (k >= wk.n ? 1 - ss(S.fall - 2, S.end - 12, E) * 0.6 : 1);
        if (fa < 0.01) continue;
        const col = mix3([1, 0.82, 0.55], mix3([0.7, 0.78, 1], [1, 0.86, 0.7], dk), ss(0.2, 2.5, age)), ang = (foot ? -0.06 : 0.06);
        const ca = Math.cos(ang), sa = Math.sin(ang), fl = foot ? 1 : -1;
        for (let i = 0; i < BFP.length; i += 3) { const lx = BFP[i] * fl, lz = BFP[i + 1]; P3(B, c, x + lx * ca - lz * sa, -2, z + lx * sa + lz * ca, col[0], col[1], col[2], fa * BFP[i + 2] * (0.34 + 0.5 * Math.exp(-age * 1.5))); }
        wspr(c, x, -20, z, k >= wk.n ? 420 : 160, fa * (k >= wk.n ? 0.75 : 0.5) * Math.exp(-age * (k >= wk.n ? 1.1 : 1.6)), TI("gold"));
      }
    }
    // 太阳和天亮前那点光
    if (proj(c, SUNP[0], 0, SUNP[2])) { const pre = 1 - rise; spr(PX, PY, 18, 18, 0, pre * 0.9, TI("white")); spr(PX, PY, 70, 70, 0, pre * 0.45, TI("warm")); }
    if (rise > 0 && proj(c, SUNP[0], SUNP[1], SUNP[2]) && PY < horizonY(c, 500000) + 6) { spr(PX, PY, 300, 300, 0, rise * 0.16, TI("sun")); spr(PX, PY, 900, 900, 0, rise * 0.05, TI("gold")); }
  },
  bg(ctx, E, c, a) {
    SUNP[1] = sunY(E);
    const dk = dawnK(E), rise = ss(S.final - 0.8, S.final + 3, E), hy = horizonY(c, 500000);
    const k3 = (p, q, r) => mix3(mix3(p, q, ss(S.rebuild, S.final, E)), r, ss(S.final, S.final + 8, E));
    const top = k3([5, 8, 22], [22, 30, 68], [44, 70, 118]), mid = k3([14, 20, 44], [92, 70, 104], [150, 130, 150]), hor = k3([34, 38, 70], [200, 120, 96], [250, 190, 140]);
    const rgbS = v => `rgb(${v.map(x => Math.round(x)).join(",")})`;
    ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, hy - 700, 0, hy); g.addColorStop(0, rgbS(top)); g.addColorStop(0.6, rgbS(mid)); g.addColorStop(1, rgbS(hor)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, hy);
    // 云：被日出从下面照亮
    ctx.save(); ctx.filter = "blur(12px)";
    for (const [x, y, z, w, h] of BCLOUD) { if (!proj(c, x, y, z)) continue; const cx = PX, cy = PY, k = FOC / PZ; const cc = mix3(mix3([30, 34, 60], [170, 96, 110], ss(S.rebuild, S.final, E)), [255, 200, 170], ss(S.final, S.final + 8, E)); ctx.fillStyle = `rgba(${cc.map(v => v | 0)},0.5)`; ctx.beginPath(); ctx.ellipse(cx, cy, w * k, h * k, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
    // 太阳 / 天亮前的光晕（只在地平线以上）
    if (proj(c, SUNP[0], SUNP[1], SUNP[2])) {
      const px = PX, py = PY, rr = SUN_R * FOC / PZ;
      glow(ctx, px, hy, 900, "255,170,120", (0.18 + 0.36 * dk) * a);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, hy); ctx.clip(); glow(ctx, px, py, rr * 6, "255,220,170", 0.3 * rise * a); ctx.fillStyle = `rgba(255,246,226,${rise * a})`; ctx.beginPath(); ctx.arc(px, py, rr, 0, TAU); ctx.fill(); ctx.restore();
    }
    // 海面（映着天）和沙滩
    const sg = ctx.createLinearGradient(0, hy, 0, H); sg.addColorStop(0, rgbS(hor.map(v => v * 0.75))); sg.addColorStop(0.25, rgbS(mid.map(v => v * 0.45))); sg.addColorStop(1, rgbS(top.map(v => v * 0.4))); ctx.fillStyle = sg; ctx.fillRect(0, hy, W, H - hy);
    ctx.beginPath(); let first = true;
    for (let i = 0; i <= 60; i++) { const z = 200 * Math.pow(2500, i / 60); if (!proj(c, shoreX(z), 0, z)) continue; if (first) { ctx.moveTo(PX, PY); first = false; } else ctx.lineTo(PX, PY); }
    ctx.lineTo(-50, hy); ctx.lineTo(-50, H + 50); ctx.closePath();
    const dg = ctx.createLinearGradient(0, hy, 0, H); const sd = mix3([7, 7, 13], [40, 32, 34], dk); dg.addColorStop(0, rgbS(sd.map(v => v * 1.3))); dg.addColorStop(1, rgbS(sd.map(v => v * 0.45))); ctx.fillStyle = dg; ctx.fill();
    // 湿沙映着天：水边一窄条；大浪退下去以后，它漫过的地方整片发亮，几秒钟后慢慢干掉
    const wetK = ss(S.final + 0.4, S.final + 2.2, E) * (1 - ss(S.final + 5, S.final + 15, E));
    ctx.save(); ctx.filter = "blur(20px)";
    const band = (wf, al) => { if (al < 0.003) return; ctx.beginPath(); let f2 = true; const zs = []; for (let i = 0; i <= 60; i++) zs.push(200 * Math.pow(200, i / 60));
      for (const z of zs) if (proj(c, shoreX(z), 0, z)) { if (f2) { ctx.moveTo(PX, PY); f2 = false; } else ctx.lineTo(PX, PY); }
      for (const z of zs.reverse()) if (proj(c, shoreX(z) - wf(z), 0, z)) ctx.lineTo(PX, PY);
      ctx.closePath(); const wg = ctx.createLinearGradient(0, hy, 0, H); wg.addColorStop(0, `rgba(${hor.map(v => v | 0)},${al})`); wg.addColorStop(1, `rgba(${mid.map(v => v * 0.6 | 0)},${al * 0.5})`); ctx.fillStyle = wg; ctx.fill(); };
    band(() => 520, 0.22 * (0.4 + 0.6 * dk)); band(z => 1900 + 0.11 * Math.min(z, 20000), 0.28 * wetK);
    ctx.restore();
    ctx.globalAlpha = 1;
  },
  over(ctx, E, c, a) {},
};
