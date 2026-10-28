# 根据段落和歌词时间，生成画面与音效共用的事件时间点，写回时间轴文件
import json, sys
p = sys.argv[1]; tl = json.load(open(p, encoding="utf8")); S = tl["sections"]; L = tl["lyrics"]
find = lambda en, nth=0: [l[0] for l in L if l[2] == en][nth]
ev = {
    # 窗外车流：每辆车经过画面中央的时刻
    "cars": [round(S["pre1"][0] + 1.6 + i * 3.1, 2) for i in range(4)],
    # 超市：有人笑（第二段主歌第一句后不久），他回头（第三句开头）
    "laugh": round(find("Somebody laughed the way you did") + 0.6, 2),
    "turn": round(find("And for a second I turned around") + 0.2, 2),
    # 回家路上：步伐周期（秒/步）
    "step": 0.62,
    # 夜里给她发消息：打字区间和发送时刻
    "typeStart": round(S["bridge"][0] + 1.2, 2), "typeEnd": round(S["bridge"][0] + 4.4, 2), "send": round(S["bridge"][0] + 4.9, 2),
    # 春天早上：擦椅子的几下、放下两只杯子
    "wipes": [round(S["fin"][0] + 2.0 + i * 0.9, 2) for i in range(5)],
    "cups": [round(S["fin"][0] + 9.5, 2), round(S["fin"][0] + 10.6, 2)],
    # 她的身影短暂出现（"时间想拿走什么就拿走吧"那两句）
    "ghost": [round(find("Let time take everything it wants") - 0.5, 2), round(find("It can't take this from you") + 4.5, 2)],
}
tl["events"] = ev
json.dump(tl, open(p, "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(json.dumps(ev))
