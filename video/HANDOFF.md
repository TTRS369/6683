# 接力说明（新窗口从这里继续）

新开一个 Claude Code 会话（同一个仓库 `TTRS369/6683`、分支 `claude/fun-ideas-qw48b4`），第一句话发：

> 读一下 video/HANDOFF.md，接着做《迟到的消息》MV

## 正在做：《迟到的消息》粒子 MV（配《Dusk Till Dawn》的结构）

**已确定：**
- 画风：**粒子特效**（参考 `style_frames.html` 里的 `particles(t)`：先画一张色块遮罩，再按颜色撒约 26 万个光点，人物能散成粒子）。
- 故事：方向二《迟到的消息》（她收到"他走了"的消息 → 走过回忆 → 发现他十年来每年都回路口等她 → 声波炸成他 → 想象中的十年 → 他化成光升空 → 绿灯，她走过去）。
- 画质：要清晰，不加颗粒噪点。

**还没确认（新窗口里先问用户）：**
1. 分镜要不要改（见下表）。
2. 音乐：继续用《Dusk Till Dawn》（自己看没问题，公开发布有版权风险），还是用 Suno 做一首原创。
3. 用 Dusk Till Dawn 的话，用户要**重新上传那个 mp3**（音频文件不进仓库）。

**进度：** 开头钩子已做好（`late.html`，0–14 秒：粒子拼出手机 → 3.32 秒消息到达 → 镜头推近 → 6.0 秒只剩"他走了。"→ 8.29 秒炸开 → 10.26 秒节奏进来时拼成片名 → 片名散去）。预览片 `late_hook.mp4` 已发给用户。
渲染预览：`echo '{"duration":14}' > hook.timeline.json && CRF=16 node render.js late.html hook_silent.mp4 hook.timeline.json`

**下一步：** 等用户看完钩子的反馈，然后从主歌 1（黄昏的公寓）往后做。

### 视觉规则
- 现在（她，十年后的这一夜）：冷蓝白粒子
- 过去（回忆里的他、他们）：暖金色粒子
- 招牌转场：上一个画面的粒子飞起，重新拼成下一个画面

### 分镜表（时间按 Dusk Till Dawn 的段落；换歌要重新对齐）

| 时间 | 段落 | 画面 |
|---|---|---|
| 0:00–0:11 | 钩子 | 黑屏，粒子手机屏幕亮起，消息"他走了。"文字碎成粒子，拼成片名《迟到的消息》 |
| 0:11–0:32 | 主歌 1 | 黄昏公寓，她坐窗边握着手机；门口闪过金色人影（回忆里他回家），一眨眼散了 |
| 0:32 | 低音进 | 她抓起外套冲出门，房间粒子整个飞散，重组成夜晚街道 |
| 0:32–1:04 | 夜 | 她走过城市，每处浮现金色回忆：便利店挑冰淇淋、公交站共撑一把伞，出现即消散 |
| 1:04–1:36 | 副歌 1 | 十年前的争吵，金红粒子快切：对峙、钥匙摔地溅成粒子、门重重关上、画面碎掉；穿插现在的她雨中奔跑 |
| 1:36 | 收 | 她停在路口，红灯；所有粒子和雨悬停，时间静止 |
| 1:42–2:33 | 主歌 2 | 见到他的朋友，接过旧盒子，里面是他的旧手机，有一条十年前那晚录好没发出的语音 |
| 2:33–3:05 | 副歌 2（反转） | 蒙太奇：十年里每年同一天他都回这个路口等她，四季交替（雪/花瓣/落叶粒子），字幕"第 1 年…第 10 年"；同时她拿着手机跑向路口 |
| 3:05–3:28 | 桥段 | 天快亮，她坐在路口台阶按下播放，一道粒子声波缓缓升起 |
| 3:28 | 晨光重击 | 声波炸成漫天金粒子，在马路对面拼出他；红灯变绿 |
| 3:28–4:11 | 最后副歌 | "如果那天"的想象：和好、牵手走过街道、日常，一幕接一幕，十年在四十秒里过完；他走过斑马线向她伸手 |
| 4:11–4:26 | 尾声 | 快碰到时他化成光点随日出升空；路口只剩她，绿灯亮着，她走过去；片名 |

《Dusk Till Dawn》的段落时间（之前分析得到，`lh_timeline.py` 里的 marks）：
低音进 32.4s，副歌 1 64.9s，收 96.7s，再起 104.0s，副歌 2 153.0s，桥段 185.3s，晨光重击 208.6s，尾声 251.6s。

## 制作流程（所有视频都这样做）

1. **分析音乐**：`python video/tools/bands.py song.mp3`（分频段能量看乐器进出）、`video/tools/edges.py`（找段落边界）、`video/lh_timeline.py song.mp3 out.timeline.json`（段落 + 逐帧能量 + 节拍/小节）。
2. **写画面**：一个 HTML，暴露 `window.renderAt(t)`，画面只由时间 t 决定；读取 `window.TIMELINE`（sections / energy / bass / beats / downbeats / lyrics）。
3. **渲染**：`node video/render.js page.html out_silent.mp4 page.timeline.json`（4 个 Chromium 并行出帧 + ffmpeg 编码；`CRF=16` 更清晰）。
4. **合成音频**：`ffmpeg -i out_silent.mp4 -i song.mp3 -c:v copy -c:a aac -b:a 256k -shortest out.mp4`。
5. 聊天里上传单个文件上限 400MB，超了就分段。

其他工具（`video/tools/`）：
- `transcribe.py` / `align.py`：faster-whisper 识别人声时间，和歌词对齐出逐句时间轴（PyAV 有兼容问题，脚本里用 ffmpeg 解码）。
- `tts.py` / `tts_batch.py` / `tts_score.py`：Kokoro 离线配音（sherpa-onnx，模型 `csukuangfj/kokoro-multi-lang-v1_1`，放在 `KOKORO_DIR`；之前用的男声 sid 70、语速 1.08）。
- `room_sfx.py`（在 video/ 下）：用代码合成音效，人声出现时自动压低。

## 已完成的作品

| 文件 | 内容 |
|---|---|
| `eternity.html` | 永恒/死亡/进化短片（116 秒） |
| `shixing.html` | 《拾星》MV（机器人阿锈） |
| `chixie.html` | 《迟写的章节》MV（歌词时间轴不进仓库） |
| `room.html` + `room_sfx.py` | 《A Little Room for You》故事 MV + 合成音效 |
| `ember.html` + `ember_audio.py` | 《余烬与永恒》解说版；`ember_text.timeline.json` 是只有字幕的版本 |
| `lighthouse.html` | 《守灯人》Dusk Till Dawn MV 第一版（用户觉得画面重复、故事不清楚，所以重做） |
| `style_frames.html` | 四种画风样张：粒子 / 霓虹线条 / 水彩 / 电影感 |
| `chibi_frames.html` | 圆头小人画风样张（用户最后没选） |

成品 mp4、音频都不进仓库（`.gitignore`），在聊天记录里下载，Google 云盘里也有素材文件夹和歌词文档。

## 注意事项
- 公开发布：标注 AI 生成；用别人的歌（如 Dusk Till Dawn）有版权风险，原创 Suno 歌更安全。
- 片尾保留制作署名（注明 AI 和音乐来源）。
