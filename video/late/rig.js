// 人物：由部件组成，每个部件有一团固定的粒子，跟着骨骼动作走
// 侧面骨架（角度从"竖直向下"量起，向前为正）和正/背面骨架两种。身高约 330（scale 1）
const BONE = { torso: 100, ua: 58, fa: 54, th: 84, sh: 82 };
const DENS = 0.95;

// 化成光点飘走：u 从 0 到 1；先散的是 v 小的粒子
function dissolver(u, t, dx = 0.25, dy = -1, dist = 300) {
  return (v, ph, o) => {
    const p = clamp((u - 0.7 * v) / 0.3); if (p <= 0) return;
    const k = p * p * dist; o.x += (dx + Math.sin(ph * 3 + t) * 0.35) * k; o.y += (dy + Math.cos(ph * 2) * 0.25) * k;
    o.a *= (1 - p) * (1 + 2.5 * p * (1 - p));
  };
}
// 从光尘中聚拢成形：u 从 0 到 1
function assembler(u, t, R = 220) {
  return (v, ph, o) => {
    const p = 1 - eio(clamp((u - 0.5 * v) / 0.5)); if (p <= 0) return;
    o.x += Math.cos(ph) * R * p * (0.5 + v); o.y += Math.sin(ph * 1.3) * R * p * (0.5 + v) - 40 * p; o.a *= (1 - p * 0.85);
  };
}

