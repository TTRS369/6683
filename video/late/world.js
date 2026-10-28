// 场景：房间、街道（无限延伸）、便利店、公交站、路口（透视 / 侧面）、道具和手机界面
// 所有场景都先画成白色蒙版再取点，取样一次固定下来
const PAL = {
  now: { env: [0.42, 0.55, 0.92], hi: [0.82, 0.9, 1], her: [0.8, 0.9, 1] },
  past: { env: [0.9, 0.64, 0.36], hi: [1, 0.86, 0.62], him: [1, 0.78, 0.45], her: [1, 0.7, 0.62] },
  fight: { env: [0.95, 0.44, 0.26], hi: [1, 0.72, 0.5], him: [1, 0.64, 0.36], her: [1, 0.54, 0.46] },
  dream: { env: [0.92, 0.8, 0.64], hi: [1, 0.95, 0.86], him: [1, 0.86, 0.62], her: [1, 0.85, 0.8] },
  yuan: [0.62, 0.7, 0.84],
};
const GROUND = 880, STREET_Y = 860;
const SET = {};

// ---------- 房间 ----------
const WIN = { x: 980, y: 170, w: 660, h: 550 }, DOOR = { x: 230, y: 330, w: 220, h: 550 };
function buildRoom() {
  const R = {};
  R.frame = cloud(c => {
    c.lineWidth = 7; c.strokeRect(WIN.x, WIN.y, WIN.w, WIN.h); c.lineWidth = 5;
    c.beginPath(); c.moveTo(WIN.x + WIN.w / 2, WIN.y); c.lineTo(WIN.x + WIN.w / 2, WIN.y + WIN.h); c.moveTo(WIN.x, WIN.y + 275); c.lineTo(WIN.x + WIN.w, WIN.y + 275); c.stroke();
    c.fillRect(WIN.x - 30, WIN.y + WIN.h, WIN.w + 60, 16);                                                  // 窗台
    c.lineWidth = 6; c.strokeRect(DOOR.x, DOOR.y, DOOR.w, DOOR.h); c.lineWidth = 2.5; c.strokeRect(DOOR.x + 28, DOOR.y + 34, DOOR.w - 56, 210); c.strokeRect(DOOR.x + 28, DOOR.y + 290, DOOR.w - 56, 220);
    c.beginPath(); c.arc(DOOR.x + DOOR.w - 26, 620, 7, 0, TAU); c.fill();
    c.fillRect(0, GROUND, W, 5); c.globalAlpha = 0.35; c.fillRect(0, GROUND + 5, W, 3);                     // 踢脚线
    c.globalAlpha = 1; c.fillRect(560, 330, 270, 6);                                                         // 书架
    const r = rng(41); let x = 572; while (x < 815) { const w = 10 + r() * 14, h = 38 + r() * 34; c.globalAlpha = 0.55 + r() * 0.45; c.fillRect(x, 330 - h, w, h); x += w + 2 + r() * 4; }
    c.globalAlpha = 1; c.fillRect(690, 745, 180, 8); c.fillRect(705, 753, 6, 127); c.fillRect(850, 753, 6, 127); // 小桌
    c.beginPath(); c.arc(531, 420, 5, 0, TAU); c.fill();                                                    // 衣钩
    c.beginPath(); c.moveTo(1585, 718); c.lineTo(1625, 718); c.lineTo(1619, 690); c.lineTo(1591, 690); c.fill(); // 窗台上的小盆栽
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.32; c.beginPath(); c.ellipse(1605 + Math.cos(a) * 22, 676 + Math.sin(a) * 20, 11, 4.5, a, 0, TAU); c.fill(); }
  }, [0, 0, W, H], 0.7, 11, 400000, 0.5);
  R.cup = cloud(c => { c.beginPath(); c.moveTo(748, 712); c.lineTo(778, 712); c.lineTo(775, 745); c.lineTo(751, 745); c.fill(); c.lineWidth = 3.5; c.beginPath(); c.arc(781, 727, 8, -1.3, 1.3); c.stroke(); }, [730, 700, 70, 50], 1.1, 12);
  R.cup2 = cloud(c => { c.beginPath(); c.moveTo(808, 716); c.lineTo(834, 716); c.lineTo(831, 745); c.lineTo(811, 745); c.fill(); }, [800, 705, 50, 45], 1.1, 13);
  R.coat = cloud(c => { c.beginPath(); c.moveTo(531, 424); c.quadraticCurveTo(500, 436, 496, 470); c.lineTo(488, 650); c.lineTo(574, 650); c.lineTo(566, 470); c.quadraticCurveTo(562, 436, 531, 424); c.fill(); }, [480, 415, 100, 240], 0.9, 14, 400000, 0.7);
  // 窗外：远处楼群剪影 + 亮着的窗
  const sky = rng(77), blds = []; for (let x = WIN.x; x < WIN.x + WIN.w;) { const w = 40 + sky() * 90; blds.push([x, 720 - (90 + sky() * 200), w]); x += w + 4; }
  R.city = cloud(c => { c.beginPath(); c.rect(WIN.x + 4, WIN.y + 4, WIN.w - 8, WIN.h - 8); c.clip(); c.globalAlpha = 0.5; for (const [x, y, w] of blds) c.fillRect(x, y, w, 720 - y); }, [WIN.x, WIN.y, WIN.w, WIN.h], 0.45, 15);
  R.lit = cloud(c => { c.beginPath(); c.rect(WIN.x + 4, WIN.y + 4, WIN.w - 8, WIN.h - 8); c.clip(); const r = rng(78); for (const [x, y, w] of blds) for (let yy = y + 10; yy < 712; yy += 16) for (let xx = x + 6; xx < x + w - 8; xx += 13) if (r() < 0.16) c.fillRect(xx, yy, 6, 8); }, [WIN.x, WIN.y, WIN.w, WIN.h], 1.0, 16);
  R.moon = cloud(c => { c.beginPath(); c.arc(1500, 262, 26, 0, TAU); c.fill(); c.globalCompositeOperation = "destination-out"; c.beginPath(); c.arc(1512, 254, 24, 0, TAU); c.fill(); }, [1460, 220, 80, 80], 1.2, 17);
  SET.room = R;
}
function roomSky(ctx, cam, a = 1, warm = 0) {
  const [x0, y0] = ap(camT(cam), WIN.x, WIN.y), [x1, y1] = ap(camT(cam), WIN.x + WIN.w, WIN.y + WIN.h);
  const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, warm ? "rgba(40,30,60,1)" : "rgba(14,24,58,1)"); g.addColorStop(1, warm ? "rgba(120,70,60,1)" : "rgba(46,64,118,1)");
  ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.globalAlpha = 1;
}
function drawRoom(P, cam, t, pal, b = 1, o = {}) {
  const R = SET.room, T = camT(cam), post = o.post;
  draw(P, R.city, T, pal.env, 0.2 * b, t, { jit: 0.3, post });
  draw(P, R.lit, T, pal.hi, 0.75 * b, t, { jit: 0.2, tw: 0.4, post });
  draw(P, R.moon, T, pal.hi, 0.9 * b, t, { jit: 0.2, post });
  draw(P, R.frame, T, pal.env, 0.42 * b, t, { jit: 0.4, post });
  draw(P, R.cup, T, pal.env, 0.55 * b, t, { jit: 0.3, post });
  if (o.cup2) draw(P, R.cup2, T, pal.env, 0.55 * b * o.cup2, t, { jit: 0.3, post });
  if ((o.coat ?? 1) > 0) draw(P, R.coat, T, pal.env, 0.55 * b * (o.coat ?? 1), t, { jit: 0.4, post: o.coatPost || post });
}

