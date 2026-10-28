# 把识别结果（带字级时间）和原歌词逐字对齐，得到每句歌词的起止时间和各段落时间
import sys, json, re, difflib
trans_file, lyrics_file, out_file, duration = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
SECTION_KEYS = {"Verse 1": "v1", "Pre-Chorus": "pre", "Chorus": "ch", "Verse 2": "v2", "Bridge": "bridge", "Final Chorus": "fin"}
lines, sec, counts = [], None, {}
for raw in open(lyrics_file, encoding="utf8"):
    raw = raw.strip()
    if not raw: continue
    m = re.match(r"\[([^:\]]+)", raw)
    if m:
        k = SECTION_KEYS.get(m.group(1).strip())
        if k in ("pre", "ch"):
            counts[k] = counts.get(k, 0) + 1; k = k + ("1" if counts[k] == 1 else "2")
        sec = k; continue
    lines.append((sec, raw))
cjk = lambda s: [ch for ch in s if "一" <= ch <= "鿿"]
import unicodedata
segs = json.load(open(trans_file, encoding="utf8"))
tchars = []
for s in segs:
    if s["start"] > duration - 5: continue  # 结尾静音处的幻觉
    for w in s["words"]:
        cs = cjk(w["w"])
        for i, ch in enumerate(cs):
            a = w["s"] + (w["e"] - w["s"]) * i / len(cs); b = w["s"] + (w["e"] - w["s"]) * (i + 1) / len(cs)
            tchars.append((ch, a, b))
# 繁体转简体：只处理本歌词里出现过的字
T2S = str.maketrans("顆過盞燈著時離說裡潮來麼們誰現後給遙會從盡輪修晝聽錯這嗎", "颗过盏灯着时离说里潮来么们谁现后给遥会从尽轮修昼听错这吗")
tstr = "".join(c for c, _, _ in tchars).translate(T2S)
target, owner = [], []
for li, (_, txt) in enumerate(lines):
    for ch in cjk(txt): target.append(ch); owner.append(li)
sm = difflib.SequenceMatcher(None, "".join(target), tstr, autojunk=False)
tmap = {}
for blk in sm.get_matching_blocks():
    for k in range(blk.size): tmap[blk.a + k] = blk.b + k
matched = len(tmap) / len(target)
res = []
for li, (sec, txt) in enumerate(lines):
    idx = [i for i, o in enumerate(owner) if o == li]
    hits = [tmap[i] for i in idx if i in tmap]
    res.append([sec, txt, tchars[min(hits)][1] if hits else None, tchars[max(hits)][2] if hits else None, len(hits) / len(idx)])
# 没对上的句子用前后句插值
for i, r in enumerate(res):
    if r[2] is None:
        prev = next((res[j][3] for j in range(i - 1, -1, -1) if res[j][3] is not None), 0)
        nxt = next((res[j][2] for j in range(i + 1, len(res)) if res[j][2] is not None), duration)
        r[2], r[3] = prev + 0.3, min(nxt - 0.3, prev + 3.5)
for sec, txt, a, b, q in res: print(f"{sec:7s} {a:7.2f} {b:7.2f} {q:4.0%} {txt}")
first = {}; last = {}
for sec, _, a, b, _ in res: first.setdefault(sec, a); last[sec] = b
order = ["v1", "pre1", "ch1", "v2", "pre2", "ch2", "bridge", "fin"]
sections = {"intro": [0, first["v1"] - 1.0]}
for i, k in enumerate(order):
    a = first[k] - 1.0
    b = first[order[i + 1]] - 1.0 if i + 1 < len(order) else last[k] + 2.0
    if k == "ch2": b = last[k] + 1.5           # 副歌二之后是间奏，单独留给转场
    sections[k] = [round(a, 2), round(b, 2)]
sections["outro"] = [sections["fin"][1], duration]
lyr = [[round(a, 2), round(max(b, a + 1.2), 2), txt] for _, txt, a, b, _ in res]
json.dump({"duration": duration, "sections": sections, "lyrics": lyr}, open(out_file, "w", encoding="utf8"), ensure_ascii=False)
print("matched chars:", f"{matched:.0%}"); print(json.dumps(sections, ensure_ascii=False))