// ---------- 侧面部件 ----------
function capsule(c, r0, r1, len) { c.beginPath(); c.moveTo(-r0, 0); c.lineTo(-r1, len); c.arc(0, len, r1, Math.PI, 0, true); c.lineTo(r0, 0); c.arc(0, 0, r0, 0, Math.PI, true); c.fill(); }
function sideParts(kind) {
  const her = kind === "her", yuan = kind === "yuan", P = [];
  const add = (bone, drawFn, box, far = false, k = DENS) => P.push({ bone, far, cl: cloud(drawFn, box, k, P.length * 97 + kind.length * 13 + 5, 400000, 0.8) });
  // 头：侧脸（鼻、下巴）+ 头发；脸稍暗，头发更密，轮廓更好认
  add("head", c => {
    const rx = her ? 17 : 18.5, ry = her ? 20.5 : 22, cy = her ? -30 : -31;
    c.globalAlpha = 0.72; c.beginPath(); c.ellipse(2, cy, rx, ry, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(rx - 2, cy - 4); c.lineTo(rx + 4.5, cy + 4); c.lineTo(rx - 1, cy + 7); c.fill();          // 鼻
    c.beginPath(); c.moveTo(rx - 4, cy + 10); c.quadraticCurveTo(rx, cy + 17, rx - 9, cy + ry - 1); c.lineTo(0, cy + 10); c.fill(); // 下巴
    c.fillRect(-6, -14, 12, 18);                                                                                 // 脖子
    c.globalAlpha = 1; c.beginPath();
    if (her) {             // 齐肩短发
      c.moveTo(14, cy - 14); c.quadraticCurveTo(6, cy - ry - 9, -12, cy - ry + 1); c.quadraticCurveTo(-25, cy - 6, -21, cy + 18);
      c.quadraticCurveTo(-18, cy + 30, -8, cy + 31); c.lineTo(-4, cy + 6); c.quadraticCurveTo(4, cy - 9, 14, cy - 14); c.fill();
    } else if (yuan) {     // 毛线帽
      c.moveTo(18, cy - 10); c.quadraticCurveTo(14, cy - ry - 14, -4, cy - ry - 12); c.quadraticCurveTo(-24, cy - ry - 6, -21, cy - 4); c.lineTo(-19, cy + 2); c.quadraticCurveTo(0, cy - 8, 18, cy - 10); c.fill();
    } else {               // 短发
      c.moveTo(16, cy - 12); c.quadraticCurveTo(14, cy - ry - 9, -2, cy - ry - 4); c.quadraticCurveTo(-22, cy - ry + 2, -20, cy + 2); c.quadraticCurveTo(-19, cy + 12, -13, cy + 16); c.lineTo(-6, cy + 2); c.quadraticCurveTo(4, cy - 6, 16, cy - 12); c.fill();
    }
  }, [-34, -66, 66, 74]);
  // 躯干（原点在颈部，向下到骨盆 100）
  add("torso", c => {
    c.beginPath();
    if (her) { c.moveTo(6, 0); c.quadraticCurveTo(20, 12, 21, 30); c.quadraticCurveTo(21, 52, 15, 74); c.lineTo(17, 104); c.lineTo(-18, 104); c.lineTo(-17, 72); c.quadraticCurveTo(-22, 36, -14, 6); c.lineTo(-6, 0); }
    else { c.moveTo(8, 0); c.quadraticCurveTo(25, 10, 25, 34); c.lineTo(23, 74); c.lineTo(24, 110); c.lineTo(-22, 110); c.lineTo(-23, 64); c.quadraticCurveTo(-25, 24, -16, 4); c.lineTo(-8, 0); }
    c.closePath(); c.fill();
    if (kind === "him") { c.beginPath(); c.ellipse(1, 4, 17, 9, 0, 0, TAU); c.fill(); }                           // 围巾绕颈
  }, [-30, -12, 60, 128]);
  if (kind === "him") add("scarf", c => { c.beginPath(); c.moveTo(-4, 0); c.quadraticCurveTo(4, 24, 2, 52); c.lineTo(11, 54); c.quadraticCurveTo(13, 24, 6, 0); c.fill(); }, [-8, -2, 24, 60]);
  // 大衣下摆（她出门以后才有）
  if (her) add("coat", c => { c.beginPath(); c.moveTo(-19, -12); c.lineTo(18, -12); c.quadraticCurveTo(24, 40, 27, 92); c.lineTo(-27, 92); c.quadraticCurveTo(-24, 40, -19, -12); c.fill(); }, [-30, -14, 60, 110]);
  const arm = her ? [8, 6.5, 6, 4.6] : [9.5, 7.5, 7, 5.4], leg = her ? [12, 8, 8, 5.2] : [14, 10, 10, 6.6];
  for (const side of ["L", "R"]) {
    const far = side === "L";
    add("ua" + side, c => capsule(c, arm[0], arm[1], BONE.ua), [-12, -12, 24, BONE.ua + 24], far);
    add("fa" + side, c => { capsule(c, arm[2], arm[3], BONE.fa); c.beginPath(); c.ellipse(1.5, BONE.fa + 6, 5.5, 8, 0, 0, TAU); c.fill(); }, [-10, -10, 20, BONE.fa + 26], far);
    add("th" + side, c => capsule(c, leg[0], leg[1], BONE.th), [-16, -16, 32, BONE.th + 30], far);
    add("sh" + side, c => { capsule(c, leg[2], leg[3], BONE.sh); c.beginPath(); c.moveTo(-6, BONE.sh - 4); c.quadraticCurveTo(-7, BONE.sh + 9, 2, BONE.sh + 9); c.lineTo(her ? 20 : 23, BONE.sh + 9); c.quadraticCurveTo(her ? 21 : 24, BONE.sh + 2, 8, BONE.sh - 2); c.fill(); }, [-14, -12, 42, BONE.sh + 26], far);
  }
  return P;
}
const FIG = {};
function buildFigures() { for (const k of ["her", "him", "yuan"]) FIG[k] = { side: sideParts(k), front: frontParts(k, false), back: frontParts(k, true) }; }

// ---------- 侧面动作 ----------
const POSE0 = { lean: 0, head: 0, sL: 0.06, eL: 0.16, sR: 0.04, eR: 0.14, hL: 0.03, kL: 0.05, hR: -0.03, kR: 0.05, skirt: 0, scarf: 0, bob: 0 };
const pose = o => Object.assign({}, POSE0, o);
function lerpPose(p, q, e) { const r = {}; for (const k in POSE0) r[k] = mix(p[k] ?? POSE0[k], q[k] ?? POSE0[k], e); return r; }
// 走路：相位 ph 按走过的距离推进（一个周期 ≈ 271 像素 × scale），amp 越小越慢越沉
function walk(ph, amp = 1) {
  const th = TAU * ph, s = Math.sin(th), kn = x => 0.07 + amp * 0.5 * Math.pow(Math.max(0, Math.sin(x + 2.0)), 1.6);
  return pose({ lean: 0.05 * amp, hR: 0.36 * amp * s, hL: -0.36 * amp * s, kR: kn(th), kL: kn(th + Math.PI), sR: -0.3 * amp * s, sL: 0.3 * amp * s, eR: 0.22 + 0.18 * amp * Math.max(0, -s), eL: 0.22 + 0.18 * amp * Math.max(0, s), head: 0.06 });
}
// 跑：一个周期 ≈ 500 像素 × scale
function run(ph, amp = 1) {
  const th = TAU * ph, s = Math.sin(th), kn = x => 0.25 + amp * 1.55 * Math.pow(Math.max(0, Math.sin(x + 2.2)), 1.3);
  return pose({ lean: 0.24 * amp, hR: 0.72 * amp * s, hL: -0.72 * amp * s, kR: kn(th), kL: kn(th + Math.PI), sR: -0.62 * amp * s, sL: 0.62 * amp * s, eR: 1.35, eL: 1.35, head: -0.05, bob: -7 * amp * Math.pow(Math.cos(2 * th), 2) });
}
const SIT_KNEES = pose({ lean: 0.42, head: 0.45, hL: 2.3, kL: 2.5, hR: 2.22, kR: 2.42, sL: 1.02, eL: -1.5, sR: 0.94, eR: -1.42 });          // 抱膝坐
const SIT_PHONE = pose({ lean: 0.34, head: 0.55, hL: 2.3, kL: 2.5, hR: 2.22, kR: 2.42, sL: 0.3, eL: 2.55, sR: 0.22, eR: 2.65 });        // 抱膝看手机
const SIT_BENCH = pose({ lean: 0.08, head: 0.1, hL: 1.5, kL: 1.5, hR: 1.45, kR: 1.45, sL: 0.3, eL: 0.9, sR: 0.25, eR: 0.95 });         // 坐长椅

// 骨骼：给定动作，算每个部件的原点和角度（人物坐标：骨盆在原点，朝右，y 向下）
function bones(p) {
  const N = [Math.sin(p.lean) * BONE.torso, -Math.cos(p.lean) * BONE.torso];
  const S = [N[0] - Math.sin(p.lean) * 14, N[1] + Math.cos(p.lean) * 14];
  const b = { torso: [N[0], N[1], -p.lean], head: [N[0], N[1], -(p.lean + p.head)], scarf: [N[0] + 6, N[1] + 6, -p.lean * 0.4 + p.scarf], coat: [0, 0, (p.hL + p.hR) * 0.28 + p.skirt] };
  for (const sd of ["L", "R"]) {
    const s = p["s" + sd], e = p["e" + sd], h = p["h" + sd], k = p["k" + sd], sx = S[0] + (sd === "L" ? -3 : 3);
    b["ua" + sd] = [sx, S[1], s]; const E = [sx + Math.sin(s) * BONE.ua, S[1] + Math.cos(s) * BONE.ua]; b["fa" + sd] = [E[0], E[1], s + e];
    b["th" + sd] = [0, 0, h]; const K = [Math.sin(h) * BONE.th, Math.cos(h) * BONE.th]; b["sh" + sd] = [K[0], K[1], h - k];
    b["hand" + sd] = [E[0] + Math.sin(s + e) * (BONE.fa + 4), E[1] + Math.cos(s + e) * (BONE.fa + 4)];
    b["ankle" + sd] = [K[0] + Math.sin(h - k) * BONE.sh, K[1] + Math.cos(h - k) * BONE.sh];
  }
  return b;
}
// 部件局部坐标 → 屏幕的仿射变换
function partT(cam, X, Y, S, f, ox, oy, a, p = 1) {
  const cs = cam.s, ca = Math.cos(a), sa = Math.sin(a);
  return [cs * f * S * ca, -cs * S * sa, cs * f * S * sa, cs * S * ca, cs * (X + f * S * ox - cam.x * p) + 960, cs * (Y + S * oy - cam.y) + 540];
}
// 画一个侧面人物。ground=true 时自动让低的那只脚落地（Y 是地面）
// o.coat：大衣显示程度；o.dim：远侧肢体亮度；o.post：逐点特效（散开/聚拢）
function drawSide(P, kind, p, X, Y, S, f, cam, col, bright, t, o = {}) {
  const b = bones(p), parts = FIG[kind].side;
  let y = Y;
  if (o.ground !== false) y = Y - S * (Math.max(b.ankleL[1], b.ankleR[1]) + 8) + p.bob * S;
  else y = Y + p.bob * S;
  const coat = o.coat ?? 1, oo = { jit: o.jit ?? 0.5, tw: o.tw ?? 0.2, post: o.post };
  for (const pt of parts) {
    if (pt.bone === "coat" && coat <= 0) continue;
    const bb = b[pt.bone], T = partT(cam, X, y, S, f, bb[0], bb[1], bb[2], o.p ?? 1);
    draw(P, pt.cl, T, col, bright * (pt.far ? (o.dim ?? 0.6) : 1) * (pt.bone === "coat" ? coat : 1), t, oo);
  }
  return { b, X, Y: y, S, f, at: (q) => [X + f * S * q[0], y + S * q[1]] };       // 返回关节位置，方便挂道具
}

// ---------- 正面 / 背面 ----------
function frontParts(kind, back) {
  const her = kind === "her", P = [];
  const add = (bone, drawFn, box, k = DENS) => P.push({ bone, cl: cloud(drawFn, box, k, P.length * 131 + kind.length * 17 + (back ? 999 : 3), 400000, 0.8) });
  const sw = her ? 25 : 30;
  add("body", c => {
    // 头
    c.globalAlpha = back ? 1 : 0.62; c.beginPath(); c.ellipse(0, -126, her ? 16.5 : 18, her ? 20.5 : 22, 0, 0, TAU); c.fill(); c.fillRect(-6, -108, 12, 14);
    c.globalAlpha = 1; c.beginPath();
    if (her) {
      if (back) { c.moveTo(-19, -128); c.quadraticCurveTo(-20, -152, 0, -151); c.quadraticCurveTo(20, -152, 19, -128); c.quadraticCurveTo(22, -104, 16, -97); c.lineTo(-16, -97); c.quadraticCurveTo(-22, -104, -19, -128); }
      else { c.moveTo(-19, -126); c.quadraticCurveTo(-19, -152, 0, -150); c.quadraticCurveTo(19, -152, 19, -126); c.quadraticCurveTo(21, -104, 15, -99); c.lineTo(12, -118); c.quadraticCurveTo(4, -138, -12, -134); c.lineTo(-13, -100); c.quadraticCurveTo(-21, -106, -19, -126); }
    } else if (kind === "yuan") { c.moveTo(-20, -128); c.quadraticCurveTo(-20, -160, 0, -158); c.quadraticCurveTo(20, -160, 20, -128); c.lineTo(-20, -128); }
    else { c.moveTo(-19, -128); c.quadraticCurveTo(-20, -152, 0, -151); c.quadraticCurveTo(20, -152, 19, -128); if (back) { c.quadraticCurveTo(19, -110, 14, -106); c.lineTo(-14, -106); c.quadraticCurveTo(-19, -110, -19, -128); } else { c.quadraticCurveTo(10, -142, -19, -128); } }
    c.fill();
    // 躯干：她是长大衣（到膝），他是夹克
    c.beginPath(); c.moveTo(-8, -98); c.quadraticCurveTo(-sw, -98, -sw, -84); c.lineTo(-sw + 5, -40); c.lineTo(-sw + 4, 0);
    if (her) { c.lineTo(-29, 88); c.lineTo(29, 88); } else { c.lineTo(-sw + 4, 14); c.lineTo(sw - 4, 14); }
    c.lineTo(sw - 4, 0); c.lineTo(sw - 5, -40); c.lineTo(sw, -84); c.quadraticCurveTo(sw, -98, 8, -98); c.closePath(); c.fill();
    if (kind === "him") { c.beginPath(); c.ellipse(0, -96, 17, 8, 0, 0, TAU); c.fill(); if (!back) { c.fillRect(4, -92, 9, 48); } }
  }, [-40, -165, 80, 260]);
  const arm = her ? [7.5, 6] : [9, 7], leg = her ? [10, 6] : [12.5, 7.5];
  add("uaL", c => capsule(c, arm[0], arm[1], BONE.ua), [-12, -12, 24, BONE.ua + 24]);
  add("faL", c => { capsule(c, arm[1], arm[1] - 1.2, BONE.fa); c.beginPath(); c.ellipse(0, BONE.fa + 6, 5.5, 7.5, 0, 0, TAU); c.fill(); }, [-10, -10, 20, BONE.fa + 26]);
  add("legL", c => { capsule(c, leg[0], leg[1], 158); c.beginPath(); c.ellipse(0, 162, leg[1] + 3, 6, 0, 0, TAU); c.fill(); }, [-18, -16, 36, 192]);
  add("thighS", c => { c.beginPath(); c.ellipse(0, 6, leg[0] + 2, 13, 0, 0, TAU); c.fill(); }, [-20, -12, 40, 36]);
  add("shinS", c => { capsule(c, leg[1] + 2, leg[1], 76); c.beginPath(); c.ellipse(0, 80, leg[1] + 3, 6, 0, 0, TAU); c.fill(); }, [-14, -12, 28, 102]);
  return P;
}
// 正面动作：aL/aR = [上臂外张角, 肘部内弯角]；lift = 抬腿；sit = 坐着；sway = 身体左右摆
const FP0 = { aL: [0.1, 0.1], aR: [0.1, 0.1], liftL: 0, liftR: 0, sit: 0, sway: 0, bend: 0 };
const fpose = o => Object.assign({}, FP0, o);
function drawFront(P, kind, fp, X, Y, S, cam, col, bright, t, o = {}) {
  const parts = FIG[kind][o.back ? "back" : "front"], sw = kind === "her" ? 22 : 26, cs = cam.s, pp = o.p ?? 1;
  const oo = { jit: o.jit ?? 0.5, tw: o.tw ?? 0.2, post: o.post };
  // 骨盆高度：站着 166，坐着 ~92
  const hip = mix(166, 92, fp.sit), y0 = Y - hip * S;
  const T0 = (ox, oy, a, m = 1, sy = 1) => { const ca = Math.cos(a), sa = Math.sin(a); return [cs * S * m * ca, -cs * S * sa * sy, cs * S * m * sa, cs * S * ca * sy, cs * (X + S * ox - cam.x * pp) + 960, cs * (y0 + S * oy - cam.y) + 540]; };
  const lean = fp.sway, bend = fp.bend;
  for (const pt of parts) {
    if (pt.bone === "body") draw(P, pt.cl, T0(0, 0, lean * 0.6 - 0, 1, 1 - bend * 0.12), col, bright, t, oo);
    else if (pt.bone === "uaL" || pt.bone === "faL") {
      for (const m of [-1, 1]) {
        const a = fp[m < 0 ? "aL" : "aR"], sx = m * sw, sy = -86 * (1 - bend * 0.12);
        if (pt.bone === "uaL") draw(P, pt.cl, T0(sx, sy, a[0], m), col, bright, t, oo);
        else { const ex = sx + m * Math.sin(a[0]) * BONE.ua, ey = sy + Math.cos(a[0]) * BONE.ua; draw(P, pt.cl, T0(ex, ey, a[0] - a[1], m), col, bright, t, oo); }
      }
    } else if (pt.bone === "legL" && fp.sit < 0.5) {
      for (const m of [-1, 1]) { const lift = fp[m < 0 ? "liftL" : "liftR"]; draw(P, pt.cl, T0(m * 10, 0, m * 0.02, m, 1 - lift * 0.16), col, bright * (1 - fp.sit * 2), t, oo); }
    } else if (fp.sit >= 0.5 && (pt.bone === "thighS" || pt.bone === "shinS")) {
      for (const m of [-1, 1]) draw(P, pt.cl, pt.bone === "thighS" ? T0(m * 12, 0, 0, m) : T0(m * 13, 18, 0, m), col, bright, t, oo);
    }
  }
  // 手的位置（给道具用）
  const hand = m => { const a = fp[m < 0 ? "aL" : "aR"], sx = m * sw, sy = -86, ex = sx + m * Math.sin(a[0]) * BONE.ua, ey = sy + Math.cos(a[0]) * BONE.ua, aa = a[0] - a[1]; return [X + S * (ex + m * Math.sin(aa) * (BONE.fa + 5)), y0 + S * (ey + Math.cos(aa) * (BONE.fa + 5))]; };
  return { handL: hand(-1), handR: hand(1), head: [X, y0 - 126 * S], y0 };
}
