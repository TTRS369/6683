# 《A Little Room for You》版本 1：用平台 LRC 时间戳 + 识别结果校正，生成逐句时间轴（中英双语）
import json, re, difflib, sys
S = sys.argv[1]; OUT = sys.argv[2]
lrc = json.load(open(f"{S}/room_audio/lyrics_2114742738481057792.json", encoding="utf8"))["lyrics"]
segs = json.load(open(f"{S}/room_audio/r0.json", encoding="utf8"))
DUR = 192.76
V1 = [("Your coat is still hanging by the door", "你的外套还挂在门边"), ("I keep meaning to move it", "我一直想把它收起来"),
      ("Your number's still there in my phone", "你的号码还存在我手机里"), ("I know I'll never use it", "我知道再也不会拨出去")]
PRE = [("The world went on like nothing changed", "世界照常运转，好像什么都没变"), ("The traffic, the weather, the news", "车流、天气、新闻"),
       ("But somewhere in the middle of it all", "可在这一切的中间"), ("There's a space the shape of you", "空着一块你的形状")]
CH = [("So I keep a little room for you", "所以我为你留着一小块地方"), ("Where the quiet doesn't hurt", "在那里，安静也不再刺痛"),
      ("I keep a little room for you", "我为你留着一小块地方"), ("In the corners of my words", "在我话语的角落"),
      ("They say that time will clear it out", "他们说时间会把它清空"), ("But I don't want it to", "可我不愿意"),
      ("So I keep a little room", "所以我留着这一小块地方"), ("A little room for you", "一小块，留给你")]
V2 = [("Somebody laughed the way you did", "有人笑得和你一模一样"), ("In line at the grocery store", "在超市排队的时候"),
      ("And for a second I turned around", "那一秒，我回过头"), ("Like I'd find you there once more", "好像还能再看见你")]
BR = [("You don't have to answer", "你不必回答"), ("You don't have to stay", "你不必留下"),
      ("I just needed you to know", "我只是想让你知道"), ("You're not gone in every way", "你并没有完全离开")]
FIN = CH[:4] + [("Let time take everything it wants", "时间想拿走什么，就拿走吧"), ("It can't take this from you", "唯独这个，它拿不走"),
                ("'Cause I keep a little room", "因为我留着这一小块地方"), ("A little room for you", "一小块，留给你")]
OUTRO = [("A little room for you", "一小块，留给你")] * 2
PLAN = [("v1", V1), ("pre1", PRE), ("ch1", CH), ("v2", V2), ("pre2", PRE), ("ch2", CH), ("bridge", BR), ("fin", FIN), ("outro", OUTRO)]
norm = lambda s: re.sub(r"[^a-z]", "", s.lower())
rows = []
for raw in lrc.splitlines():
    m = re.match(r"\[(\d+):(\d+\.\d+)\](.*)", raw.strip())
    if not m: continue
    t, body = int(m.group(1)) * 60 + float(m.group(2)), m.group(3)
    header = bool(re.match(r"\[[^\]]*\]", body))
    body = re.sub(r"\[[^\]]*\]", "", body).strip()
    if body: rows.append([t, body, header])
expected = [(sec, en, zh) for sec, lines in PLAN for en, zh in lines]
assert len(rows) == len(expected), (len(rows), len(expected))
out, first = [], {}
for (t, body, header), (sec, en, zh) in zip(rows, expected):
    r = difflib.SequenceMatcher(None, norm(body), norm(en)).ratio()
    assert r > 0.8, (body, en, r)
    if header:   # 段落标签粘连的句子：用识别结果里最像的那段人声的起点
        cand = [s for s in segs if t - 3 <= s["start"] <= t + 2]
        best = max(cand, key=lambda s: difflib.SequenceMatcher(None, norm(s["text"]), norm(en)).ratio(), default=None)
        if best and difflib.SequenceMatcher(None, norm(best["text"]), norm(en)).ratio() > 0.6: t = best["start"]
    out.append([round(t, 2), en, zh, sec]); first.setdefault(sec, t)
lyr = []
for i, (t, en, zh, sec) in enumerate(out):
    nxt = out[i + 1][0] if i + 1 < len(out) else DUR - 3
    lyr.append([t, round(min(nxt - 0.2, t + 7), 2), en, zh])
order = [k for k, _ in PLAN]
sections = {"intro": [0, round(first["v1"] - 0.8, 2)]}
for i, k in enumerate(order):
    a = first[k] - 0.8
    b = first[order[i + 1]] - 0.8 if i + 1 < len(order) else DUR
    sections[k] = [round(a, 2), round(b, 2)]
json.dump({"duration": DUR, "sections": sections, "lyrics": lyr}, open(OUT, "w", encoding="utf8"), ensure_ascii=False, indent=1)
for (t, en, zh, sec), l in zip(out, lyr): print(f"{sec:7s} {l[0]:7.2f} {l[1]:7.2f} {en}")
print(json.dumps(sections))
