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

const ALL = [scA, scB, scC, scD, scE];
