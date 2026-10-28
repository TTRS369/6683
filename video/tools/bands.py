# 分频段能量 + 打击乐能量，每 2 秒一行，用来推断乐器进出
import sys, librosa, numpy as np
y, sr = librosa.load(sys.argv[1], sr=22050, mono=True)
H, P = librosa.effects.hpss(y)
hop = 512
S = np.abs(librosa.stft(H, n_fft=2048, hop_length=hop)) ** 2
f = librosa.fft_frequencies(sr=sr, n_fft=2048)
bands = {"低音": (30, 160), "中低": (160, 600), "中音": (600, 2500), "高音": (2500, 9000)}
E = {k: S[(f >= a) & (f < b)].sum(0) for k, (a, b) in bands.items()}
perc = librosa.feature.rms(y=P, hop_length=hop)[0] ** 2
fps = sr / hop
step = int(2 * fps)
def dbv(x): return 10 * np.log10(x + 1e-12)
ref = {k: dbv(np.percentile(v, 95)) for k, v in E.items()}; pref = dbv(np.percentile(perc, 95))
print("  秒   " + "  ".join(f"{k:>4s}" for k in bands) + "  打击")
for i in range(0, len(perc) - step, step):
    row = [dbv(E[k][i:i + step].mean()) - ref[k] for k in bands] + [dbv(perc[i:i + step].mean()) - pref]
    bar = lambda v: f"{v:5.0f}"
    print(f"{i / fps:5.0f}  " + " ".join(bar(v) for v in row))
tempo, beats = librosa.beat.beat_track(y=P, sr=sr)
print("tempo≈", np.round(tempo, 1))
chroma = librosa.feature.chroma_cqt(y=H, sr=sr).mean(1)
print("最强的音级：", [["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"][k] for k in np.argsort(chroma)[::-1][:4]])
