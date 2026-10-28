# 用语音识别检查每段配音读得准不准（字准确率），作为"清晰度"的参考
import sys, json, difflib, subprocess, numpy as np
from faster_whisper import WhisperModel
jobs = json.load(open(sys.argv[1], encoding="utf8"))
m = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
cjk = lambda s: "".join(c for c in s if "一" <= c <= "鿿")
for j in jobs:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", j["out"], "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout
    segs, _ = m.transcribe(np.frombuffer(raw, np.float32), language="zh", initial_prompt="以下是普通话的句子。")
    txt = "".join(s.text for s in segs)
    print(f'sid {j["sid"]:3d}  准确率 {difflib.SequenceMatcher(None, cjk(j["text"]), cjk(txt)).ratio():.0%}  识别：{txt}')
