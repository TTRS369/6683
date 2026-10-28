// 4 个浏览器页面并行逐帧渲染，各自编码成一段 mp4，最后无损拼接
const { chromium } = require('playwright');
const { spawn } = require('child_process');
// 用法：node render.js <页面.html> <输出.mp4> [时间轴.json]
const FPS = +(process.env.FPS || 24), WORKERS = +(process.env.WORKERS || 4);
const path = require('path'), fs = require('fs');
const PAGE = path.resolve(process.argv[2] || path.join(__dirname, 'eternity.html'));
const OUT = path.resolve(process.argv[3] || PAGE.replace(/\.html$/, '.mp4'));
const TIMELINE = process.argv[4] ? fs.readFileSync(process.argv[4], 'utf8') : null;
const DURATION = TIMELINE ? JSON.parse(TIMELINE).duration : 116, TOTAL = Math.ceil(FPS * DURATION);
const SEG = fs.mkdtempSync(path.join(require('os').tmpdir(), 'eternity-'));
(async () => {
  const b = await chromium.launch();
  const chunk = Math.ceil(TOTAL / WORKERS);
  const t0 = Date.now();
  await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
    if (TIMELINE) await p.addInitScript(`window.TIMELINE = ${TIMELINE};`);
    await p.goto('file://' + PAGE);
    await p.evaluate(() => window.ready);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', process.env.PRESET || 'medium', '-crf', process.env.CRF || '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), path.join(SEG, `seg${w}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise(r => ff.on('close', r));
    const end = Math.min(TOTAL, (w + 1) * chunk);
    for (let f = w * chunk; f < end; f++) {
      const url = await p.evaluate(([f, fps]) => { renderAt(f / fps); return document.getElementById('c').toDataURL('image/jpeg', 0.94); }, [f, FPS]);
      if (!ff.stdin.write(Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if (w === 0 && f % 120 === 0) console.log(`worker0 ${f - w * chunk}/${end - w * chunk} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end(); await done;
  }));
  await b.close();
  fs.writeFileSync(path.join(SEG, 'list.txt'), Array.from({ length: WORKERS }, (_, w) => `file 'seg${w}.mp4'`).join('\n'));
  await new Promise(r => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(SEG, 'list.txt'), '-c', 'copy', '-movflags', '+faststart', OUT], { stdio: 'inherit' }).on('close', r));
  console.log('done in', ((Date.now() - t0) / 1000).toFixed(0), 's');
})();
