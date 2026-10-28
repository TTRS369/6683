// 开头的钩子（0–14 秒）：黑暗里粒子拼出一部手机 → 屏幕亮起，消息"他走了。" → 镜头推近 → 只剩这句话
// → 句子炸开 → 在节奏进来那一拍拼成片名 → 片名随风散去
// 时间对齐前奏：3.32 / 4.64 / 6.01 / 8.29 起音，10.26 节奏进入，10.94 小节头
const HOOK = (() => {
  const T = { form: 1.25, formed: 3.1, ping: 3.32, read: 4.64, big: 6.0, bigDone: 7.4, burst: 8.29, title: 10.26, titleDone: 10.94, out: 12.6, end: 14 };
  const PH = { x: 730, y: 80, w: 460, h: 920, r: 64 }, BN = { x: 760, y: 420, w: 400, h: 156, r: 28 };
  function drawFrame(c) { c.lineWidth = 4; rrect(c, PH.x, PH.y, PH.w, PH.h, PH.r); c.stroke(); rrect(c, 960 - 62, PH.y + 26, 124, 32, 16); c.fill(); }
  function drawClock(c) { c.textAlign = "center"; c.textBaseline = "alphabetic"; c.font = `300 150px ${UI}`; c.fillText("18:42", 960, 300); c.font = `300 32px ${UI}`; c.fillText("10月28日 星期三", 960, 352); }
  function drawBannerText(c) {
    c.save(); c.globalAlpha *= 0.55; rrect(c, BN.x + 24, BN.y + 22, 38, 38, 10); c.fill(); c.restore();
    c.textBaseline = "alphabetic"; c.textAlign = "left"; c.font = `300 24px ${UI}`; c.fillText("信息", BN.x + 76, BN.y + 50);
    c.textAlign = "right"; c.fillText("现在", BN.x + BN.w - 24, BN.y + 50);
    c.textAlign = "left"; c.font = `500 30px ${UI}`; c.fillText("阿远", BN.x + 24, BN.y + 98); c.font = `300 32px ${UI}`; c.fillText("他走了。", BN.x + 24, BN.y + 140);
  }
  function drawBig(c) { c.textAlign = "center"; c.textBaseline = "middle"; c.font = `400 240px ${SERIF}`; c.fillText("他走了。", 960, 540); }
  function sample(drawFn, n, seed) {
    const m = mk(), c = m.getContext("2d"); c.fillStyle = c.strokeStyle = "#fff"; drawFn(c);
    const a = c.getImageData(0, 0, W, H).data, idx = []; for (let k = 0; k < W * H; k++) if (a[k * 4 + 3] > 8) idx.push(k);
    const r = rng(seed), out = new Float32Array(n * 2);
    for (let i = 0; i < n;) { const k = idx[r() * idx.length | 0]; if (r() * 255 > a[k * 4 + 3]) continue; out[i * 2] = k % W + r() - 0.5; out[i * 2 + 1] = (k / W | 0) + r() - 0.5; i++; }
    return out;
  }
  function layer(drawFn, col) { const m = mk(W * 2, H * 2), c = m.getContext("2d"); c.scale(2, 2); c.fillStyle = c.strokeStyle = col; drawFn(c); return m; }
  // 分组：0 手机外框；1 时钟日期；2 通知横幅；3 其余的光尘（大字、片名阶段也会被征用）
  const NA1 = 9000, NA2 = 9000, NB = 14000, N = 64000, NBIG = 46000, NTITLE = 36000;
  const DX = new Float32Array(N), DY = new Float32Array(N), VX = new Float32Array(N), PHS = new Float32Array(N), DI = new Float32Array(N);
  const IX = new Float32Array(N), IY = new Float32Array(N), DEL = new Float32Array(N), AMP = new Float32Array(N), NX = new Float32Array(N), NY = new Float32Array(N);
  const INT = new Float32Array(N), GOLD = new Uint8Array(N), G = new Uint8Array(N), BVX = new Float32Array(N), BVY = new Float32Array(N), COL = new Float32Array(N * 3);
  let PT, BT, TT; const L = {};
  function build() {
    const r = rng(2026);
    for (let i = 0; i < N; i++) {
      G[i] = i < NA1 ? 0 : i < NA1 + NA2 ? 1 : i < NA1 + NA2 + NB ? 2 : 3;
      DX[i] = r() * (W + 100); DY[i] = r() * H; VX[i] = 4 + r() * 14; PHS[i] = r() * TAU; DI[i] = r() < 0.94 ? 0.008 : 0.22 + r() * 0.35;
      IX[i] = PH.x + 30 + r() * (PH.w - 60); IY[i] = PH.y + 80 + r() * (PH.h - 160);
      DEL[i] = r(); AMP[i] = (r() - 0.5) * 2 * (40 + r() * 160); const a = r() * TAU; NX[i] = Math.cos(a); NY[i] = Math.sin(a);
      INT[i] = 0.55 + r() * 0.45; GOLD[i] = r() < 0.09 ? 1 : 0;
      const w = r(); COL[i * 3] = mix(0.55, 0.92, w); COL[i * 3 + 1] = mix(0.72, 0.96, w); COL[i * 3 + 2] = 1;
    }
    const fr = sample(drawFrame, NA1, 1), ck = sample(drawClock, NA2, 2);
    const bn = sample(c => { c.globalAlpha = 0.012; rrect(c, BN.x, BN.y, BN.w, BN.h, BN.r); c.fill(); c.globalAlpha = 1; drawBannerText(c); }, NB, 3);
    PT = new Float32Array(N * 2); PT.set(fr, 0); PT.set(ck, NA1 * 2); PT.set(bn, (NA1 + NA2) * 2);
    BT = sample(drawBig, NBIG, 4); TT = sample(drawTitle, NTITLE, 5);
    for (let i = 0; i < NBIG; i++) { const dx = BT[i * 2] - 960, dy = BT[i * 2 + 1] - 540, d = Math.hypot(dx, dy) + 1, sp = 260 + r() * 900, j = (r() - 0.5) * 0.9; BVX[i] = (dx / d * Math.cos(j) - dy / d * Math.sin(j)) * sp; BVY[i] = (dx / d * Math.sin(j) + dy / d * Math.cos(j)) * sp * 0.8; }
    L.frame = layer(drawFrame, "rgb(170,200,255)"); L.clock = layer(drawClock, "rgb(225,235,255)");
    L.banner = layer(c => { c.fillStyle = "rgba(120,150,220,0.24)"; rrect(c, BN.x, BN.y, BN.w, BN.h, BN.r); c.fill(); c.strokeStyle = "rgba(170,200,255,0.25)"; c.lineWidth = 1.5; c.stroke(); c.fillStyle = "rgb(235,242,255)"; drawBannerText(c); }, "");
    L.screen = layer(c => { const g = c.createLinearGradient(0, PH.y, 0, PH.y + PH.h); g.addColorStop(0, "rgba(40,70,140,0.22)"); g.addColorStop(1, "rgba(20,30,70,0.10)"); c.fillStyle = g; rrect(c, PH.x + 2, PH.y + 2, PH.w - 4, PH.h - 4, PH.r - 2); c.fill(); }, "");
    L.big = layer(drawBig, "rgb(225,235,255)"); L.title = layer(drawTitle, "rgb(230,238,255)");
  }
  function camera(t) {
    let s = 1 + 0.03 * ss(1.2, T.read, t), cx = 960, cy = 540;
    if (t > T.read) { const k = eio(clamp((t - T.read) / (T.big - T.read))); s = mix(1.03, 1.34, k); cy = mix(540, BN.y + BN.h / 2, k); }
    if (t > T.big) { const k = eio(clamp((t - T.big) / (T.bigDone - T.big))); s = mix(1.34, 1, k); cy = mix(BN.y + BN.h / 2, 540, k); }
    if (t > T.bigDone) s = 1 + 0.03 * clamp((t - T.bigDone) / (T.burst - T.bigDone));
    if (t > T.burst) s = 1 + 0.07 * Math.exp(-(t - T.burst) * 5);
    if (t > T.title) s = 1 + 0.025 * ss(T.title, T.end, t);
    const b = t - T.ping, buzz = (b > 0 && b < 0.22) || (b > 0.36 && b < 0.58) ? Math.sin(b * 260) * 3.2 : 0;
    return { s, cx, cy, ox: buzz, oy: 0 };
  }
  function pts(P, t) {
    const cam = camera(t), dustFade = ss(0.5, 1.8, t) * (1 - ss(13.2, T.end, t)), gold = ss(9.2, T.titleDone, t);
    const tb = t - T.burst, burstK = tb > 0 ? (1 - Math.exp(-2.2 * tb)) / 2.2 : 0, rot = tb > 0 ? 0.22 * (1 - Math.exp(-tb)) : 0, flareI = tb > 0 ? 1 + 0.9 * Math.exp(-3 * tb) : 1;
    for (let i = 0; i < N; i++) {
      const g = G[i], d = DEL[i];
      let x = ((DX[i] + VX[i] * t) % (W + 100)) - 50, y = DY[i] + Math.sin(t * 0.4 + PHS[i]) * 10, a = DI[i] * dustFade;
      const arc = (tx, ty, e) => { const s = Math.sin(Math.PI * e) * AMP[i]; x = mix(x, tx, e) + NX[i] * s; y = mix(y, ty, e) + NY[i] * s; };
      if (g === 0) { const e = eio(prog(t, T.form, T.formed, d, 0.45)); arc(PT[i * 2], PT[i * 2 + 1], e); a = mix(a, INT[i] * 0.55, e); }
      else if (g < 3) {
        const e1 = eio(prog(t, T.form, T.formed, d, 0.45)); arc(IX[i], IY[i], e1); a = mix(a, 0.1, e1);
        const e2 = eio(prog(t, T.ping, T.ping + 0.6, d, 0.35)), s = Math.sin(Math.PI * e2) * AMP[i] * 0.25;
        x = mix(x, PT[i * 2], e2) + NX[i] * s; y = mix(y, PT[i * 2 + 1], e2) + NY[i] * s; a = mix(a, INT[i], e2);
      }
      if (i < NBIG) {
        const e = eio(prog(t, T.big, T.bigDone, d, 0.4)); if (e > 0) { arc(BT[i * 2], BT[i * 2 + 1], e); a = mix(a, INT[i], e); }
        if (tb > 0) {
          const bx = x - 960 + BVX[i] * burstK, by = y - 540 + BVY[i] * burstK - 30 * tb, c = Math.cos(rot), sn = Math.sin(rot);
          x = 960 + bx * c - by * sn; y = 540 + bx * sn + by * c; a *= flareI * (1 - 0.35 * ss(0, 1.6, tb));
          if (i < NTITLE) {
            const e2 = eio(prog(t, T.title, T.titleDone, d, 0.35)); x = mix(x, TT[i * 2] + Math.sin(t * 2 + PHS[i]) * 0.6, e2); y = mix(y, TT[i * 2 + 1] + Math.cos(t * 1.7 + PHS[i]) * 0.6, e2); a = mix(a, INT[i] * (0.85 + 0.15 * Math.sin(t * 3 + PHS[i])), e2);
            const u = clamp((t - T.out - (TT[i * 2] / W) * 0.7) / 1.1); if (u > 0) { x += u * u * (380 + AMP[i]); y -= u * u * (110 + NY[i] * 60); a *= 1 - u; }
          } else { const e2 = eio(prog(t, T.title, 12, d, 0.5)), dx0 = ((DX[i] + VX[i] * t) % (W + 100)) - 50; x = mix(x, dx0, e2); y = mix(y, DY[i], e2); a = mix(a, DI[i] * dustFade, e2); }
        }
      }
      if (a < 0.004) continue;
      let r = COL[i * 3], gg = COL[i * 3 + 1], b = COL[i * 3 + 2];
      if (GOLD[i] && gold > 0) { r = mix(r, 1, gold); gg = mix(gg, 0.76, gold); b = mix(b, 0.42, gold); }
      P.push((x - cam.cx) * cam.s + 960 + cam.ox, (y - cam.cy) * cam.s + 540 + cam.oy, r, gg, b, a);
    }
  }
  function bg(ctx) { const g = ctx.createRadialGradient(960, 560, 50, 960, 560, 1150); g.addColorStop(0, "#0a1020"); g.addColorStop(1, "#010205"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  function under(ctx, t, w) {
    const cam = camera(t);
    ctx.setTransform(cam.s / 2, 0, 0, cam.s / 2, 960 + cam.ox - cam.cx * cam.s, 540 + cam.oy - cam.cy * cam.s);
    const on = ss(T.ping, T.ping + 0.5, t) * (1 - ss(T.big, T.big + 0.6, t));
    const show = (img, al) => { if (al * w > 0.003) { ctx.globalAlpha = al * w; ctx.drawImage(img, 0, 0); } };
    show(L.screen, on * (0.7 + 0.3 * Math.exp(-(t - T.ping) * 3)));
    show(L.frame, ss(2.4, T.formed + 0.2, t) * (1 - ss(T.big, T.big + 0.5, t)) * 0.4);
    show(L.clock, ss(T.ping + 0.3, T.ping + 0.9, t) * (1 - ss(T.big, T.big + 0.5, t)) * 0.45);
    show(L.banner, ss(T.ping + 0.35, T.ping + 0.95, t) * (1 - ss(T.big, T.big + 0.5, t)) * 0.8);
    show(L.big, ss(T.bigDone - 0.5, T.bigDone + 0.2, t) * (1 - ss(T.burst - 0.02, T.burst + 0.06, t)) * 0.55);
    show(L.title, ss(T.titleDone - 0.3, T.titleDone + 0.3, t) * (1 - ss(T.out - 0.2, T.out + 0.8, t)) * 0.5);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    if (on > 0) { const gl = ctx.createRadialGradient(960, 520, 100, 960, 520, 700), al = on * w * (0.12 + 0.25 * Math.exp(-(t - T.ping) * 2.5)); gl.addColorStop(0, `rgba(90,140,255,${al})`); gl.addColorStop(1, "rgba(90,140,255,0)"); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = "source-over"; }
  }
  function over(ctx, t, w) {
    const tb = t - T.burst;
    if (tb > 0 && tb < 1.2) {
      const R = 200 + tb * 1300, gl = ctx.createRadialGradient(960, 540, R * 0.55, 960, 540, R); ctx.globalCompositeOperation = "lighter";
      gl.addColorStop(0, "rgba(150,190,255,0)"); gl.addColorStop(0.8, `rgba(150,190,255,${0.16 * w * Math.exp(-2.5 * tb)})`); gl.addColorStop(1, "rgba(150,190,255,0)"); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(190,215,255,${0.2 * w * Math.exp(-tb * 9)})`; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = "source-over";
    }
  }
  return { build, pts, bg, under, over };
})();
// 片名（开头和结尾共用）
function drawTitle(c) {
  c.textAlign = "center"; c.textBaseline = "middle";
  c.font = `400 156px ${SERIF}`; c.letterSpacing = "34px"; c.fillText("迟到的消息", 960 + 17, 505);
  c.font = `400 30px ${SERIF}`; c.letterSpacing = "16px"; c.fillText("THE LATE MESSAGE", 960 + 8, 640);
  c.letterSpacing = "0px";
}
