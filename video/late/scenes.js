// 分镜。每个镜头：{t0,t1, morph(可选), back(背景), pts(粒子), fore(前景)}
// 时间对齐歌曲段落：dusk 0–32.4 / night 32.4–64.9 / storm 64.9–96.7 / dark 96.7–104 /
// climb 104–153 / beam 153–185.3 / bridge 185.3–208.6 / dawn 208.6–251.6 / outro 251.6–265.93
const NOW = PAL.now, PAST = PAL.past, FIGHT = PAL.fight, DREAM = PAL.dream;
// letterbox：2.39 遮幅，h 是上下黑边高度
function bars(ctx, h) { if (h <= 0) return; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h); }
function vignette(ctx, s = 0.42) { const v = ctx.createRadialGradient(960, 540, 520, 960, 540, 1260); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, `rgba(0,0,0,${s})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
function fade(ctx, a) { if (a > 0.002) { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(0, 0, W, H); } }
// 手持微晃
function handheld(cam, t, amt = 1) { cam.x += Math.sin(t * 0.7) * 2.2 * amt + Math.sin(t * 1.9) * 1.1 * amt; cam.y += Math.cos(t * 0.6) * 1.8 * amt; return cam; }
const breath = (t, lo, hi, sp = 0.5) => mix(lo, hi, 0.5 + 0.5 * Math.sin(t * sp));

// ====================================================================
// 镜头 A（14–32.4，dusk 尾）：黄昏的公寓。她坐在窗边握着手机。门口闪过他金色的身影，散了。
// 镜头极缓推近。片名散去后画面交到这里。
// ====================================================================
const scA = (() => {
  const t0 = 14;
  function cam(lt) { return handheld({ x: 1050, y: 560, s: 0.74 + 0.02 * lt / 18 }, lt + t0, 0.5); }
  function back(ctx, lt, a) {
    nightSky(ctx, "#070b18", "#1a2140", 1080); roomSky(ctx, cam(lt), 1);
    const c = cam(lt); streetLightsRoom(ctx, c);
    // 桌上的台灯暖光（唯一的暖色，暗示屋里还留着两个人的痕迹）
    const [lx, ly] = ap(camT(c), 782, 712); glow(ctx, lx, ly, 130 * c.s, "255,180,110", 0.18 + 0.03 * Math.sin(lt));
    // 她手机屏幕打在脸上的冷光
    const [px, py] = ap(camT(c), 1330, GROUND - 150); glow(ctx, px, py, 95 * c.s, "150,185,255", 0.26);
    ctx.globalAlpha = a < 1 ? a : 1;
  }
  function pts(P, lt) {
    const c = cam(lt), t = lt + t0;
    drawRoom(P, c, t, NOW, 1, { cup2: 1 });
    // 台灯那团小暖光的粒子
    draw(P, SET.room.cup, camT(c), [1, 0.8, 0.5], 0.3, t, { jit: 0.3 });
    // 她：坐在窗台边的小桌旁，侧身对着窗，低头看手机
    // 她坐在窗下的地上，抱膝看手机，偶尔抬头望向门口（等）
    const look = ss(2.6, 3.4, lt % 6) * (1 - ss(4.0, 4.8, lt % 6));         // 周期性抬头
    const sit = lerpPose(SIT_PHONE, pose({ head: -0.1, sR: 0.2, eR: 1.1 }), look * 0.7);
    const g = drawSide(P, "her", sit, 1330, GROUND, 0.8, -1, c, NOW.her, 0.95, t, { coat: 0, ground: true });
    // 手机在手里，屏幕的微光
    const hp = g.at([0.0, 0.1]); drawProp(P, PROP.phone, c, hp[0], hp[1], 0.1, 2.0, [0.7, 0.85, 1], 0.9 * (1 - look * 0.5), t);
    // 他的身影：在门口闪现三次，每次更淡、停得更短，最后散成光尘往屋里飘一点就没了
    const appear = [[3.6, 1.5], [9.0, 1.1], [15.2, 2.2]];
    for (let k = 0; k < appear.length; k++) {
      const [st, du] = appear[k], e = clamp((lt - st) / du); if (e <= 0 || e >= 1) continue;
      const vis = Math.sin(Math.PI * e), u = 1 - vis;                                   // 出现=聚拢，消失=散开
      drawSide(P, "him", pose({ head: 0.15, sR: 0.1, eR: 0.18 }), DOOR.x + DOOR.w / 2, GROUND, 0.9, 1, c, PAST.him, 0.8 * vis, t,
        { coat: 0, ground: true, dim: 0.5, post: dissolver(u, t, 0.4, -0.6, 170) });
    }
  }
  function fore(ctx, lt, a) {
    motes(ctx, lt + t0, 26, "150,180,255", 0.14, 2);
    vignette(ctx, 0.46); bars(ctx, mix(90, 60, ss(0, 3, lt)));
    fade(ctx, 1 - ss(0, 1.0, lt));                                                        // 从片名散尽处淡入
  }
  return { t0, t1: 32.4, back, pts, fore, cam };
})();
// 房间里透过窗照进来的远处路灯/月光（画在背景）
function streetLightsRoom(ctx, c) { const [mx, my] = ap(camT(c), 1500, 262); glow(ctx, mx, my, 120 * c.s, "150,180,235", 0.3); }

// ====================================================================
// 镜头 B（32.4–64.9，night）：低音进来，她冲出门。房间散开，重组成夜晚的街道。
// 她一个人走过城市。经过便利店、公交站时，浮现金色的回忆，出现即消散。
// 开头用 morph 从房间重组而来。
// ====================================================================
const scB = (() => {
  const t0 = 32.4;
  // 她的世界坐标：先快步（像刚冲出来），再放慢，在店和站前几乎停住
  const XK = [[0, 300], [3, 900], [10, 1500], [14, 1700], [20, 2500], [26, 2760], [30, 3150], [32.5, 3400]];
  const herX = lt => keys(lt, XK);
  function cam(lt) { return handheld({ x: herX(lt) + 120, y: 560, s: 0.82 }, lt + t0, 0.7); }
  function back(ctx, lt, a) {
    const c = cam(lt); nightSky(ctx, "#04070f", "#0c1630", 860, c);
    streetLights(ctx, c, rgb(NOW.env), 1, 0.3);
    // 便利店、公交站的暖/冷光
    const [sx, sy] = ap(camT(c), 1740, 660); glow(ctx, sx, sy, 260 * c.s, "255,200,130", 0.2);
    ctx.globalAlpha = 1;
  }
  // 一段金色回忆：两个小人在某处，淡入→停留→化光消散
  function memory(P, c, t, lt, span, worldX, build) {
    const e = clamp((lt - span[0]) / (span[1] - span[0])); if (e <= 0) return;
    const vis = ss(0, 0.22, e) * (1 - ss(0.74, 1, e)), u = ss(0.74, 1, e);       // 后段整体化光飘走
    if (vis <= 0 && u <= 0) return;
    build(P, c, t, worldX, 0.72 * vis, dissolver(u, t, 0.2, -1, 240));
  }
  function pts(P, lt) {
    const c = cam(lt), t = lt + t0, hx = herX(lt);
    drawStreet(P, c, t, NOW, 1);
    // 便利店里：两个金色小人并肩站在冰柜前（一起挑冰淇淋）
    memory(P, c, t, lt, [12.5, 20], 1740, (P, c, t, X, b, post) => {
      drawSide(P, "him", pose({ head: 0.2, sR: 0.5, eR: 0.9 }), X - 34, 718, 0.46, 1, c, PAST.him, b, t, { coat: 0, dim: 0.6, post });
      drawSide(P, "her", pose({ head: 0.22, sR: 0.45, eR: 0.95 }), X + 20, 718, 0.44, 1, c, PAST.her, b, t, { coat: 0, dim: 0.6, post });
      const [gx, gy] = ap(camT(c), X - 6, 690); glow(ctx, gx, gy, 60 * c.s, "255,210,150", 0.3 * (b / 0.72));
    });
    // 公交站：两个金色小人共撑一把伞
    memory(P, c, t, lt, [22, 30], 2880, (P, c, t, X, b, post) => {
      const g1 = drawSide(P, "him", pose({ head: 0.1, sR: 0.08, eR: 0.14 }), X - 18, 862, 0.5, 1, c, PAST.him, b, t, { coat: 0, dim: 0.6, post });
      drawSide(P, "her", pose({ head: 0.12, sR: 0.06, eR: 0.14 }), X + 24, 862, 0.48, 1, c, PAST.her, b, t, { coat: 0, dim: 0.6, post });
      drawProp(P, PROP.umbS, c, X + 2, 862 - 0.5 * 330, 0.0, 0.5, PAST.hi, b, t, { post });
    });
    // 她（现在，冷蓝），走路。相位按走过的距离推进
    const dist = hx - herX(Math.max(0, lt - 0.001)), spd = Math.abs(herX(lt + 0.05) - herX(lt - 0.05)) / 0.1;
    const ph = (hx / (271 * 0.8)) % 1, moving = clamp(spd / 60);
    const pw = lerpPose(pose({ head: 0.18, sR: 0.2, eR: 0.9 }), walk(ph, 1), moving);  // 停下时垂手，走时摆臂
    const g = drawSide(P, "her", pw, hx, STREET_Y, 0.8, 1, c, NOW.her, 0.95, t, { coat: 1 });
    if (moving < 0.4) { const hp = g.at([0.0, 0.2]); drawProp(P, PROP.phone, c, hp[0], hp[1], 0.2, 1.8, [0.7, 0.85, 1], 0.7, t); }  // 停下时看一眼手机
  }
  function fore(ctx, lt, a) {
    motes(ctx, lt + t0, 30, "150,185,255", 0.12, 3);
    vignette(ctx, 0.5); bars(ctx, 60);
  }
  return { t0, t1: 64.9, morph: { order: "y", lift: 300, swirl: 200 }, back, pts, fore, cam };
})();

// ====================================================================
// 镜头 C（64.9–96.7，storm / 副歌 1）：十年前的争吵。金红色，随鼓点硬切。
// 穿插现在的她在雨里奔跑（冷蓝）。鼓点下拍：64.62 67.29 69.96 72.63 75.3 77.95 80.62 83.29 85.94 88.63 91.28 93.95
// ====================================================================
const scC = (() => {
  const t0 = 64.9;
  // 现在的她：整段里连续往右跑（三段插入看起来是同一段奔跑）
  function presentRun(P, ctx, t, prog) {
    const hx = mix(200, 2400, prog), c = handheld({ x: hx + 100, y: 600, s: 0.9 }, t, 1.6);
    nightSky(ctx, "#04070f", "#0a1228", 860, c); drawSideSet(P, c, t, NOW, 0.9);
    sideLights(ctx, c, rgb(NOW.env), 1);
    const ph = (hx / (500 * 0.9)) % 1;
    const g = drawSide(P, "her", run(ph, 1), hx, STREET_Y, 0.9, 1, c, NOW.her, 1, t, { coat: 1 });
    const hp = g.at([0.0, 0.3]); drawProp(P, PROP.phone, c, hp[0], hp[1], 0.5, 1.9, [0.75, 0.88, 1], 0.8, t);
    return c;
  }
  // 十年前的记忆空间：暖红，残缺的房间（只有门和几片悬浮的碎片）
  function pastRoom(P, ctx, c, t, shake) {
    nightSky(ctx, "#180810", "#3a1020", 1080);
    const [dx, dy] = ap(camT(c), DOOR.x + 110, 300); glow(ctx, dx, dy, 300 * c.s, "255,120,90", 0.14);
    draw(P, SET.room.frame, camT(c), FIGHT.env, 0.3, t, { jit: 0.6 + shake * 3 });
  }
  // 手动撒一小撮爆开的粒子（钥匙摔碎、门摔碎）
  function burst(P, c, wx, wy, e, n, col, spd) {
    if (e <= 0 || e >= 1) return; const r = rng(((wx * 13 + wy) | 0));
    const [ox, oy] = ap(camT(c), wx, wy);
    for (let i = 0; i < n; i++) { const a = r() * TAU, v = (0.3 + r()) * spd, k = e * e; const x = ox + Math.cos(a) * v * k, y = oy + Math.sin(a) * v * k * 0.7 + 420 * k * k; P.push(x, y, col[0], col[1], col[2], (1 - e) * (0.8 + 0.4 * r())); }
  }
  function back(ctx, lt, a) { /* 背景在 pts 里按分镜画，这里留空 */ }
  function pts(P, lt) {
    const t = lt + t0;
    // 分镜：[起, 画法]
    if (lt < 5.06) {                                    // 64.9–69.96 对峙：两人隔着距离争执，手势激动
      const c = handheld({ x: 960, y: 600, s: 0.92 }, t, 0.8); pastRoom(P, ctx, c, t, 0);
      const beat = Math.sin(t * 7), gest = 0.4 + 0.5 * Math.max(0, beat);
      drawSide(P, "him", pose({ lean: 0.1, head: 0.05, sR: 0.3 + gest, eR: 0.6, sL: -0.2, eL: 0.3 }), 720, GROUND, 0.95, 1, c, FIGHT.him, 1, t, { coat: 0, dim: 0.6 });
      drawSide(P, "her", pose({ lean: -0.06, head: -0.1, sR: 0.2, eR: 0.5, sL: 0.3 + gest * 0.6, eL: 0.4 }), 1200, GROUND, 0.9, -1, c, FIGHT.her, 1, t, { coat: 1, dim: 0.6 });
    } else if (lt < 7.73) {                             // 69.96–72.63 钥匙被摔在地上，溅成粒子
      const c = handheld({ x: 980, y: 640, s: 1.05 }, t, 1); pastRoom(P, ctx, c, t, ss(1.0, 1.2, lt - 5.06) * 0.3);
      const e = (lt - 5.06) / 2.67;
      drawSide(P, "her", pose({ lean: 0.08, head: 0.1, sR: 1.1 - e, eR: 0.4, sL: 0.2, eL: 0.4 }), 1180, GROUND, 0.92, -1, c, FIGHT.her, 1, t, { coat: 1, dim: 0.6 });
      const kf = clamp(e / 0.45), kx = mix(1120, 900, kf), ky = mix(560, GROUND - 10, kf * kf);
      if (kf < 1) drawProp(P, PROP.keys, c, kx, ky, kf * 6, 1.1, FIGHT.hi, 0.9, t);
      burst(P, c, 900, GROUND - 10, clamp((e - 0.45) / 0.55), 2200, FIGHT.hi, 160);
    } else if (lt < 10.4) {                             // 72.63–75.3 现在：她在雨里奔跑
      presentRun(P, ctx, t, mix(0, 0.26, (lt - 7.73) / 2.67));
    } else if (lt < 13.05) {                            // 75.3–77.95 他走出门，门重重关上，画面碎裂
      const sh = ss(1.6, 1.9, lt - 10.4) * (1 - ss(1.9, 2.3, lt - 10.4));
      const c = handheld({ x: 620, y: 600, s: 1.0 }, t, 0.6 + sh * 6); pastRoom(P, ctx, c, t, sh);
      const e = (lt - 10.4) / 2.65, wx = mix(760, DOOR.x + 120, clamp(e / 0.6));
      const walking = e < 0.6; const ph = (mix(0, 300, e) / (271 * 0.95)) % 1;
      drawSide(P, "him", walking ? walk(ph, 0.8) : pose({ head: -0.1 }), wx, GROUND, 0.95, -1, c, FIGHT.him, 1 - ss(0.62, 0.72, e), t, { coat: 0, dim: 0.6, post: e > 0.62 ? dissolver(ss(0.62, 0.8, e), t, -0.6, -0.3, 200) : null });
      burst(P, c, DOOR.x + 110, 560, clamp((e - 0.62) / 0.38), 3000, FIGHT.hi, 220);
    } else if (lt < 15.72) {                            // 77.95–80.62 现在：奔跑
      presentRun(P, ctx, t, mix(0.26, 0.5, (lt - 13.05) / 2.67));
    } else if (lt < 21.04) {                            // 80.62–85.94 两人背对背，越走越远，化成光尘
      const c = handheld({ x: 960, y: 600, s: 0.86 }, t, 0.5); pastRoom(P, ctx, c, t, 0);
      const e = (lt - 15.72) / 5.32, gap = e * 520;
      const ph1 = (gap / (271 * 0.88)) % 1;
      drawSide(P, "him", walk(ph1, 0.7), 820 - gap, GROUND, 0.88, -1, c, FIGHT.him, 1, t, { coat: 0, dim: 0.6, post: dissolver(ss(0.6, 1, e), t, -0.5, -0.4, 220) });
      drawSide(P, "her", walk(ph1, 0.7), 1100 + gap, GROUND, 0.86, 1, c, FIGHT.her, 1, t, { coat: 1, dim: 0.6, post: dissolver(ss(0.6, 1, e), t, 0.5, -0.4, 220) });
    } else if (lt < 26.38) {                            // 85.94–91.28 现在：奔跑（最用力），雨更大
      presentRun(P, ctx, t, mix(0.5, 0.82, (lt - 21.04) / 5.34));
    } else {                                            // 91.28–96.7 她接近路口，脚步放慢，雨里只剩她
      const prog = mix(0.82, 1, (lt - 26.38) / 5.42), hx = mix(2400, 2760, (lt - 26.38) / 5.42);
      const c = handheld({ x: hx + 100, y: 600, s: mix(0.9, 1.0, (lt - 26.38) / 5.42) }, t, 1.2 * (1 - (lt - 26.38) / 5.42));
      nightSky(ctx, "#04070f", "#0a1228", 860, c); drawSideSet(P, c, t, NOW, 0.9); sideLights(ctx, c, rgb(NOW.env), 1, 0.0);
      const spd = 26.38 + 5.42 > lt ? 1 : 0; const ph = (hx / (500 * 0.9)) % 1;
      const slow = ss(0, 1, (lt - 26.38) / 5.42);
      drawSide(P, "her", lerpPose(run(ph, 1), pose({ head: 0.2, lean: 0.08, sR: 0.2, eR: 0.8 }), slow), hx, STREET_Y, mix(0.9, 1.0, (lt - 26.38) / 5.42), 1, c, NOW.her, 1, t, { coat: 1 });
    }
  }
  function fore(ctx, lt, a) {
    const t = lt + t0, past = lt < 5.06 || (lt >= 7.73 && lt < 10.4 ? false : false);
    // 现在的段落下雨；过去的段落不下雨但有暖红光尘
    const isPresent = (lt >= 7.73 && lt < 10.4) || (lt >= 13.05 && lt < 15.72) || (lt >= 21.04 && lt < 26.38) || lt >= 26.38;
    if (isPresent) rain(ctx, t, 520, "150,185,255", mix(0.5, 0.85, clamp(lt / 26)), { wind: 0.22, speed: 1700, len: 40 });
    else motes(ctx, t, 40, "255,150,110", 0.16, 5);
    // 硬切那几帧闪一下（红/白）
    const cuts = [5.06, 7.73, 10.4, 13.05, 15.72, 21.04, 26.38];
    for (const cu of cuts) { const d = lt - cu; if (d >= 0 && d < 0.18) { ctx.fillStyle = `rgba(255,${cu === 10.4 ? 120 : 220},${cu === 10.4 ? 90 : 230},${0.5 * (1 - d / 0.18)})`; ctx.fillRect(0, 0, W, H); } }
    vignette(ctx, 0.5); bars(ctx, 60);
  }
  return { t0, t1: 96.7, back, pts, fore, cam: lt => ({ x: 960, y: 540, s: 1 }) };
})();

// ====================================================================
// 镜头 D（96.7–104，dark）：她停在路口。红灯。雨和所有粒子悬停在半空，时间静止。
// 切到路口视角（从这一侧看过去，对面是红色行人灯）。她背对镜头，站在斑马线这头。
// ====================================================================
const scD = (() => {
  const t0 = 96.7, FREEZE = 1.4;
  function cam(lt) { const z = ss(0, 5, lt); return { x: 960, y: 560 + z * 20, s: mix(1.0, 1.06, z) }; }
  function back(ctx, lt, a) {
    const c = cam(lt); nightSky(ctx, "#05070f", "#0c1226", 575, c);
    crossLights(ctx, c, rgb(NOW.env), 0.9);
    crossSignal(ctx, c, 0, 1);                           // 红灯
    ctx.globalAlpha = 1;
  }
  function pts(P, lt) {
    const c = cam(lt), t = Math.min(lt, FREEZE) + t0;    // 时间在 FREEZE 后冻结：粒子停止漂动
    drawCross(P, c, t, NOW, 1);
    // 她：站在斑马线这头偏右，背对镜头，微微喘气（只有肩在起伏）
    const breathe = lt < FREEZE ? 0 : Math.sin((lt - FREEZE) * 0.9) * 0.012;
    drawFront(P, "her", fpose({ aL: [0.12, 0.1], aR: [0.12, 0.1], sway: breathe }), 980, CROSS.near + 70, 1.5, c, NOW.her, 1, t, { back: true });
  }
  function fore(ctx, lt, a) {
    const t = lt + t0, fz = clamp((lt - 0.4) / (FREEZE - 0.4));
    // 雨：先在下，逐渐冻成悬浮的光点
    if (fz < 1) rain(ctx, t, 460, "150,185,255", 0.7 * (1 - fz), { wind: 0.2, speed: 1600, len: 38 });
    rain(ctx, t, 460, "160,195,255", 0.5 * fz, { freeze: FREEZE + t0, still: true, wind: 0.2 });
    // 时间静止的一圈涟漪
    const rp = lt - FREEZE; if (rp > 0 && rp < 2.2) { ctx.strokeStyle = `rgba(150,190,255,${0.2 * Math.exp(-rp * 1.5)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(960, 620, 80 + rp * 900, (80 + rp * 900) * 0.4, 0, 0, TAU); ctx.stroke(); }
    motes(ctx, Math.min(lt, FREEZE) + t0, 50, "150,185,255", 0.18, 7);
    vignette(ctx, 0.52); bars(ctx, 60);
    fade(ctx, (1 - ss(0, 0.5, lt)) * 0.6);               // 从上个镜头轻轻接进来
  }
  return { t0, t1: 104.0, back, pts, fore, cam };
})();

