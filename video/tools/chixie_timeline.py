# 用 Suno.cn 返回的 LRC 时间戳 + 语音识别结果，整理《迟写的章节》版本 1 的逐句时间轴和段落
import json, re, difflib, sys
S = sys.argv[1]
lrc = json.load(open(f"{S}/chixie_lyrics_2103695571712741376.json", encoding="utf8"))["lyrics"]
segs = json.load(open(f"{S}/chixie_audio/c0.json", encoding="utf8"))
DUR = 203.96
KEYS = [("Verse 1", "v1"), ("Chorus", "ch"), ("Verse 2", "v2"), ("Bridge", "bridge"), ("Outro", "outro")]
lines, sec, nch = [], None, 0
for raw in lrc.splitlines():
    m = re.match(r"\[(\d+):(\d+\.\d+)\](.*)", raw.strip())
    if not m: continue
    t, body = int(m.group(1)) * 60 + float(m.group(2)), m.group(3)
    head = re.match(r"\*\*\((.*?)\)\*\*", body)
    header = False
    if head:
        name = head.group(1)
        for k, v in KEYS:
            if name.startswith(k):
                if v == "ch": nch += 1; v = f"ch{nch}"
                sec = v; break
        body, header = body[head.end():], True
    txt = re.sub(r"(?<=[^\sA-Za-z])\s+(?=[^\sA-Za-z])", "", body.strip())   # 去掉字与字之间的空格
    txt = txt.replace("...", "…")
    if txt: lines.append({"sec": sec, "t": t, "txt": txt, "header": header})
# 段落标题粘连的那一句，时间改用识别结果里最像它的那段人声的起点
cjk = lambda s: "".join(c for c in s if "一" <= c <= "鿿")
for i, l in enumerate(lines):
    if not l["header"]: continue
    nxt = lines[i + 1]["t"] if i + 1 < len(lines) else DUR
    best = max((s for s in segs if l["t"] - 3 <= s["start"] < nxt - 1),
               key=lambda s: difflib.SequenceMatcher(None, cjk(l["txt"]), cjk(s["text"])).ratio(), default=None)
    if best: l["t"] = round(best["start"], 2)
lyr = []
for i, l in enumerate(lines):
    nxt = lines[i + 1]["t"] if i + 1 < len(lines) else DUR - 4
    lyr.append([round(l["t"], 2), round(min(nxt - 0.25, l["t"] + 8), 2), l["txt"]])
first = {}
for l in lines: first.setdefault(l["sec"], l["t"])
last_end = {}
for (a, b, _), l in zip(lyr, lines): last_end[l["sec"]] = b
sections = {
    "intro": [0, first["v1"] - 1],
    "v1": [first["v1"] - 1, first["ch1"] - 0.8],
    "ch1": [first["ch1"] - 0.8, last_end["ch1"] + 1],
    "inter": [last_end["ch1"] + 1, first["v2"] - 1],
    "v2": [first["v2"] - 1, first["ch2"] - 0.8],
    "ch2": [first["ch2"] - 0.8, last_end["ch2"] + 1],
    "bridge": [min(last_end["ch2"] + 1, first["bridge"] - 1), first["outro"] - 1],
    "outro": [first["outro"] - 1, DUR],
}
# 段落末尾不能越过下一段第一句歌词开始前 1 秒
order = list(sections)
for i in range(len(order) - 1):
    a, b = order[i], order[i + 1]
    cut = min(sections[a][1], sections[b][0])
    sections[a][1] = sections[b][0] = cut
sections = {k: [round(a, 2), round(b, 2)] for k, (a, b) in sections.items()}
json.dump({"duration": DUR, "sections": sections, "lyrics": lyr}, open("/home/user/6683/video/chixie.timeline.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
for (a, b, txt), l in zip(lyr, lines): print(f"{l['sec']:7s} {a:7.2f} {b:7.2f} {txt}")
print(json.dumps(sections, ensure_ascii=False))
