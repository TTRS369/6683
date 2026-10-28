# 排解说时间：每句尽量从 at 开始；前一句没说完就往后推（留 0.3 秒气口）；检查 mustEnd
import sys, json, librosa
S = sys.argv[1]
script = json.load(open(f"{S}/ember/script.json", encoding="utf8"))
GAP = 0.3
rows, prev_end, bad = [], 0.0, 0
for i, ln in enumerate(script):
    y, sr = librosa.load(f"{S}/ember/line{i:02d}.wav", sr=None)
    yt, idx = librosa.effects.trim(y, top_db=35)
    d = len(yt) / sr
    start = max(ln["at"], prev_end + GAP)
    end = start + d
    flag = ""
    if start > ln["at"] + 0.05: flag += f" 推迟{start - ln['at']:.1f}s"
    if "mustEnd" in ln and end > ln["mustEnd"]: flag += f" ⚠超出{end - ln['mustEnd']:.1f}s"; bad += 1
    rows.append({"start": round(start, 2), "end": round(end, 2), "text": ln["text"], "trim": [int(idx[0]), int(idx[1])], "sr": sr})
    prev_end = end
    print(f"{i:2d} {start:7.2f}-{end:7.2f} ({d:4.2f}s){flag}  {ln['text']}")
json.dump(rows, open(f"{S}/ember/schedule.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
print("超出 mustEnd 的句子：", bad)
