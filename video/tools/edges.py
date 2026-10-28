# 在给定时间附近，按 0.25 秒找低音和整体能量变化最陡的位置
import sys, librosa, numpy as np
y, sr = librosa.load(sys.argv[1], sr=22050, mono=True)
hop = 256; fps = sr / hop
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop)) ** 2
f = librosa.fft_frequencies(sr=sr, n_fft=2048)
bass = 10 * np.log10(S[(f >= 30) & (f < 160)].sum(0) + 1e-9)
full = 10 * np.log10(S.sum(0) + 1e-9)
def smooth(x, n=int(0.25 * fps)): return np.convolve(x, np.ones(n) / n, mode="same")
bass, full = smooth(bass), smooth(full)
for c in map(float, sys.argv[2:]):
    a, b = int((c - 4) * fps), int((c + 4) * fps)
    w = int(0.5 * fps)
    db = bass[a + w:b] - bass[a:b - w]; df = full[a + w:b] - full[a:b - w]
    i, j = np.argmax(np.abs(db)), np.argmax(np.abs(df))
    print(f"near {c:6.1f}s: bass jump {db[i]:+5.1f}dB at {(a + i + w / 2) / fps:6.2f}s | full jump {df[j]:+5.1f}dB at {(a + j + w / 2) / fps:6.2f}s")