// ---------- 街道：远景楼（视差 0.25）、中景楼（0.6）、路灯和人行道（1），按块重复，无限延伸 ----------
const TILE_FAR = 2600, TILE_MID = 2400, LAMP_GAP = 560;
function buildStreet() {
  const S = {}, r = rng(301);
  const far = [], mid = []; for (let x = 0; x < TILE_FAR;) { const w = 90 + r() * 170; far.push([x, 300 + r() * 320, w]); x += w + 6; }
  for (let x = 0; x < TILE_MID;) { const w = 150 + r() * 240; mid.push([x, 260 + r() * 300, w]); x += w + 18 + r() * 40; }
  S.far = cloud(c => { c.globalAlpha = 0.45; for (const [x, h, w] of far) c.fillRect(x, 700 - h, w, h); }, [0, 0, TILE_FAR, 720], 0.25, 302);
  S.mid = cloud(c => { c.lineWidth = 3; for (const [x, h, w] of mid) { c.globalAlpha = 0.28; c.fillRect(x, STREET_Y - h, w, h); c.globalAlpha = 1; c.strokeRect(x, STREET_Y - h, w, h); } }, [0, 0, TILE_MID, STREET_Y + 4], 0.35, 303);
  S.midLit = cloud(c => { const q = rng(304); for (const [x, h, w] of mid) for (let y = STREET_Y - h + 22; y < STREET_Y - 40; y += 34) for (let xx = x + 14; xx < x + w - 18; xx += 26) if (q() < 0.22) c.fillRect(xx, y, 11, 15); }, [0, 0, TILE_MID, STREET_Y], 0.9, 305);
  S.lamp = cloud(c => { c.fillRect(-3, 400, 6, STREET_Y - 400); c.lineWidth = 5; c.beginPath(); c.moveTo(0, 404); c.quadraticCurveTo(4, 372, 46, 372); c.stroke(); c.beginPath(); c.ellipse(52, 378, 22, 7, 0, 0, TAU); c.fill(); }, [-10, 360, 90, STREET_Y - 356], 0.9, 306);
  S.walk = cloud(c => { c.fillRect(0, STREET_Y, TILE_MID, 4); c.globalAlpha = 0.45; c.fillRect(0, STREET_Y + 20, TILE_MID, 3); c.globalAlpha = 0.25; for (let x = 0; x < TILE_MID; x += 120) c.fillRect(x, STREET_Y + 4, 2, 16); }, [0, STREET_Y - 2, TILE_MID, 30], 0.8, 307);
  // 便利店（世界 x 1480–2000）
  S.store = cloud(c => {
    c.lineWidth = 5; c.strokeRect(1480, 470, 520, 390); c.fillRect(1460, 452, 560, 22);
    c.lineWidth = 3; c.strokeRect(1500, 520, 330, 330); c.strokeRect(1850, 520, 130, 340);
    c.globalAlpha = 0.55; c.fillRect(1530, 700, 270, 6); c.fillRect(1530, 610, 270, 4); c.fillRect(1530, 790, 120, 60);  // 货架和冰柜
    c.globalAlpha = 1; c.font = `500 26px ${UI}`; c.textAlign = "center"; c.fillText("24 小时", 1740, 471);
  }, [1450, 440, 580, 425], 0.8, 308, 400000, 0.4);
  // 公交站（世界 x 2700–3080）
  S.stop = cloud(c => {
    c.fillRect(2700, 520, 360, 10); c.fillRect(2712, 530, 6, 330); c.fillRect(3042, 530, 6, 330);
    c.globalAlpha = 0.2; c.fillRect(2720, 546, 320, 296); c.globalAlpha = 1; c.lineWidth = 2; c.strokeRect(2720, 546, 320, 296);
    c.fillRect(2780, 760, 200, 8); c.fillRect(2790, 768, 5, 92); c.fillRect(2965, 768, 5, 92);
    c.fillRect(3098, 450, 5, 410); c.beginPath(); c.arc(3100, 440, 26, 0, TAU); c.lineWidth = 4; c.stroke();
  }, [2690, 405, 440, 460], 0.8, 309, 400000, 0.4);
  SET.street = S;
}
// 按视差把重复的块画出来
function tiles(P, cl, tile, cam, p, col, b, t, o) { const vx = cam.x * p, x0 = Math.floor((vx - 960 / cam.s - tile) / tile), x1 = Math.ceil((vx + 960 / cam.s) / tile); for (let k = x0; k <= x1; k++) draw(P, cl, amul(camT(cam, p), atr(k * tile, 0)), col, b, t, o); }
function drawStreet(P, cam, t, pal, b = 1, o = {}) {
  const S = SET.street, post = o.post;
  tiles(P, S.far, TILE_FAR, cam, 0.25, pal.env, 0.16 * b, t, { jit: 0.3, post });
  tiles(P, S.mid, TILE_MID, cam, 0.6, pal.env, 0.3 * b, t, { jit: 0.4, post });
  tiles(P, S.midLit, TILE_MID, cam, 0.6, pal.hi, 0.42 * b, t, { jit: 0.2, tw: 0.35, post });
  tiles(P, S.walk, TILE_MID, cam, 1, pal.env, 0.4 * b, t, { jit: 0.3, post });
  const lx0 = Math.floor((cam.x - 960 / cam.s - 100) / LAMP_GAP), lx1 = Math.ceil((cam.x + 960 / cam.s + 100) / LAMP_GAP);
  for (let k = lx0; k <= lx1; k++) draw(P, S.lamp, amul(camT(cam), atr(k * LAMP_GAP + 180, 0)), pal.env, 0.5 * b, t, { jit: 0.3, post });
  if (o.store !== false) draw(P, S.store, camT(cam), pal.env, 0.5 * b, t, { jit: 0.3, post });
  if (o.stop !== false) draw(P, S.stop, camT(cam), pal.env, 0.5 * b, t, { jit: 0.3, post });
}
// 路灯的光（画在粒子下面）
function streetLights(ctx, cam, col, a = 1, wet = 0) {
  const lx0 = Math.floor((cam.x - 960 / cam.s - 100) / LAMP_GAP), lx1 = Math.ceil((cam.x + 960 / cam.s + 100) / LAMP_GAP);
  for (let k = lx0; k <= lx1; k++) {
    const [x, y] = ap(camT(cam), k * LAMP_GAP + 232, 382), [gx, gy] = ap(camT(cam), k * LAMP_GAP + 232, STREET_Y);
    glow(ctx, x, y, 90 * cam.s, col, 0.5 * a); glow(ctx, gx, gy, 210 * cam.s, col, 0.12 * a);
    if (wet > 0) { const g = ctx.createLinearGradient(gx, gy, gx, gy + 220 * cam.s); g.addColorStop(0, `rgba(${col},${0.18 * a * wet})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.fillRect(gx - 14 * cam.s, gy, 28 * cam.s, 220 * cam.s); }
  }
}
function nightSky(ctx, top = "#04070f", bot = "#0b1530", y = 860, cam) {
  const g = ctx.createLinearGradient(0, 0, 0, cam ? ap(camT(cam), 0, y)[1] : y); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// ---------- 路口（透视：从这一侧人行道看过去） ----------
const CROSS = { far: 598, near: 880, spot: [1010, 598], bench: [1490, 586], signal: [1290, 380] };
function buildCross() {
  const C = {}, r = rng(501), bl = []; for (let x = -420; x < W + 420;) { const w = 70 + r() * 150; bl.push([x, 120 + r() * 300, w]); x += w + 6 + r() * 14; }
  C.city = cloud(c => { c.lineWidth = 2; for (const [x, h, w] of bl) { c.globalAlpha = 0.25; c.fillRect(x, 575 - h, w, h); c.globalAlpha = 0.8; c.strokeRect(x, 575 - h, w, h); } }, [-420, 0, W + 840, 580], 0.3, 502);
  C.cityLit = cloud(c => { const q = rng(503); for (const [x, h, w] of bl) for (let y = 575 - h + 14; y < 560; y += 22) for (let xx = x + 8; xx < x + w - 10; xx += 17) if (q() < 0.2) c.fillRect(xx, y, 7, 9); }, [-420, 0, W + 840, 580], 0.9, 504);
  C.ground = cloud(c => {
    c.fillRect(-400, 575, W + 800, 3); c.fillRect(-400, CROSS.far, W + 800, 3); c.globalAlpha = 0.5; c.fillRect(-400, CROSS.far + 3, W + 800, 2);
    c.globalAlpha = 0.6; for (let x = -400; x < W + 400; x += 150) { c.fillRect(x, 728, 70, 3); } c.globalAlpha = 1;      // 中线
    // 斑马线：近宽远窄、近厚远薄
    for (let i = 0; i < 10; i++) {
      const u0 = i / 10, u1 = u0 + 0.055, y0 = mix(CROSS.far + 8, CROSS.near - 6, u0 * u0 * 0.35 + u0 * 0.65), y1 = mix(CROSS.far + 8, CROSS.near - 6, u1 * u1 * 0.35 + u1 * 0.65);
      const hw0 = mix(240, 470, (y0 - CROSS.far) / (CROSS.near - CROSS.far)), hw1 = mix(240, 470, (y1 - CROSS.far) / (CROSS.near - CROSS.far));
      c.beginPath(); c.moveTo(960 - hw0, y0); c.lineTo(960 + hw0, y0); c.lineTo(960 + hw1, y1 + (y1 - y0) * 0.9); c.lineTo(960 - hw1, y1 + (y1 - y0) * 0.9); c.fill();
    }
    c.fillRect(-400, CROSS.near, W + 800, 4); c.globalAlpha = 0.3; for (let y = 930; y < 1100; y += 60) c.fillRect(-400, y, W + 800, 2);
  }, [-400, 570, W + 800, 520], 0.55, 505, 400000, 0.3);
  C.poles = cloud(c => {
    c.fillRect(1287, 380, 6, 218); c.fillRect(1272, 380, 36, 72); c.globalAlpha = 0.5; c.strokeRect(1272, 380, 36, 72);   // 对面的行人灯
    c.globalAlpha = 1; c.fillRect(597, 300, 6, 298); c.lineWidth = 4; c.beginPath(); c.moveTo(600, 304); c.quadraticCurveTo(604, 282, 640, 282); c.stroke(); c.beginPath(); c.ellipse(646, 287, 16, 5, 0, 0, TAU); c.fill();
    c.fillRect(1420, 566, 150, 6); c.fillRect(1428, 572, 4, 22); c.fillRect(1558, 572, 4, 22); c.globalAlpha = 0.7; c.fillRect(1420, 548, 150, 4);  // 长椅
    c.globalAlpha = 1; c.fillRect(1700, 0, 10, 885); c.lineWidth = 8; c.beginPath(); c.moveTo(1705, 40); c.quadraticCurveTo(1712, 0, 1640, -6); c.stroke();  // 近处路灯杆
  }, [560, -20, 1200, 910], 0.75, 506, 400000, 0.5);
  SET.cross = C;
}
// 行人灯：red / green（0..1 的绿灯程度）
function crossSignal(ctx, cam, green, a = 1) {
  const T = camT(cam), [rx, ry] = ap(T, 1290, 398), [gx, gy] = ap(T, 1290, 434), s = cam.s;
  glow(ctx, rx, ry, 70 * s, "255,70,60", 0.75 * (1 - green) * a); glow(ctx, gx, gy, 70 * s, "80,255,170", 0.75 * green * a);
  ctx.globalAlpha = a; ctx.fillStyle = `rgba(255,110,100,${0.9 * (1 - green)})`; ctx.beginPath(); ctx.arc(rx, ry - 6 * s, 3.4 * s, 0, TAU); ctx.fill(); ctx.fillRect(rx - 3.5 * s, ry - 2 * s, 7 * s, 12 * s);
  ctx.fillStyle = `rgba(120,255,190,${0.9 * green})`; ctx.beginPath(); ctx.arc(gx + 1 * s, gy - 7 * s, 3.4 * s, 0, TAU); ctx.fill(); ctx.save(); ctx.translate(gx, gy); ctx.rotate(0.25); ctx.fillRect(-3 * s, -3 * s, 6 * s, 11 * s); ctx.restore();
  ctx.globalAlpha = 1;
}
function drawCross(P, cam, t, pal, b = 1, o = {}) {
  const C = SET.cross, T = camT(cam), post = o.post;
  draw(P, C.city, T, pal.env, 0.24 * b, t, { jit: 0.3, post });
  draw(P, C.cityLit, T, pal.hi, 0.42 * b, t, { jit: 0.2, tw: 0.35, post });
  draw(P, C.ground, T, pal.env, 0.36 * b, t, { jit: 0.3, post });
  draw(P, C.poles, T, pal.env, 0.5 * b, t, { jit: 0.3, post });
}
function crossLights(ctx, cam, col, a = 1) { const T = camT(cam), [x, y] = ap(T, 646, 290), [gx, gy] = ap(T, 646, 590); glow(ctx, x, y, 70 * cam.s, col, 0.55 * a); glow(ctx, gx, gy, 240 * cam.s, col, 0.1 * a); const [nx, ny] = ap(T, 1640, -2); glow(ctx, nx, ny, 260 * cam.s, col, 0.25 * a); }

// ---------- 路口（侧面：人行道上，背后是马路和对面的楼） ----------
function buildSide() {
  const D = {}, r = rng(601), bl = []; for (let x = -200; x < 2600;) { const w = 90 + r() * 180; bl.push([x, 160 + r() * 280, w]); x += w + 10 + r() * 20; }
  D.city = cloud(c => { c.lineWidth = 2; for (const [x, h, w] of bl) { c.globalAlpha = 0.22; c.fillRect(x, 640 - h, w, h); c.globalAlpha = 0.8; c.strokeRect(x, 640 - h, w, h); } }, [-200, 100, 2800, 545], 0.28, 602);
  D.lit = cloud(c => { const q = rng(603); for (const [x, h, w] of bl) for (let y = 640 - h + 16; y < 625; y += 26) for (let xx = x + 10; xx < x + w - 12; xx += 20) if (q() < 0.2) c.fillRect(xx, y, 8, 11); }, [-200, 100, 2800, 545], 0.9, 604);
  D.road = cloud(c => { c.fillRect(-200, 640, 2800, 3); c.globalAlpha = 0.55; for (let x = -200; x < 2600; x += 170) c.fillRect(x, 752, 90, 3); c.globalAlpha = 1; c.fillRect(-200, STREET_Y, 2800, 4); c.globalAlpha = 0.4; c.fillRect(-200, STREET_Y + 22, 2800, 3);
    c.globalAlpha = 0.8; for (let i = 0; i < 6; i++) c.fillRect(1180 + i * 46, 646, 26, 210); }, [-200, 630, 2800, 260], 0.5, 605, 400000, 0.3);
  D.poles = cloud(c => { c.fillRect(1497, 330, 6, 530); c.fillRect(1482, 330, 36, 74); c.globalAlpha = 0.5; c.strokeRect(1482, 330, 36, 74); c.globalAlpha = 1;
    c.fillRect(497, 340, 6, 520); c.lineWidth = 5; c.beginPath(); c.moveTo(500, 344); c.quadraticCurveTo(504, 312, 548, 312); c.stroke(); c.beginPath(); c.ellipse(554, 318, 22, 7, 0, 0, TAU); c.fill(); }, [470, 300, 1060, 562], 0.8, 606, 400000, 0.5);
  SET.side = D;
}
function drawSideSet(P, cam, t, pal, b = 1, o = {}) {
  const D = SET.side, post = o.post;
  draw(P, D.city, camT(cam, 0.7), pal.env, 0.24 * b, t, { jit: 0.3, post });
  draw(P, D.lit, camT(cam, 0.7), pal.hi, 0.4 * b, t, { jit: 0.2, tw: 0.35, post });
  draw(P, D.road, camT(cam), pal.env, 0.36 * b, t, { jit: 0.3, post });
  draw(P, D.poles, camT(cam), pal.env, 0.5 * b, t, { jit: 0.3, post });
}
function sideLights(ctx, cam, col, a = 1, green = -1) {
  const T = camT(cam), [x, y] = ap(T, 554, 318), [gx, gy] = ap(T, 554, STREET_Y);
  glow(ctx, x, y, 90 * cam.s, col, 0.5 * a); glow(ctx, gx, gy, 260 * cam.s, col, 0.13 * a);
  if (green >= 0) { const [sx, sy] = ap(T, 1500, 350), [qx, qy] = ap(T, 1500, 386); glow(ctx, sx, sy, 60 * cam.s, "255,70,60", 0.65 * (1 - green) * a); glow(ctx, qx, qy, 60 * cam.s, "80,255,170", 0.65 * green * a); }
}

// ---------- 道具 ----------
const PROP = {};
function buildProps() {
  const k = 1.2;
  PROP.phone = cloud(c => { rrect(c, -7, -12, 14, 24, 3); c.fill(); }, [-9, -14, 18, 28], 1.6, 701);
  PROP.umbS = cloud(c => { c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -150); c.stroke(); c.beginPath(); c.moveTo(-95, -128); c.quadraticCurveTo(0, -205, 95, -128); for (let i = 4; i >= -4; i--) c.quadraticCurveTo(i * 23.75 + 12, -122, i * 23.75 - 11.875 + 0.01, -128); c.closePath(); c.fill(); c.beginPath(); c.arc(-4, 2, 5, 0, Math.PI); c.stroke(); }, [-100, -200, 200, 210], k, 702, 400000, 0.6);
  PROP.keys = cloud(c => { c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.stroke(); for (const a of [0.4, -0.5]) { c.save(); c.rotate(a); c.beginPath(); c.arc(0, 22, 6, 0, TAU); c.fill(); c.fillRect(-2, 26, 4, 26); c.fillRect(2, 40, 5, 3); c.fillRect(2, 46, 4, 3); c.restore(); } }, [-40, -12, 80, 70], 2.2, 703);
  PROP.box = cloud(c => { c.lineWidth = 4; c.strokeRect(-120, -70, 240, 140); c.globalAlpha = 0.2; c.fillRect(-120, -70, 240, 140); }, [-125, -75, 250, 150], 1.0, 704, 400000, 0.6);
  PROP.lid = cloud(c => { c.lineWidth = 4; c.strokeRect(-126, -22, 252, 22); c.globalAlpha = 0.3; c.fillRect(-126, -22, 252, 22); }, [-130, -26, 260, 30], 1.0, 705);
  PROP.oldPhone = cloud(c => { c.lineWidth = 3; rrect(c, -40, -78, 80, 156, 12); c.stroke(); c.beginPath(); c.arc(0, 66, 6, 0, TAU); c.stroke(); c.globalAlpha = 0.5; c.fillRect(-32, -62, 64, 118); }, [-44, -82, 88, 164], 1.4, 706);
  PROP.cone = cloud(c => { c.beginPath(); c.moveTo(-7, -6); c.lineTo(7, -6); c.lineTo(0, 16); c.fill(); c.beginPath(); c.arc(0, -10, 8, 0, TAU); c.fill(); }, [-10, -20, 20, 38], 1.6, 707);
  PROP.bouquet = cloud(c => { c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.lineTo(2, 30); c.lineTo(-2, 30); c.fill(); for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(Math.cos(i * 0.9) * 11, -6 - Math.sin(i * 1.7) * 7, 6, 0, TAU); c.fill(); } }, [-20, -22, 40, 54], 1.6, 708);
  PROP.cane = cloud(c => { c.fillRect(-2, 0, 4, 120); c.lineWidth = 4; c.beginPath(); c.arc(8, 0, 8, Math.PI, 0); c.stroke(); }, [-4, -10, 22, 132], 1.4, 709);
  PROP.umbF = cloud(c => { c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -95); c.stroke(); c.beginPath(); c.moveTo(-80, -70); c.quadraticCurveTo(0, -140, 80, -70); c.quadraticCurveTo(0, -84, -80, -70); c.fill(); }, [-85, -125, 170, 130], k, 710, 400000, 0.6);
  PROP.scarfTail = cloud(c => { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(30, 6, 62, -2); c.lineTo(60, 9); c.quadraticCurveTo(30, 16, 0, 10); c.fill(); }, [-2, -6, 66, 24], 1.4, 711);
}
// 把道具挂在点上（世界坐标 x, y，角度 a，缩放 s）
function drawProp(P, cl, cam, x, y, a, s, col, b, t, o = {}) { draw(P, cl, amul(camT(cam), amul(atr(x, y), amul(arot(a), asc(s * (o.flip || 1), s)))), col, b, t, { jit: o.jit ?? 0.3, tw: o.tw ?? 0.2, post: o.post }); }

// ---------- 雨（画在最上层，线条清晰，不加噪点） ----------
function rain(ctx, t, n, col, a, o = {}) {
  if (a <= 0.003) return;
  const wind = o.wind ?? 0.18, spd = o.speed ?? 1400, freeze = o.freeze, len = o.len ?? 34;
  ctx.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const h1 = hash(i * 3.1), h2 = hash(i * 7.7 + 1), h3 = hash(i * 1.3 + 9), z = 0.4 + h3 * 0.9;
    const tt = freeze != null ? freeze : t, v = spd * z;
    const y = ((h2 * (H + 200) + tt * v) % (H + 200)) - 100, x = ((h1 * (W + 300) + tt * v * wind) % (W + 300)) - 150;
    ctx.strokeStyle = `rgba(${col},${a * (0.25 + 0.45 * h3)})`; ctx.lineWidth = 0.8 + z * 0.9;
    ctx.beginPath();
    if (freeze != null && o.still) { ctx.arc(x, y, 0.9 + z * 1.3, 0, TAU); ctx.fillStyle = ctx.strokeStyle; ctx.fill(); }
    else { const l = len * z * (o.lenK ?? 1); ctx.moveTo(x, y); ctx.lineTo(x - l * wind, y - l); ctx.stroke(); }
  }
}
// 漂浮的光尘（少量、明亮，不会像噪点）
function motes(ctx, t, n, col, a, seed = 1, o = {}) {
  for (let i = 0; i < n; i++) {
    const h1 = hash(i + seed * 31), h2 = hash(i * 2.3 + seed), h3 = hash(i * 5.1 + seed * 7);
    const x = ((h1 * (W + 200) + t * (o.vx ?? 6) * (0.5 + h3)) % (W + 200)) - 100, y = ((h2 * (H + 100) - t * (o.vy ?? 4) * (0.5 + h3)) % (H + 100) + H + 100) % (H + 100) - 50;
    glow(ctx, x, y, 3 + h3 * 7, col, a * (0.4 + 0.6 * Math.sin(t * (0.6 + h2) + h1 * 9) ** 2));
  }
}
