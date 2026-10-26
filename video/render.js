// 4 个浏览器页面并行逐帧渲染，各自编码成一段 mp4，最后无损拼接
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const FPS = 24, DURATION = 116, TOTAL = FPS * DURATION, WORKERS = 4;
const path = require('path'), fs = require('fs');
const OUT = process.argv[2] || path.join(__dirname, 'eternity.mp4');
const SEG = fs.mkdtempSync(path.join(require('os').tmpdir(), 'eternity-'));
(async () => {
  const b = await chromium.launch();
  const chunk = Math.ceil(TOTAL / WORKERS);
  const t0 = Date.now();
  await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
    await p.goto('file://' + path.join(__dirname, 'eternity.html'));
    await p.evaluate(() => window.ready);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), path.join(SEG, `seg${w}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise(r => ff.on('close', r));
    const end = Math.min(TOTAL, (w + 1) * chunk);
    for (let f = w * chunk; f < end; f++) {
      const url = await p.evaluate(f => { renderAt(f / 24); return document.getElementById('c').toDataURL('image/jpeg', 0.94); }, f);
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