// 旧手机屏幕上那条未发送的语音（画得清晰，可读）
function drawVoiceMsg(ctx, cx, cy, s, reveal, play) {
  if (reveal <= 0) return; ctx.save(); ctx.globalAlpha = reveal; ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.fillStyle = "rgba(60,90,160,0.5)"; rrect(ctx, -92, -30, 184, 60, 16); ctx.fill();
  ctx.strokeStyle = "rgba(170,200,255,0.5)"; ctx.lineWidth = 1.2; ctx.stroke();
  // 波形条
  const bars = 26, r = rng(91); ctx.fillStyle = "rgba(210,228,255,0.95)";
  for (let i = 0; i < bars; i++) { const h = (6 + 26 * Math.abs(Math.sin(i * 1.3) * (0.5 + r()))) * (play > 0 ? (i / bars < play ? 1 : 0.4) : 1); ctx.fillRect(-66 + i * 5.1, -h / 2, 2.6, h); }
  ctx.beginPath(); ctx.moveTo(-84, -8); ctx.lineTo(-84, 8); ctx.lineTo(-72, 0); ctx.fill();     // 播放三角
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = "rgba(255,170,150,0.9)";
  ctx.font = `500 15px ${UI}`; ctx.fillText("未发送", 0, 52); ctx.fillStyle = "rgba(190,210,255,0.7)"; ctx.font = `300 13px ${UI}`; ctx.fillText("那天晚上 23:47 · 0:14", 0, 72);
  ctx.restore();
}

