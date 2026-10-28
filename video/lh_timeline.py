"""《守灯人》MV 的时间轴：故事段落 + 逐帧音乐能量（画面里的浪高、灯光随之起伏）。

段落边界来自对歌曲分频段能量的分析（低音进入、副歌爆发、断电那一下的收、桥段撤低音、
晨光那一记重击）。这里不包含任何歌词。

用法：python lh_timeline.py <歌曲.mp3> <输出.json>
"""
import json
import sys

import librosa
import numpy as np
from scipy.signal import butter, sosfilt

FPS = 24
y, sr = librosa.load(sys.argv[1], sr=44100, mono=True)
dur = len(y) / sr
hop = sr // FPS
frames = int(dur * FPS)


def env(x):
    e = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(frames)])
    e = 20 * np.log10(e + 1e-6)
    lo, hi = np.percentile(e, 5), np.percentile(e, 99)
    return np.clip((e - lo) / (hi - lo), 0, 1).round(3).tolist()


bass = sosfilt(butter(2, 160, "lowpass", fs=sr, output="sos"), y)
# 节拍网格：每拍的时间，以及每小节第一拍（以低音进入那一拍为基准对齐小节）
_, beats = librosa.beat.beat_track(y=librosa.resample(y, orig_sr=sr, target_sr=22050), sr=22050, units="time", start_bpm=89)
phase = int(np.argmin(np.abs(beats - 32.4))) % 4
downbeats = [round(float(b), 3) for i, b in enumerate(beats) if i % 4 == phase]
marks = {"night": 32.4, "storm": 64.9, "dark": 96.7, "climb": 104.0, "beam": 153.0, "bridge": 185.3, "dawn": 208.6, "outro": 251.6}
order = ["dusk"] + list(marks)
starts = [0.0] + list(marks.values())
sections = {k: [round(a, 2), round(b, 2)] for k, a, b in zip(order, starts, starts[1:] + [dur])}
tl = {"duration": round(dur, 2), "fps": FPS, "sections": sections, "energy": env(y), "bass": env(bass),
      "beats": [round(float(b), 3) for b in beats], "downbeats": downbeats}
json.dump(tl, open(sys.argv[2], "w", encoding="utf8"))
print(json.dumps(sections))
