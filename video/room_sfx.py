"""《A Little Room for You》音效轨：全部用程序合成，按时间轴里的段落和事件摆放。

用法：python room_sfx.py room.timeline.json room_sfx.wav
"""
import json
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
tl = json.load(open(sys.argv[1], encoding="utf8"))
S, EV, DUR = tl["sections"], tl["events"], tl["duration"]
N = int(DUR * SR)
out = np.zeros((N, 2), np.float32)
rng = np.random.default_rng(7)
FADE = 1.4


def db(x):
    return 10 ** (x / 20)


def filt(x, kind, f):
    sos = butter(2, f, btype=kind, fs=SR, output="sos")
    return sosfilt(sos, x).astype(np.float32)


def noise(sec):
    return rng.standard_normal(int(sec * SR)).astype(np.float32)


def place(sig, t, gain_db=0.0, pan=0.0):
    """把单声道 sig 放在 t 秒处；pan -1 左 ~ 1 右（等功率声像）。"""
    i = int(t * SR)
    if i >= N or i + len(sig) <= 0:
        return
    a, b = max(0, i), min(N, i + len(sig))
    s = sig[a - i:b - i] * db(gain_db)
    ang = (pan + 1) * np.pi / 4
    out[a:b, 0] += s * np.cos(ang)
    out[a:b, 1] += s * np.sin(ang)


def bed(sig_fn, a, b, gain_db, pan=0.0, fade=FADE):
    """一段铺底声：从 a 到 b，两头淡入淡出（和画面转场一样长）。"""
    a, b = max(0.0, a - fade / 2), min(DUR, b + fade / 2)
    sig = sig_fn(b - a)
    n = len(sig)
    env = np.ones(n, np.float32)
    k = int(fade * SR)
    env[:k] = np.linspace(0, 1, min(k, n))[:n] if n else env[:k]
    env[-k:] = np.minimum(env[-k:], np.linspace(1, 0, k)[-n:])
    place(sig * env, a, gain_db, pan)


def decay(sec, tau):
    t = np.arange(int(sec * SR)) / SR
    return np.exp(-t / tau).astype(np.float32)


# ---------- 声音素材 ----------
def tick(high):
    s = filt(noise(0.03), "bandpass", [2600, 4200] if high else [1500, 2600]) * decay(0.03, 0.004)
    return s * 3


def chirp():
    d = rng.uniform(0.06, 0.13)
    t = np.arange(int(d * SR)) / SR
    f0, f1 = rng.uniform(2800, 4200), rng.uniform(4200, 6000)
    f = np.linspace(f0, f1, len(t)) + 300 * np.sin(2 * np.pi * rng.uniform(25, 45) * t)
    env = np.sin(np.pi * t / d) ** 2
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * env).astype(np.float32)


def birds(sec, density=0.45):
    s = np.zeros(int(sec * SR), np.float32)
    t = rng.uniform(0, 1.5)
    while t < sec - 0.5:
        for k in range(rng.integers(2, 5)):
            c = chirp()
            i = int((t + k * rng.uniform(0.12, 0.2)) * SR)
            s[i:i + len(c)] += c[:max(0, len(s) - i)]
        t += rng.exponential(1 / density) + 0.6
    return s * 0.5


def rain(sec, muffled=False):
    s = filt(noise(sec), "lowpass", 1800 if muffled else 6500) * (0.25 if muffled else 0.35)
    drops = np.zeros_like(s)
    for _ in range(int(sec * (25 if muffled else 60))):
        i = rng.integers(0, len(s) - 800)
        drops[i:i + 400] += filt(noise(400 / SR), "highpass", 2500) * decay(400 / SR, 0.002) * rng.uniform(0.2, 0.8)
    if muffled:
        drops = filt(drops, "lowpass", 2500)
    return s + drops


