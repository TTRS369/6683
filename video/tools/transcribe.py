# 用 faster-whisper 识别歌曲里每段人声的起止时间（带字级时间戳），输出 JSON
import sys, json, subprocess
import numpy as np
from faster_whisper import WhisperModel
audio, out, prompt_file = sys.argv[1], sys.argv[2], sys.argv[3]
prompt = open(prompt_file, encoding="utf8").read()
model = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
raw = subprocess.run(["ffmpeg","-v","error","-i",audio,"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True,check=True).stdout
pcm = np.frombuffer(raw, np.float32)
segs, info = model.transcribe(pcm, language="zh", word_timestamps=True, vad_filter=False,
                              initial_prompt=prompt, condition_on_previous_text=False, beam_size=5)
res = []
for s in segs:
    res.append({"start": s.start, "end": s.end, "text": s.text,
                "words": [{"s": w.start, "e": w.end, "w": w.word} for w in (s.words or [])]})
    print(f"{s.start:7.2f} {s.end:7.2f} {s.text}", flush=True)
json.dump(res, open(out, "w", encoding="utf8"), ensure_ascii=False)
