// 场景③ 夜班公交：从过道看向车窗。靠窗的座位空着。
// 窗外城市的灯拉成光带，路灯一盏盏扫过车厢；只有路灯扫过的那一下，玻璃上才看得见她的侧脸。单位是毫米，地板 y = 0。
const BUSW = { x0: -820, x1: 820, y0: -1650, y1: -950, z: 700 };
const BUSC = [[BUSW.x0, BUSW.y0, BUSW.z], [BUSW.x1, BUSW.y0, BUSW.z], [BUSW.x1, BUSW.y1, BUSW.z], [BUSW.x0, BUSW.y1, BUSW.z]];
const BUS_V = 4200, LAMP_GAP = BUS_V * 0.86 * 3;      // 车速（毫米/秒）；路灯间隔 = 三拍经过一盏
// 座椅侧面的轮廓（面朝车头 +x）：坐垫、往后仰的靠背、头枕
const SEATP = [[215, -395], [235, -420], [232, -455], [215, -475], [150, -482], [40, -478], [-120, -468], [-215, -462], [-240, -480], [-250, -560], [-262, -680], [-285, -820], [-310, -960], [-330, -1080], [-340, -1150],
  [-338, -1170], [-342, -1200], [-340, -1290], [-352, -1322], [-380, -1336], [-420, -1334], [-452, -1316], [-462, -1282], [-460, -1200], [-450, -1172], [-452, -1150], [-445, -1050], [-428, -900], [-408, -760], [-390, -620], [-375, -500],
  [-362, -420], [-335, -385], [-200, -378], [0, -380]];