def car(direction):
    d = 4.0
    t = np.arange(int(d * SR)) / SR - d / 2
    env = np.exp(-(t / 0.7) ** 2)
    hiss = filt(noise(d), "bandpass", [300, 3000]) * env
    hum = filt(np.sign(np.sin(2 * np.pi * (70 + 6 * np.tanh(-t)) * t)).astype(np.float32), "lowpass", 300) * env * 0.3
    return hiss + hum, direction


def murmur(sec):
    s = np.zeros(int(sec * SR), np.float32)
    t = np.arange(len(s)) / SR
    for k in range(6):
        band = filt(noise(sec), "bandpass", [250 + k * 120, 600 + k * 180])
        s += band * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(0.2, 0.7) * t + k)).astype(np.float32)
    return s * 0.25


def beep():
    t = np.arange(int(0.12 * SR)) / SR
    return (np.sin(2 * np.pi * 1850 * t) * np.minimum(1, (0.12 - t) * 80) * np.minimum(1, t * 400)).astype(np.float32) * 0.5


def wind(sec, lo=200, hi=900):
    s = filt(noise(sec), "bandpass", [lo, hi])
    t = np.arange(len(s)) / SR
    return s * (0.4 + 0.6 * np.sin(2 * np.pi * 0.08 * t + 1) ** 2).astype(np.float32)


def footstep():
    thud = filt(noise(0.06), "lowpass", 350) * decay(0.06, 0.012) * 2.5
    crunch = filt(noise(0.09), "highpass", 2800) * decay(0.09, 0.02) * rng.uniform(0.3, 0.7)
    n = max(len(thud), len(crunch))
    return np.pad(thud, (0, n - len(thud))) + np.pad(crunch, (0, n - len(crunch)))


def crickets(sec):
    s = np.zeros(int(sec * SR), np.float32)
    t = 0.3
    while t < sec - 0.3:
        pulse_t = np.arange(int(0.012 * SR)) / SR
        pulse = np.sin(2 * np.pi * 4600 * pulse_t) * np.sin(np.pi * pulse_t / 0.012)
        for k in range(3):
            i = int((t + k * 0.03) * SR)
            s[i:i + len(pulse)] += pulse[:max(0, len(s) - i)]
        t += rng.uniform(0.5, 1.1)
    return s * 0.4


def key_tap():
    return filt(noise(0.008), "bandpass", [1800, 4000]) * decay(0.008, 0.0015) * 2


def send_whoosh():
    d = 0.4
    t = np.arange(int(d * SR)) / SR
    s = filt(noise(d), "bandpass", [900, 3500]) * np.sin(np.pi * t / d) ** 2
    return s


def wipe():
    d = 0.6
    t = np.arange(int(d * SR)) / SR
    return filt(noise(d), "bandpass", [1200, 4500]) * (np.sin(np.pi * t / d) ** 1.5).astype(np.float32) * 0.6


def clink():
    t = np.arange(int(0.6 * SR)) / SR
    s = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, a, d in [(2650, 1, 0.12), (4120, 0.6, 0.08), (6300, 0.3, 0.05)])
    thump = filt(noise(0.04), "lowpass", 500) * decay(0.04, 0.008)
    s[:len(thump)] += thump
    return s.astype(np.float32) * 0.5


# ---------- 按段落摆放 ----------
# 钟表：屋里的场景每秒一下
for a, b in [(0, S["pre1"][0]), (S["ch1"][0], S["v2"][0]), (S["ch2"][0], S["fin"][1])]:
    t = np.ceil(a)
    while t < b:
        place(tick(int(t) % 2 == 0), t, -30, pan=-0.35)
        t += 1