// ====================================================================
// 镜头 E（104–153，climb / 主歌 2）：她见到他的朋友，接过一个旧盒子，
// 里面是他的旧手机，上面有一条十年前那晚他录好却没发出的语音。
// ====================================================================
const scE = (() => {
  const t0 = 104.0;
  // 用路口的侧面视角（人行道），和上一个镜头同一个地方
  function pts(P, lt) {
    const t = lt + t0;
    if (lt < 22) {                                          // 104–126：朋友走来，递盒子；她接过，蹲下打开
      const push = ss(9, 22, lt);                           // 后半缓缓推近
      const c = handheld({ x: mix(1000, 1080, push), y: mix(600, 660, push), s: mix(0.95, 1.4, push) }, t, 0.4);
      nightSky(ctx, "#05070f", "#0c1226", 640, c); drawSideSet(P, c, t, NOW, 0.85, {}); sideLights(ctx, c, rgb(NOW.env), 0.9, 0);
      crossSignalSide(ctx, c, 0);
      // 朋友（灰蓝）从左走进来，停下，伸手递出盒子
      const fx = keys(lt, [[0, 440], [5, 820], [7, 860]]), reach = ss(7, 9.5, lt) * (1 - ss(10.5, 12, lt));
      const fWalk = lt < 6 ? walk((fx / (271 * 0.9)) % 1, 0.9) : pose({ head: 0.12, sR: mix(0.1, 1.35, reach), eR: mix(0.2, 0.35, reach) });
      const fAlive = 1 - ss(20, 22, lt);                     // 最后淡出（朋友离开）
      drawSide(P, "yuan", fWalk, fx, STREET_Y, 0.9, 1, c, PAL.yuan, 0.85 * fAlive, t, { coat: 0, dim: 0.7 });
      // 她（右，面向朋友），伸手接过 → 低头开盒
      const open = ss(13, 20, lt), take = ss(9, 12, lt);
      const herPose = lt < 13.5 ? pose({ head: 0.22, sR: mix(0.2, 1.3, take), eR: mix(1.0, 0.4, take) }) : lerpPose(pose({ head: 0.3, sR: 0.6, eR: 1.2 }), SIT_KNEES, ss(13.5, 17, lt) * 0.55);
      drawSide(P, "her", herPose, 1200, STREET_Y, 0.9, -1, c, NOW.her, 1, t, { coat: 1 });
      // 盒子：朋友手上 → 递到她手里（固定在手的高度），她接过后下沉到膝前
      const hand = clamp((lt - 8) / 4), low = ss(13.5, 18, lt);
      const bx = mix(930, 1120, hand), by = mix(700, 715, hand) + low * 70;
      if (open < 1) drawProp(P, PROP.box, c, bx, by, 0, 0.72, [0.72, 0.82, 1], 0.9, t);
      // 盒盖打开后掀起、化光
      if (open > 0) { const u = open; drawProp(P, PROP.lid, c, bx, by - 50 - u * 90, u * 0.3, 0.72, [0.78, 0.88, 1], 0.9 * (1 - u), t, { post: dissolver(u, t, 0.2, -1, 160) });
        const [gx, gy] = ap(camT(c), bx, by - 8); glow(ctx, gx, gy, 60 * c.s * open, "150,190,255", 0.4 * open); }
    } else {                                                 // 126–153：她坐着捧旧手机，那条未发送的语音浮在屏幕上
      const c = { x: 1150, y: 640, s: mix(1.1, 1.32, ss(22, 46, lt)) };
      nightSky(ctx, "#060910", "#0e1430", 700, c); drawSideSet(P, c, t, NOW, 0.5); sideLights(ctx, c, rgb(NOW.env), 0.55, 0);
      // 她抱膝、双手捧着旧手机在胸前，低头看
      const hg = drawSide(P, "her", SIT_PHONE, 1240, STREET_Y, 0.95, -1, c, NOW.her, 1, t, { coat: 1 });
      const hp = hg.at(hg.b.handR);                          // 手的世界坐标
      drawProp(P, PROP.oldPhone, c, hp[0], hp[1] - 8, -0.12, 0.52, [0.72, 0.85, 1], 0.95, t);
      const scr = ap(camT(c), hp[0], hp[1] - 14); glow(ctx, scr[0], scr[1], 60 * c.s, "150,190,255", 0.42);
      // 语音框浮在手机上方偏左的空处，清晰可读
      scE_scr = { x: scr[0] - 150 * c.s, y: scr[1] - 150 * c.s, s: c.s, from: [scr[0], scr[1]] };
    }
  }
  function back(ctx, lt, a) {}
  function fore(ctx, lt, a) {
    const t = lt + t0;
    rain(ctx, t, 300, "150,185,255", 0.4 * (1 - ss(0, 6, lt) * 0.5), { wind: 0.16, speed: 1300, len: 30 });
    motes(ctx, t, 30, "150,185,255", 0.12, 9);
    // 旧手机特写时，在屏幕位置叠一条清晰的语音消息
    if (lt >= 126 - t0 && scE_scr) {
      const rev = ss(129 - t0, 131.5 - t0, lt);
      if (rev > 0) { ctx.save(); ctx.globalAlpha = rev * 0.5; ctx.strokeStyle = "rgba(150,190,255,1)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(scE_scr.from[0], scE_scr.from[1]); ctx.lineTo(scE_scr.x, scE_scr.y + 30 * scE_scr.s); ctx.stroke(); ctx.restore(); }
      drawVoiceMsg(ctx, scE_scr.x, scE_scr.y, scE_scr.s * 0.95, rev, 0);
    }
    vignette(ctx, 0.5); bars(ctx, 60);
    fade(ctx, (1 - ss(0, 0.6, lt)) * 0.7);
  }
  return { t0, t1: 153.0, back, pts, fore, cam: lt => ({ x: 1080, y: 640, s: 1.2 }) };
})();
function crossSignalSide(ctx, c, green) { const [rx, ry] = ap(camT(c), 1500, 352); glow(ctx, rx, ry, 56 * c.s, green ? "80,255,170" : "255,70,60", 0.6); }
let scE_scr = null;

// 季节的粒子（雪、花瓣、落叶），画在前景，清晰不糊
function season(ctx, t, kind, a, seed = 1) {
  if (a <= 0.003) return; const n = kind === "rain" ? 420 : 260;
  if (kind === "rain") { rain(ctx, t, n, "150,185,255", a * 0.7, { wind: 0.2, speed: 1500, len: 34 }); return; }
  const col = kind === "snow" ? "235,244,255" : kind === "petal" ? "255,196,214" : "250,186,120";
  const fall = kind === "snow" ? 70 : kind === "petal" ? 95 : 150, sway = kind === "leaf" ? 90 : 55;
  for (let i = 0; i < n; i++) {
    const h1 = hash(i + seed * 31), h2 = hash(i * 2.7 + seed), h3 = hash(i * 5.3 + seed * 7), z = 0.4 + h3;
    const y = ((h2 * (H + 160) + t * fall * z) % (H + 160)) - 80, x = h1 * (W + 160) - 80 + Math.sin(t * (0.5 + h3) + h1 * 9) * sway;
    const s = (1 + z * 2) * (kind === "snow" ? 1 : 1.3); ctx.fillStyle = `rgba(${col},${a * (0.3 + 0.6 * h3)})`;
    if (kind === "leaf") { ctx.save(); ctx.translate(x, y); ctx.rotate(t * (0.8 + h2) + h1 * 6); ctx.fillRect(-s, -s * 0.5, s * 2, s); ctx.restore(); }
    else { ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill(); }
  }
}
function caption(ctx, s, a, y = 905, sub) {
  if (a <= 0.003) return; ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 16; ctx.fillStyle = "rgba(240,246,255,0.96)"; ctx.font = `400 56px ${SERIF}`; ctx.letterSpacing = "10px"; ctx.fillText(s, 960 + 5, y);
  if (sub) { ctx.font = `300 22px ${UI}`; ctx.letterSpacing = "6px"; ctx.fillStyle = "rgba(200,216,255,0.8)"; ctx.fillText(sub, 960 + 3, y + 50); }
  ctx.letterSpacing = "0px"; ctx.restore();
}

// ====================================================================
// 镜头 F（153–185.3，beam / 副歌 2，反转）：这十年，每年的同一天，他都回到这个路口等她。
// 季节在他身边更替，他没有走。每一年一个不同的等待的小景，字幕"第 N 年"。
// 最后切到现在的她，拿着手机，拼命跑向这个路口。
// ====================================================================
const scF = (() => {
  const t0 = 153.0;
  const YR = 2.4, MONT = 24;                               // 每年 2.4 秒，共 10 年 24 秒
  const kinds = ["snow", "petal", "rain", "leaf"];
  // 每一年他在路口等待的样子（世界坐标在对面那头，scale 小）
  function yearPose(n, p) {           // n: 0..9, p: 0..1 当年进度
    const sway = Math.sin(p * TAU) * 0.04;
    switch (n) {
      case 0: return { pose: pose({ head: -0.06 + sway, sR: 0.1, eR: 0.2 }), x: 960, sit: 0 };                 // 抬头张望
      case 1: return { pose: pose({ head: 0.4, sR: 0.5, eR: 1.4, sL: 0.4, eL: 1.3 }), x: 940, sit: 0, phone: 1 }; // 看手机
      case 2: return { pose: SIT_BENCH, x: 1490, sit: 1 };                                                      // 坐长椅
      case 3: return { pose: walk((p * 1.5) % 1, 0.6), x: mix(880, 1040, Math.sin(p * Math.PI)), sit: 0 };       // 踱步
      case 4: return { pose: pose({ head: -0.05, lean: 0.02, sR: 0.08, eR: 0.16 }), x: 960, sit: 0 };            // 静静站
      case 5: return { pose: pose({ head: 0.1, lean: 0.12, sR: 0.3, eR: 0.3 }), x: 654, sit: 0, lean: 1 };       // 靠着灯杆
      case 6: return { pose: lerpPose(SIT_BENCH, pose({ head: 0.5 }), 0.5), x: 1490, sit: 1 };                   // 坐着低头
      case 7: return { pose: pose({ head: 0.3, lean: 0.14, sR: 0.12, eR: 0.3 }), x: 960, sit: 0 };               // 站着佝偻
      case 8: return { pose: SIT_KNEES, x: 900, sit: 1 };                                                        // 蹲坐
      default: return { pose: pose({ head: 0.42 + sway * 0.5, lean: 0.1, sR: 0.1, eR: 0.22 }), x: 960, sit: 0 }; // 第10年：站着垂首
    }
  }
  function back(ctx, lt, a) {
    if (lt < MONT) { const c = camM(lt); nightSky(ctx, "#060a16", "#121a34", 575, c); crossLights(ctx, c, rgb(PAST.env), 0.5); crossSignal(ctx, c, 0, 0.8); }
    else { const c = camRun(lt); nightSky(ctx, "#05070f", "#0b1430", 640, c); sideLights(ctx, c, rgb(NOW.env), 1, 0); }
  }
  function camM(lt) { const g = ss(0, MONT, lt); return { x: 960, y: mix(470, 540, g), s: mix(0.92, 1.12, g) }; }   // 整段极缓推近
  function camRun(lt) { const p = (lt - MONT) / (32.3 - MONT), hx = mix(300, 1900, p); return handheld({ x: hx + 80, y: 600, s: 0.95 }, lt + t0, 1.4); }
  function pts(P, lt) {
    const t = lt + t0;
    if (lt < MONT) {
      const c = camM(lt), n = Math.min(9, Math.floor(lt / YR)), p = (lt - n * YR) / YR;
      drawCross(P, c, t, PAST, 0.8);                        // 路口染成暖金（回忆/他的视角）
      const y = yearPose(n, p), appear = ss(0, 0.18, p) * (1 - ss(0.9, 1, p));   // 年初聚拢、年末散开（季节一吹）
      const u = ss(0.9, 1, p), e = ss(0, 0.16, p);
      const fy = y.sit ? (y.x === 1490 ? 586 : CROSS.far + 150) : CROSS.far + 120;
      const g = drawSide(P, "him", y.pose, y.x, fy, 0.6, 1, c, PAST.him, 0.92 * appear, t, { coat: 0, dim: 0.65, post: u > 0 ? dissolver(u, t, 0.6, -0.4, 180) : (e < 1 ? assembler(1 - e, t, 150) : null) });
      if (y.phone) { const hp = g.at(g.b.handR); drawProp(P, PROP.oldPhone, c, hp[0], hp[1] - 6, 0, 0.3, PAST.hi, 0.8 * appear, t); }
      // 对面行人灯旁，微微的暖光（他在等）
      const [hx, hy] = ap(camT(c), y.x, fy - 60); glow(ctx, hx, hy, 50 * c.s, "255,200,140", 0.25 * appear);
    } else {
      // 现在：她拿着手机，拼命跑向路口
      const c = camRun(lt), p = (lt - MONT) / (32.3 - MONT), hx = mix(300, 1900, p);
      drawSideSet(P, c, t, NOW, 0.9); const ph = (hx / (500 * 0.95)) % 1;
      const g = drawSide(P, "her", run(ph, 1), hx, STREET_Y, 0.92, 1, c, NOW.her, 1, t, { coat: 1 });
      const hp = g.at([0, 0.3]); drawProp(P, PROP.oldPhone, c, hp[0], hp[1], 0.5, 0.42, [0.78, 0.9, 1], 0.85, t);
    }
  }
  function fore(ctx, lt, a) {
    const t = lt + t0;
    if (lt < MONT) {
      const n = Math.min(9, Math.floor(lt / YR)), p = (lt - n * YR) / YR;
      season(ctx, t, kinds[n % 4], mix(0.5, 0.9, Math.sin(p * Math.PI)), n + 1);     // 季节在年中最盛
      // 字幕"第 N 年"（中段淡入淡出）；第 10 年停得久一点
      const capA = n < 9 ? ss(0.12, 0.3, p) * (1 - ss(0.7, 0.9, p)) : ss(0.12, 0.3, p);
      caption(ctx, `第 ${["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"][n]} 年`, capA, 160);
      if (n === 0) caption(ctx, "", 0);                                              // 占位
    } else {
      season(ctx, t, "rain", 0.8, 2);
      if (lt < MONT + 1.2) caption(ctx, "他一直在等。", ss(MONT, MONT + 0.5, lt) * (1 - ss(MONT + 2.2, MONT + 3, lt)), 160);
    }
    vignette(ctx, 0.5); bars(ctx, 60);
    // 段落开头从上一镜头接进来
    fade(ctx, (1 - ss(0, 0.5, lt)) * 0.6);
  }
  return { t0, t1: 185.3, back, pts, fore, cam: camM };
})();

// 天边泛起的晨光（画在夜空上，逐渐长高）
function dawnBand(ctx, cam, grow, warm = 1) {
  const [, hy] = ap(camT(cam), 0, 575), top = hy - grow * 340;
  const g = ctx.createLinearGradient(0, hy, 0, top); g.addColorStop(0, `rgba(${warm ? "255,180,120" : "150,180,230"},${0.5 * grow})`); g.addColorStop(0.5, `rgba(${warm ? "200,120,120" : "90,120,200"},${0.22 * grow})`); g.addColorStop(1, "rgba(20,24,50,0)");
  ctx.fillStyle = g; ctx.fillRect(0, top, W, hy - top);
}
// 从手机升起的声波：一列会脉动的粒子，缓缓上升、消散（他的声音）
function soundwave(P, ctx, c, wx, wy, t, lt, rise, power) {
  if (rise <= 0) return; const [ox, oy] = ap(camT(c), wx, wy), r = rng(555), col = [1, 0.84, 0.56];
  const n = Math.floor(2600 * rise);
  for (let i = 0; i < n; i++) {
    const a = r(), band = r(), life = r();
    const age = (lt * 0.5 + life) % 1, up = age * (220 + power * 260) * c.s;
    const freq = 2 + band * 9, amp = (16 + power * 40) * c.s * Math.exp(-age * 1.3) * (0.4 + 0.6 * Math.abs(Math.sin(t * freq + band * 7)));
    const x = ox + (band - 0.5) * 2 * amp, y = oy - up - 10 * c.s;
    P.push(x, y, col[0], col[1], col[2], (1 - age) * rise * (0.5 + 0.5 * life));
  }
  glow(ctx, ox, oy - 20 * c.s, (50 + power * 60) * c.s, "255,200,130", 0.3 * rise);
}

// ====================================================================
// 镜头 G（185.3–208.6，bridge）：天快亮了。她坐在路口的台阶上，按下播放。
// 一道由粒子组成的声波从手机里缓缓升起。全片最空、最静。
// ====================================================================
const scG = (() => {
  const t0 = 185.3, PLAY = 4.0;        // 入座后按下播放
  function cam(lt) { const g = ss(0, 23, lt); return handheld({ x: mix(900, 820, g), y: mix(640, 600, g), s: mix(0.95, 1.18, g) }, lt + t0, 0.3); }
  function back(ctx, lt, a) {
    const c = cam(lt); nightSky(ctx, "#0a1020", "#1c2340", 575, c);
    dawnBand(ctx, c, ss(0, 23, lt) * 0.6, 1);
    crossLights(ctx, c, rgb(NOW.env), 0.5); crossSignal(ctx, c, 0, 0.7);     // 还是红灯
    ctx.globalAlpha = 1;
  }
  function pts(P, lt) {
    const c = cam(lt), t = lt + t0;
    drawCross(P, c, t, NOW, 0.9);
    // 她坐在斑马线这头的台阶上（近景，面向路口），捧着旧手机
    const arrive = ss(0, 1.2, lt);
    const g = drawSide(P, "her", SIT_PHONE, 760, CROSS.near + 40, 1.15, 1, c, NOW.her, 1, t, { coat: 1, ground: false });
    const hp = g.at(g.b.handR);
    drawProp(P, PROP.oldPhone, c, hp[0], hp[1] - 8, 0.05, 0.6, [0.8, 0.9, 1], 0.95, t);
    // 按下播放后，声波升起（随时间越来越强，为晨光重击蓄力）
    const play = clamp((lt - PLAY) / 1.0), power = ss(PLAY, 23, lt);
    soundwave(P, ctx, c, hp[0], hp[1] - 24, t, lt, play, power);
  }
  function fore(ctx, lt, a) {
    const t = lt + t0;
    motes(ctx, t, 36, "200,200,255", 0.14, 11, { vy: 2 });
    // 雨快停了
    if (lt < 6) rain(ctx, t, 220, "150,185,255", 0.3 * (1 - lt / 6), { wind: 0.14, speed: 1200, len: 28 });
    vignette(ctx, 0.5); bars(ctx, 60);
    fade(ctx, (1 - ss(0, 0.6, lt)) * 0.6);
  }
  return { t0, t1: 208.6, back, pts, fore, cam };
})();

// 把一个人物从某个屏幕点"聚拢成形"（声波炸成他）
function gatherFrom(u, fx, fy) { const uu = eio(clamp(u)); return (v, ph, o) => { const p = 1 - eio(clamp((uu - 0.45 * v) / 0.55)); if (p <= 0) return; o.x = mix(o.x, fx + Math.cos(ph) * 50, p); o.y = mix(o.y, fy + Math.sin(ph) * 50, p); o.a *= (1 - p * 0.5); }; }

// ====================================================================
// 镜头 H（208.6–251.6，dawn / 最后的副歌）：晨光重击——声波炸成漫天金粒子，在马路对面拼出他。
// 红灯变绿。接着是"如果那天"的想象：这十年他们在一起的样子，一幕接一幕快速流过。
// 最后他走过斑马线，朝她伸出手。
// ====================================================================
const scH = (() => {
  const t0 = 208.6;
  const HIM_FAR = [1120, CROSS.far + 120, 0.64];           // 他在对面出现的位置
  const PHONE = [760, CROSS.near + 40];                    // 她手机的大致位置
  // "如果那天"的想象，暖金（DREAM）。每个小景一个函数，e: 0..1
  function vRun(P, ctx, c, t, e) {                          // 跑向彼此，在路口中央相拥
    const meet = ss(0.3, 0.8, e); const hx = mix(1120, 980, meet), herx = mix(640, 920, meet);
    const together = ss(0.75, 1, e);
    if (together < 1) {
      const ph1 = (e * 3) % 1; drawSide(P, "him", run(ph1, 1 - together), hx, CROSS.near - 40, 0.72, -1, c, DREAM.him, 1, t, { coat: 0 });
      drawSide(P, "her", run(ph1, 1 - together), herx, CROSS.near - 20, 0.74, 1, c, DREAM.her, 1, t, { coat: 1 });
    }
    if (together > 0) { // 相拥：两个人靠得很近，微微摇
      const sway = Math.sin(t * 1.5) * 0.03;
      drawFront(P, "him", fpose({ aL: [0.9, 0.5], aR: [0.9, 0.5], sway }), 965, CROSS.near + 10, 0.9, c, DREAM.him, together, t, {});
      drawFront(P, "her", fpose({ aL: [0.8, 0.6], aR: [0.8, 0.6], sway: -sway }), 1000, CROSS.near + 6, 0.86, c, DREAM.her, together, t, { back: true });
    }
  }
  function vHands(P, ctx, c, t, e) {                        // 牵手走过街道
    const hx = mix(500, 1500, e), ph = (hx / (271 * 0.82)) % 1;
    drawSide(P, "him", walk(ph, 0.8), hx - 55, STREET_Y, 0.82, 1, c, DREAM.him, 1, t, { coat: 0 });
    drawSide(P, "her", walk(ph, 0.8), hx + 15, STREET_Y, 0.8, 1, c, DREAM.her, 1, t, { coat: 1 });
    // 牵着的手之间一点光
    const [gx, gy] = ap(camT(c), hx - 20, STREET_Y - 150); glow(ctx, gx, gy, 24 * c.s, "255,220,160", 0.5);
  }
  function vHome(P, ctx, c, t, e) {                         // 家里，窗边，两只杯子，两个人
    drawRoom(P, c, t, DREAM, 0.9, { cup2: 1 });
    const sway = Math.sin(t * 0.8) * 0.02;
    drawSide(P, "her", lerpPose(SIT_BENCH, pose({ head: 0.1 + sway, sR: 0.3, eR: 1.3 }), 1), 1280, GROUND, 0.78, -1, c, DREAM.her, 1, t, { coat: 0 });
    drawSide(P, "him", lerpPose(SIT_BENCH, pose({ head: -0.05, sR: 0.25, eR: 1.2 }), 1), 1380, GROUND, 0.8, -1, c, DREAM.him, 1, t, { coat: 0 });
  }
  function vUmb(P, ctx, c, t, e) {                          // 公交站，共撑一把伞，头靠在一起
    drawStreet(P, c, t, DREAM, 0.8, { store: false });
    const lean = Math.sin(t * 0.7) * 0.02;
    drawSide(P, "him", pose({ head: 0.12 + lean, sR: 0.1, eR: 0.16 }), 2870, STREET_Y, 0.82, 1, c, DREAM.him, 1, t, { coat: 0 });
    drawSide(P, "her", pose({ head: -0.14 + lean, sR: 0.08, eR: 0.16 }), 2912, STREET_Y, 0.8, 1, c, DREAM.her, 1, t, { coat: 1 });
    drawProp(P, PROP.umbS, c, 2890, STREET_Y - 0.5 * 320, 0, 0.52, DREAM.hi, 0.95, t);
  }
  function vSit(P, ctx, c, t, e) {                          // 并肩坐着看城市
    drawCross(P, c, t, DREAM, 0.85);
    drawSide(P, "him", SIT_BENCH, 1460, 586 + 20, 0.72, 1, c, DREAM.him, 1, t, { ground: false });
    drawSide(P, "her", lerpPose(SIT_BENCH, pose({ head: 0.18 }), 0.4), 1520, 586 + 20, 0.7, 1, c, DREAM.her, 1, t, { ground: false });
  }
  const VIG = [                                             // [时长, 画法, 相机]
    [5.2, vRun, lt => ({ x: 980, y: 620, s: mix(0.95, 1.1, 0) })],
    [4.6, vHands, (lt, e) => handheld({ x: mix(500, 1500, e) + 40, y: 600, s: 0.95 }, lt, 0.3)],
    [4.6, vHome, lt => ({ x: 1330, y: 640, s: 0.92 })],
    [4.6, vUmb, lt => ({ x: 2890, y: 600, s: 1.0 })],
    [4.6, vSit, lt => ({ x: 1500, y: 560, s: 1.05 })],
  ];
  const VSTART = 5.0;                                        // 想象段从这里开始
  function vigAt(lt) { let s = VSTART; for (let i = 0; i < VIG.length; i++) { if (lt < s + VIG[i][0]) return [i, (lt - s) / VIG[i][0], s]; s += VIG[i][0]; } return [VIG.length, 0, s]; }
  function cam(lt) {
    if (lt < VSTART) return { x: 960, y: 560, s: mix(1.0, 1.08, ss(0, VSTART, lt)) };
    const [i, e] = vigAt(lt); if (i < VIG.length) return VIG[i][2](lt + t0, e);
    return handheld({ x: mix(960, 900, ss(VSTART + 23.6, 43, lt)), y: 600, s: mix(1.0, 1.2, ss(VSTART + 23.6, 43, lt)) }, lt + t0, 0.4);
  }
  function back(ctx, lt, a) {
    const c = cam(lt), warm = lt > VSTART - 0.5;
    if (lt < VSTART || lt >= VSTART + 23.6) { nightSky(ctx, warm ? "#140e18" : "#0a1020", warm ? "#2a1a2e" : "#1c2340", 575, c); dawnBand(ctx, c, mix(0.6, 1, ss(0, 43, lt)), 1); crossLights(ctx, c, rgb(warm ? DREAM.env : NOW.env), 0.5); crossSignal(ctx, c, ss(0, 2.2, lt), 1); }
    else { nightSky(ctx, "#1a1016", "#39212a", 640, c); dawnBand(ctx, c, 0.9, 1); }
    ctx.globalAlpha = 1;
  }
  function pts(P, lt) {
    const c = cam(lt), t = lt + t0;
    if (lt < VSTART) {
      // 晨光重击：声波炸开，在对面拼出他
      drawCross(P, c, t, mix3pal(lt), 0.9);
      const [fx, fy] = ap(camT(c), PHONE[0], PHONE[1] - 24);
      drawSide(P, "him", pose({ head: -0.04, sR: 0.1, eR: 0.2 }), HIM_FAR[0], HIM_FAR[1], HIM_FAR[2], 1, c, DREAM.him, ss(0.4, 2.6, lt), t, { coat: 0, dim: 0.7, post: gatherFrom((lt - 0.2) / 2.2, fx, fy) });
      // 她站起身，看过去
      const rise = ss(2.4, 4.2, lt);
      drawSide(P, "her", lerpPose(SIT_PHONE, pose({ head: -0.05, sR: 0.12, eR: 0.2 }), rise), 760, CROSS.near + 40, 1.15, 1, c, NOW.her, 1, t, { coat: 1, ground: false });
      const [gx, gy] = ap(camT(c), HIM_FAR[0], HIM_FAR[1] - 60); glow(ctx, gx, gy, 90 * c.s, "255,200,140", 0.4 * ss(0.5, 2.6, lt));
    } else if (lt < VSTART + 23.6) {
      const [i, e] = vigAt(lt);
      VIG[i][1](P, ctx, c, t, e);
    } else {
      // 他走过斑马线，朝她伸出手
      const e = (lt - VSTART - 23.6) / (43 - VSTART - 23.6);
      drawCross(P, c, t, DREAM, 0.9);
      const hx = mix(1080, 980, ss(0, 0.8, e)), hy = mix(CROSS.far + 120, CROSS.near - 30, ss(0, 0.85, e)), hs = mix(0.64, 0.95, ss(0, 0.85, e));
      const walking = e < 0.82, reach = ss(0.8, 1, e);
      const g = drawSide(P, "him", walking ? walk((e * 4) % 1, 0.85) : pose({ head: 0.05, sR: mix(0.2, 1.5, reach), eR: mix(0.3, 0.3, reach) }), hx, hy, hs, -1, c, DREAM.him, 1, t, { coat: 0 });
      // 她也转向他，伸手
      drawSide(P, "her", pose({ head: -0.05, sR: mix(0.12, 1.3, reach), eR: mix(0.2, 0.35, reach) }), 800, CROSS.near + 20, 1.1, 1, c, DREAM.her, 1, t, { coat: 1, ground: false });
      if (reach > 0) { const [gx, gy] = ap(camT(c), mix(hx, 860, 0.5), CROSS.near - 70); glow(ctx, gx, gy, 40 * c.s, "255,220,160", 0.5 * reach); }
    }
  }
  function fore(ctx, lt, a) {
    const t = lt + t0;
    // 晨光重击的一闪
    if (lt < 1.4) { ctx.fillStyle = `rgba(255,224,180,${0.55 * Math.exp(-lt * 3.5)})`; ctx.fillRect(0, 0, W, H); }
    if (lt < VSTART) motes(ctx, t, 50, "255,210,150", 0.2, 13, { vy: -3 });
    else motes(ctx, t, 44, "255,220,170", 0.16, 14, { vy: -2 });
    // "如果那天" 字幕
    if (lt >= VSTART - 0.3 && lt < VSTART + 4) caption(ctx, "如果那天，你没有走——", ss(VSTART, VSTART + 0.8, lt) * (1 - ss(VSTART + 3, VSTART + 4, lt)), 160);
    vignette(ctx, 0.46); bars(ctx, 60);
  }
  // 重击那一下，路口从冷蓝瞬间染成暖金
  function mix3pal(lt) { const e = ss(0, 1.2, lt); return { env: mix3(NOW.env, DREAM.env, e), hi: mix3(NOW.hi, DREAM.hi, e), her: NOW.her }; }
  return { t0, t1: 251.6, back, pts, fore, cam };
})();

// 尾声的片名 + 署名（清晰层）
function endCard(ctx, a, credit) {
  if (a <= 0.003) return; ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 20;
  ctx.fillStyle = "rgba(245,238,228,0.96)"; ctx.font = `400 108px ${SERIF}`; ctx.letterSpacing = "26px"; ctx.fillText("迟到的消息", 960 + 13, 486);
  ctx.font = `400 26px ${SERIF}`; ctx.letterSpacing = "12px"; ctx.fillStyle = "rgba(220,214,206,0.8)"; ctx.fillText("THE LATE MESSAGE", 960 + 6, 566);
  if (credit > 0) { ctx.globalAlpha = a * credit; ctx.shadowBlur = 8; ctx.letterSpacing = "2px"; ctx.font = `300 20px ${UI}`; ctx.fillStyle = "rgba(210,205,200,0.7)"; ctx.fillText("AI 生成动画 · 音乐 Dusk Till Dawn — ZAYN", 960, 650); }
  ctx.letterSpacing = "0px"; ctx.restore();
}

// ====================================================================
// 镜头 I（251.6–266，outro）：他们的手快碰到的那一刻，他化成光点，随日出升上天空。
// 路口只剩她一个人，绿灯亮着，她走了过去。片名浮现。
// ====================================================================
const scI = (() => {
  const t0 = 251.6, DISS = 1.6, WALK0 = 6.5;
  function cam(lt) { const g = ss(0, 14, lt); return handheld({ x: mix(900, 1000, g), y: mix(600, 560, g), s: mix(1.18, 1.0, ss(2, 8, lt)) }, lt + t0, 0.25 * (1 - ss(6, 10, lt))); }
  function back(ctx, lt, a) {
    const c = cam(lt); nightSky(ctx, "#1a1220", "#4a2c30", 575, c);
    dawnBand(ctx, c, mix(0.9, 1.4, ss(0, 14, lt)), 1);
    // 日出的光晕，越来越亮
    const [sx, sy] = ap(camT(c), 1120, 400); glow(ctx, sx, sy, mix(120, 520, ss(0, 12, lt)) * c.s, "255,200,140", mix(0.2, 0.5, ss(1, 10, lt)));
    crossLights(ctx, c, rgb(DREAM.env), 0.4); crossSignal(ctx, c, 1, 1);     // 绿灯
    ctx.globalAlpha = 1;
  }
  function pts(P, lt) {
    const c = cam(lt), t = lt + t0;
    drawCross(P, c, t, DREAM, mix(0.9, 0.4, ss(8, 14, lt)));
    // 他：伸着手，然后从指尖开始化成光点，向上随日出升走
    const diss = clamp((lt - 0.4) / DISS);
    if (diss < 1) drawSide(P, "him", pose({ head: 0.05, sR: 1.5, eR: 0.3 }), 980, CROSS.near - 30, 0.95, -1, c, DREAM.him, 1, t, { coat: 0, post: dissolver(diss, t, 0.15, -1.2, 420) });
    // 升起的光点（他化成的光，飘向天空的日出）
    if (lt > 0.4) { const r = rng(777), n = Math.floor(1400 * (1 - ss(3.5, 6, lt))); const [bx, by] = ap(camT(c), 975, CROSS.near - 150); for (let i = 0; i < n; i++) { const life = r(), age = ((lt - 0.6) * 0.33 + life) % 1; const x = bx + (r() - 0.5) * 220 * c.s + Math.sin(t * 0.8 + life * 9) * 30, y = by - age * (380 + 200 * life) * c.s; P.push(x, y, 1, 0.84, 0.56, (1 - age) * (1 - ss(4, 6, lt)) * 0.7); } }
    // 她：先伸着手（空），然后收回，望向光，接着走过斑马线
    if (lt < WALK0) {
      const drop = ss(1.8, 3.2, lt);       // 收回手
      drawSide(P, "her", pose({ head: mix(-0.05, -0.18, ss(3, 5, lt)), sR: mix(1.3, 0.14, drop), eR: mix(0.3, 0.25, drop) }), 800, CROSS.near + 20, 1.1, 1, c, DREAM.her, 1, t, { coat: 1, ground: false });
    } else {
      // 走过斑马线，往对面（他站过的地方），越走越远越小
      const e = (lt - WALK0) / (14 - WALK0), hx = mix(840, 1040, e), hy = mix(CROSS.near + 20, CROSS.far + 90, ss(0, 1, e)), hs = mix(1.1, 0.6, ss(0, 1, e));
      const ph = (e * 3.2) % 1;
      drawSide(P, "her", walk(ph, 0.75), hx, hy, hs, -1, c, DREAM.her, 1 - ss(0.82, 1, e) * 0.3, t, { coat: 1 });
    }
  }
  function fore(ctx, lt, a) {
    const t = lt + t0;
    if (lt < 1.2) { ctx.fillStyle = `rgba(255,228,188,${0.4 * Math.exp(-lt * 3)})`; ctx.fillRect(0, 0, W, H); }   // 化光那一下的微光
    motes(ctx, t, 50, "255,220,170", 0.18, 17, { vy: -3 });
    vignette(ctx, 0.44); bars(ctx, 60);
    // 片名 + 署名，最后几秒浮现；结尾缓缓黑场
    endCard(ctx, ss(10.5, 12.5, lt), ss(12, 13.5, lt));
    fade(ctx, ss(14.6, 15.2, lt));
  }
  return { t0, t1: 266.0, back, pts, fore, cam };
})();

const ALL = [scA, scB, scC, scD, scE, scF, scG, scH, scI];