const SEAT_Z0 = 260, SEAT_Z1 = 660;
let BF, BSEAT, BREF, BBD, BPOLE, BFAR, BMID, BCAR;
function buildBus() {
  const r = rng(301);
  // 窗框：上下两条横杆、中间一根立柱、两边的立柱；窗下的车厢壁板、行李架的边
  const f = [], line = (ax, ay, az, bx, by, bz, n, b, th = 10) => { for (let i = 0; i < n; i++) { const u = r(); f.push(mix(ax, bx, u) + (r() - 0.5) * th, mix(ay, by, u) + (r() - 0.5) * th, mix(az, bz, u) + (r() - 0.5) * 12, b); } };
  line(BUSW.x0 - 40, BUSW.y0, BUSW.z, BUSW.x1 + 40, BUSW.y0, BUSW.z, 4200, 0.5, 22); line(BUSW.x0 - 40, BUSW.y1, BUSW.z, BUSW.x1 + 40, BUSW.y1, BUSW.z, 4200, 0.55, 22);
  line(0, BUSW.y0, BUSW.z, 0, BUSW.y1, BUSW.z, 1500, 0.45, 30); line(BUSW.x0, BUSW.y0, BUSW.z, BUSW.x0, BUSW.y1, BUSW.z, 1300, 0.4, 40); line(BUSW.x1, BUSW.y0, BUSW.z, BUSW.x1, BUSW.y1, BUSW.z, 1300, 0.4, 40);
  line(-1700, -880, BUSW.z, 1700, -880, BUSW.z, 2600, 0.16, 6);                                   // 窗下的扶手条
  line(-1700, -1890, 560, 1700, -1890, 560, 3200, 0.32, 8); line(-1700, -1905, 380, 1700, -1905, 380, 2200, 0.14, 8);   // 行李架
  for (let i = 0; i < 9000; i++) f.push(mix(-1700, 1700, r()), mix(-930, -20, r()), BUSW.z + (r() - 0.5) * 8, 0.03);
  BF = new Float32Array(f);
  // 座椅：靠近镜头的那一面画出侧面轮廓（勾边亮、面很淡），远的一面只勾边，中间的厚度稀疏地连起来
  const s = [], per = [];
  for (let i = 0; i < SEATP.length; i++) { const a = SEATP[i], b = SEATP[(i + 1) % SEATP.length]; per.push(Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const L = per.reduce((x, y) => x + y, 0), onEdge = u => { let d = u * L, i = 0; while (d > per[i]) { d -= per[i]; i++; } const a = SEATP[i], b = SEATP[(i + 1) % SEATP.length], t = d / per[i]; return [mix(a[0], b[0], t), mix(a[1], b[1], t)]; };
  const flat = SEATP.flat();
  for (let i = 0; i < 9000; i++) { const [x, y] = onEdge(r()); s.push(x + (r() - 0.5) * 5, y + (r() - 0.5) * 5, SEAT_Z0, 0.55); }
  for (let i = 0; i < 5000; i++) { const [x, y] = onEdge(r()); s.push(x + (r() - 0.5) * 5, y + (r() - 0.5) * 5, SEAT_Z1, 0.12); }
  for (let i = 0; i < 6000; i++) { const [x, y] = onEdge(r()); s.push(x, y, mix(SEAT_Z0, SEAT_Z1, r()), 0.07); }
  for (let n = 0; n < 9000;) { const x = mix(-465, 240, r()), y = mix(-1335, -375, r()); if (!inPoly(x, y, flat)) continue; s.push(x, y, SEAT_Z0 + 2, 0.045); n++; }
  for (let i = 0; i < 1600; i++) { const y = -r() * 378, x = mix(-30, 30, r()) + (y > -40 ? mix(-60, 60, r()) : 0); s.push(x, y, SEAT_Z0 + 30, 0.28); }   // 靠过道的椅腿
  BSEAT = new Float32Array(s);
  // 她在玻璃上的倒影：额头、鼻子、嘴唇、下巴的那条线最亮（路灯扫过时被照到），头发和肩膀淡一些。她坐在镜头右边、面朝车头，倒影面朝右
  const prof = c => { c.beginPath(); c.moveTo(70, -252); c.quadraticCurveTo(96, -232, 98, -208); c.quadraticCurveTo(104, -186, 108, -174); c.lineTo(104, -160); c.quadraticCurveTo(118, -140, 128, -124); c.quadraticCurveTo(122, -112, 108, -110);
    c.quadraticCurveTo(116, -102, 113, -96); c.quadraticCurveTo(108, -90, 112, -84); c.quadraticCurveTo(110, -76, 101, -70); c.quadraticCurveTo(108, -58, 104, -48); c.quadraticCurveTo(90, -32, 68, -28); c.quadraticCurveTo(60, -10, 64, 20); };
  const hair = c => { c.beginPath(); c.moveTo(70, -252); c.quadraticCurveTo(10, -302, -72, -274); c.quadraticCurveTo(-132, -240, -132, -150); c.quadraticCurveTo(-136, -40, -112, 34); };   // 齐肩的头发
  const shoulder = c => { c.beginPath(); c.moveTo(64, 20); c.quadraticCurveTo(80, 52, 200, 74); c.moveTo(-50, -20); c.quadraticCurveTo(-46, 30, -90, 50); c.quadraticCurveTo(-150, 62, -230, 90); };
  const RB = [-260, -320, 520, 440], rf = [], add = (cl, b) => { for (let i = 0; i < cl.n; i++) rf.push(440 + cl.x[i], -1180 + cl.y[i], BUSW.z - 4, b); };
  add(cloud(c => { c.lineWidth = 3.5; prof(c); c.stroke(); }, RB, 0.9, 41), 0.5);
  add(cloud(c => { c.lineWidth = 2.5; hair(c); c.stroke(); }, RB, 0.7, 43), 0.2);
  add(cloud(c => { c.filter = "blur(8px)"; c.beginPath(); c.moveTo(70, -252); c.quadraticCurveTo(10, -302, -72, -274); c.quadraticCurveTo(-132, -240, -132, -150); c.quadraticCurveTo(-136, -40, -112, 34); c.lineTo(-62, 30); c.quadraticCurveTo(-40, -60, -30, -150); c.quadraticCurveTo(0, -225, 70, -252); c.fill(); c.filter = "none"; c.lineWidth = 1.4; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(-20 - k * 18, -250 + k * 6); c.quadraticCurveTo(-90 - k * 6, -170, -96 - k * 7, 10 + k * 4); c.stroke(); } }, RB, 0.22, 44), 0.09);
  add(cloud(c => { c.lineWidth = 2.5; shoulder(c); c.stroke(); }, RB, 0.6, 47), 0.16);
  add(cloud(c => { prof(c); c.lineTo(-40, 20); c.lineTo(-58, -24); c.quadraticCurveTo(-80, -20, -96, -40); c.quadraticCurveTo(-122, -90, -126, -160); c.quadraticCurveTo(-128, -240, -70, -272); c.quadraticCurveTo(10, -300, 70, -252); c.fill(); }, RB, 0.12, 53), 0.05);
  BREF = new Float32Array(rf);
  // 玻璃上零星的雨珠（路灯扫过时亮一下）
  const bd = []; for (let i = 0; i < 700; i++) bd.push(mix(BUSW.x0 + 10, BUSW.x1 - 10, r()), mix(BUSW.y0 + 10, BUSW.y1 - 10, r()), 0.1 + r() * 0.3, r()); BBD = new Float32Array(bd);
  // 扶杆：镜头右边一根竖杆，侧边亮
  const pl = []; for (let i = 0; i < 7000; i++) { const ph = r() * TAU; pl.push(560 + Math.cos(ph) * 18, -r() * 2300, -200 + Math.sin(ph) * 18, 0.06 + 0.6 * Math.pow(Math.abs(Math.cos(ph)), 6)); } BPOLE = new Float32Array(pl);
  // 窗外：远处的城市光斑（慢）、中景楼里的灯（快，拉成光带）、车灯
  const far = []; for (let i = 0; i < 320; i++) far.push(r() * 30000, mix(-5200, -700, Math.pow(r(), 0.8)), mix(9000, 16000, r()), 60 + r() * 140, r() < 0.6 ? 0 : r() < 0.6 ? 1 : 2); BFAR = new Float32Array(far);
  const mid = []; for (let b = 0; b < 26; b++) { const bx = b * 1300 + r() * 400, h = 1500 + r() * 3200, z = mix(3200, 5200, r()); for (let yy = -h; yy < -300; yy += 260) for (let xx = bx; xx < bx + 900; xx += 230) if (r() < 0.32) mid.push(xx, yy, z, r() < 0.7 ? 0 : 1); } BMID = new Float32Array(mid);
  const car = []; for (let i = 0; i < 18; i++) car.push(r() * 40000, i % 2, 2600 + (i % 2) * 900, 0.6 + r() * 0.8); BCAR = new Float32Array(car);
}
const FOG_BUS = [1500, 5000, 9000];
// 路灯经过时的扫光强度（0..1）
function lampSweep(E) { const p = (E * BUS_V) % LAMP_GAP, d = (p - LAMP_GAP * 0.5) / 2200; return Math.exp(-d * d * 2.2); }
// 座椅在屏幕上挡住的范围（窗外的光斑不从椅子里透出来）
function seatOcc(c) {
  const f = [SEAT_Z0, SEAT_Z1].map(z => { const p = []; for (const [x, y] of SEATP) { if (!proj(c, x, y, z)) return null; p.push(PX, PY); } return p; }); if (!f[0] || !f[1]) return [];
  const out = [f[0], f[1]], n = SEATP.length;
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; out.push([f[0][i * 2], f[0][i * 2 + 1], f[0][j * 2], f[0][j * 2 + 1], f[1][j * 2], f[1][j * 2 + 1], f[1][i * 2], f[1][i * 2 + 1]]); }
  return out;
}
const BUS = {
  cam(E) { const j = Math.sin(E * 31) * 1.4 + Math.sin(E * 17.3) * 1.0; return pathCam(E, [[27, [260, -1150 + j, -1080]], [S.dip + 3, [200, -1135 + j, -900]]], [[27, [-20, -1060, 700]], [S.dip + 3, [-40, -1050, 700]]]); },
  pts(B, E, c, cams) {
    FOG = FOG_BUS;
    const sw = lampSweep(E), lit = 1 + 1.6 * sw, wr = mix(0.55, 1, sw), wg = mix(0.62, 0.86, sw), wb = mix(0.9, 0.62, sw);
    for (let i = 0; i < BF.length; i += 4) P3(B, c, BF[i], BF[i + 1], BF[i + 2], 0.55, 0.62, 0.85, BF[i + 3] * lit);
    for (let i = 0; i < BSEAT.length; i += 4) P3(B, c, BSEAT[i], BSEAT[i + 1], BSEAT[i + 2], wr, wg, wb, BSEAT[i + 3] * (0.8 + 1.6 * sw));
    for (let i = 0; i < BPOLE.length; i += 4) P3(B, c, BPOLE[i], BPOLE[i + 1], BPOLE[i + 2], wr, wg, wb, BPOLE[i + 3] * (0.7 + 1.4 * sw));
    // 倒影：平时几乎看不见，路灯扫过的那一下脸被照亮，才在玻璃上浮出来
    const rv = 0.1 + 1.2 * sw;
    for (let i = 0; i < BREF.length; i += 4) P3(B, c, BREF[i], BREF[i + 1], BREF[i + 2], mix(0.7, 1, sw), mix(0.8, 0.88, sw), mix(1, 0.75, sw), BREF[i + 3] * rv);
    for (let i = 0; i < BBD.length; i += 4) P3(B, c, BBD[i], BBD[i + 1], BUSW.z - 2, 0.8, 0.86, 1, BBD[i + 2] * (0.35 + 1.4 * sw));
    // 窗外的一切只在窗里出现，被座椅挡住的地方不画
    CLIP = screenBox(c, BUSC); OCC = seatOcc(c);
    if (CLIP) {
      for (let k = 0; k < BFAR.length; k += 5) { const x = ((BFAR[k] - E * BUS_V * 0.08) % 30000 + 30000) % 30000 - 15000; wspr(c, x, BFAR[k + 1], BFAR[k + 2], BFAR[k + 3], 0.8, TI(["warm", "cool", "amber"][BFAR[k + 4]]), null, 0, 0, 0, 1, 0, 60); }
      for (let k = 0; k < BMID.length; k += 4) { const x = ((BMID[k] - E * BUS_V) % 33800 + 33800) % 33800 - 16900; if (Math.abs(x) > 9000) continue; wspr(c, x, BMID[k + 1], BMID[k + 2], 55, 0.75, BMID[k + 3] ? TI("cool") : TI("warm"), c, x + BUS_V / 24, BMID[k + 1], BMID[k + 2]); }
      for (let k = 0; k < BCAR.length; k += 4) { const v = BCAR[k + 1] ? 0.35 : -2.1, x = ((BCAR[k] + E * BUS_V * v) % 40000 + 40000) % 40000 - 20000; if (Math.abs(x) > 8000) continue; for (const dz of [-100, 100]) wspr(c, x, -700, BCAR[k + 2] * 1.6 + dz, 70, 0.9, v > 0 ? TI("red") : TI("white"), c, x - v * BUS_V / 18, -700, BCAR[k + 2] * 1.6 + dz); }
      // 路灯：每三拍经过一盏，拖出长长的光
      const p = (E * BUS_V) % LAMP_GAP, lx = LAMP_GAP * 0.5 - p;
      for (const off of [0, LAMP_GAP, -LAMP_GAP]) wspr(c, lx + off, -1880, 2600, 120, 1.0, TI("sun"), c, lx + off + BUS_V / 30, -1880, 2600, 1, 0, 140);
    }
    CLIP = null; OCC = null;
    // 扶杆上的下车按钮，一点红
    wspr(c, 542, -1320, -200, 14, 0.7, TI("red"));
  },
  bg(ctx, E, c, a) {
    ctx.globalAlpha = a;
    ctx.fillStyle = "#03050c"; ctx.fillRect(0, 0, W, H);
    const box = screenBox(c, BUSC);
    if (box) { const sg = ctx.createLinearGradient(0, box[1], 0, box[3]); sg.addColorStop(0, "#050a18"); sg.addColorStop(1, "#141d38"); ctx.fillStyle = sg; quadPath(ctx, c, BUSC); ctx.fill(); }
    // 座椅是实的：挡住窗里的天光
    ctx.fillStyle = "#04060d"; for (const p of seatOcc(c)) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]); ctx.closePath(); ctx.fill(); }
    // 路灯扫过车厢的一道光（从右往左）
    const sw = lampSweep(E), p = (E * BUS_V) % LAMP_GAP, lx = LAMP_GAP * 0.5 - p;
    if (sw > 0.02 && proj(c, lx * 0.35, -700, 450)) { ctx.globalCompositeOperation = "lighter"; const g = ctx.createLinearGradient(PX - 420, 0, PX + 420, 0); g.addColorStop(0, "rgba(255,220,170,0)"); g.addColorStop(0.5, `rgba(255,220,170,${0.14 * sw * a})`); g.addColorStop(1, "rgba(255,220,170,0)"); ctx.fillStyle = g; ctx.fillRect(PX - 420, 0, 840, H); ctx.globalCompositeOperation = "source-over"; }
    ctx.globalAlpha = 1;
  },
  over(ctx, E, c, a) {},
};