# 早晨、春天、尾声的鸟叫
bed(lambda d: birds(d), 0, S["pre1"][0], -24, pan=0.4)
bed(lambda d: birds(d, 0.35), S["ch2"][0] + 0.62 * (S["ch2"][1] - S["ch2"][0]), S["bridge"][0], -27, pan=0.4)
bed(lambda d: birds(d, 0.6), S["fin"][0], S["outro"][0], -23, pan=0.45)
bed(lambda d: birds(d, 0.25), S["outro"][0], DUR, -30, pan=0.2)
# 窗外：雨渐渐下起来，回到屋里后变闷、再停
bed(lambda d: rain(d), S["pre1"][0] + 3, S["ch1"][0], -22)
bed(lambda d: rain(d, True), S["ch1"][0], S["ch1"][0] + 0.55 * (S["ch1"][1] - S["ch1"][0]), -22, fade=3)
bed(lambda d: filt(noise(d), "lowpass", 400) * 0.3, S["pre1"][0], S["ch1"][0], -26)        # 远处的城市底噪
for i, tc in enumerate(EV["cars"]):
    sig, direction = car(1 if i % 2 == 0 else -1)
    # 车从一侧开向另一侧：前半段在起始侧，后半段在另一侧
    half = len(sig) // 2
    place(sig[:half], tc - 2.0, -16, pan=-0.7 * direction)
    place(sig[half:], tc, -16, pan=0.7 * direction)
# 超市：人声嘈杂和扫码声；他回头的那一刻，声音全部安静下来
hush_a, hush_b = EV["turn"], EV["turn"] + 3.8
def store_bed(d):
    s = murmur(d)
    tt = np.arange(len(s)) / SR + max(0.0, S["v2"][0] - FADE / 2)
    duck = 1 - np.clip(np.minimum((tt - hush_a) / 0.5, (hush_b - tt) / 0.6), 0, 1)
    return s * duck.astype(np.float32)
bed(store_bed, S["v2"][0], S["pre2"][0], -20)
t = S["v2"][0] + 1.2
while t < S["pre2"][0] - 0.5:
    if not (hush_a - 0.3 < t < hush_b):
        place(beep(), t, -26, pan=0.55)
    t += rng.uniform(2.6, 4.2)
# 回家路上：脚步声和秋风
k = 0
while S["pre2"][0] + k * EV["step"] < S["ch2"][0]:
    place(footstep(), S["pre2"][0] + k * EV["step"], -20, pan=-0.05 + 0.1 * (k % 2))
    k += 1
bed(lambda d: wind(d), S["pre2"][0], S["ch2"][0], -24)
# 冬天：窗外的风
bed(lambda d: wind(d, 150, 600), S["ch2"][0], S["ch2"][0] + 0.62 * (S["ch2"][1] - S["ch2"][0]), -27, fade=3)
# 夜里：虫鸣、手机打字、发送
bed(lambda d: crickets(d), S["bridge"][0], S["fin"][0], -32, pan=0.5)
t = EV["typeStart"]
while t < EV["typeEnd"]:
    place(key_tap(), t, -24, pan=0.1)
    t += rng.uniform(0.11, 0.22)
place(send_whoosh(), EV["send"], -24, pan=0.15)
# 春天早上：擦椅子、两只杯子放下、窗外微风
for w in EV["wipes"]:
    place(wipe(), w, -22, pan=0.5)
for i, c in enumerate(EV["cups"]):
    place(clink(), c, -20, pan=0.1 + i * 0.1)
bed(lambda d: wind(d, 300, 1200) * 0.6, S["fin"][0], S["outro"][0], -32)
# 尾声：远处城市的黄昏
bed(lambda d: filt(noise(d), "lowpass", 300) * 0.3, S["outro"][0], DUR, -30)

# 开头淡入、结尾淡出，限制峰值
env = np.ones(N, np.float32)
env[:int(3 * SR)] = np.linspace(0, 1, int(3 * SR))
env[-int(3 * SR):] = np.linspace(1, 0, int(3 * SR))
out *= env[:, None]
peak = np.abs(out).max()
if peak > 0.9:
    out *= 0.9 / peak
wavfile.write(sys.argv[2], SR, (out * 32767).astype(np.int16))
print(f"wrote {sys.argv[2]}: {DUR:.1f}s, peak {20 * np.log10(np.abs(out).max() + 1e-9):.1f} dBFS")
