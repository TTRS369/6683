"""《余烬与永恒》解说版的音频：把逐句配音按时间排好，说话时把音乐压低（闪避），
再算出画面要用的逐帧音乐能量。

用法：python ember_audio.py <音乐.mp3> <配音目录> <schedule.json> <输出目录>
输出：narration.wav、mix.wav、ember.timeline.json
"""
import json
import subprocess
import sys

import librosa
import numpy as np
from scipy.io import wavfile

music_path, line_dir, sched_path, out_dir = sys.argv[1:5]
SR, FPS = 48000, 24
DUCK_DB, ATTACK, RELEASE = -7.0, 0.25, 0.7

music, _ = librosa.load(music_path, sr=SR, mono=False)
music = music.T.astype(np.float32)
N = len(music)
dur = N / SR
sched = json.load(open(sched_path, encoding="utf8"))

# 配音轨：剪掉首尾静音后放到排好的时间上，统一响度
voice = np.zeros(N, np.float32)
for i, row in enumerate(sched):
    y, sr = librosa.load(f"{line_dir}/line{i:02d}.wav", sr=None)
    y = y[row["trim"][0]:row["trim"][1]]
    y = librosa.resample(y, orig_sr=sr, target_sr=SR)
    fade = int(0.02 * SR)
    y[:fade] *= np.linspace(0, 1, fade)
    y[-fade:] *= np.linspace(1, 0, fade)
    a = int(row["start"] * SR)
    voice[a:a + len(y)] += y[:N - a]
active = np.abs(voice) > 1e-4
rms = np.sqrt(np.mean(voice[active] ** 2))
voice *= 0.11 / rms

# 闪避：说话期间音乐降低 DUCK_DB，提前 ATTACK 秒开始降，说完 RELEASE 秒内回升
gain = np.ones(N, np.float32)
target = db = 10 ** (DUCK_DB / 20)
for row in sched:
    a, b = row["start"] - ATTACK, row["end"] + RELEASE
    t = np.arange(max(0, int(a * SR)), min(N, int(b * SR))) / SR
    g = np.ones_like(t)
    g = np.where(t < row["start"], 1 - (1 - db) * (t - a) / ATTACK, g)
    g = np.where((t >= row["start"]) & (t <= row["end"]), db, g)
    g = np.where(t > row["end"], db + (1 - db) * (t - row["end"]) / RELEASE, g)
    idx = (t * SR).astype(int)
    gain[idx] = np.minimum(gain[idx], g.astype(np.float32))
mix = music * gain[:, None] + voice[:, None] * 0.95
peak = np.abs(mix).max()
if peak > 0.98:
    mix *= 0.98 / peak
wavfile.write(f"{out_dir}/narration.wav", SR, (voice * 32767).clip(-32768, 32767).astype(np.int16))
wavfile.write(f"{out_dir}/ember_mix.wav", SR, (mix * 32767).astype(np.int16))

# 画面用的逐帧能量：整体响度和低音（0~1）
mono = music.mean(1)
hop = SR // FPS
frames = int(dur * FPS)
def env(x):
    e = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(frames)])
    e = 20 * np.log10(e + 1e-6)
    lo, hi = np.percentile(e, 5), np.percentile(e, 99)
    return np.clip((e - lo) / (hi - lo), 0, 1).round(3).tolist()
from scipy.signal import butter, sosfilt
bass = sosfilt(butter(2, 160, "lowpass", fs=SR, output="sos"), mono)
tl = {"duration": round(dur, 2), "fps": FPS, "lines": [{"start": r["start"], "end": r["end"], "text": r["text"]} for r in sched],
      "energy": env(mono), "bass": env(bass)}
json.dump(tl, open(f"{out_dir}/ember.timeline.json", "w", encoding="utf8"), ensure_ascii=False)
print(f"duration {dur:.2f}s, lines {len(sched)}, frames {frames}")
