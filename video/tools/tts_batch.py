# 批量合成：读取 JSON 列表 [{"sid":..,"speed":..,"text":..,"out":..}]，模型只加载一次
import os, sys, json, sherpa_onnx, soundfile as sf
K = os.environ.get("KOKORO_DIR", "kokoro")
cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
    model=f"{K}/model.onnx", voices=f"{K}/voices.bin", tokens=f"{K}/tokens.txt", data_dir=f"{K}/espeak-ng-data",
    dict_dir=f"{K}/dict", lexicon=f"{K}/lexicon-zh.txt,{K}/lexicon-us-en.txt"), num_threads=4),
    rule_fsts=f"{K}/date-zh.fst,{K}/phone-zh.fst,{K}/number-zh.fst", max_num_sentences=1)
tts = sherpa_onnx.OfflineTts(cfg)
for job in json.load(open(sys.argv[1], encoding="utf8")):
    a = tts.generate(job["text"], sid=job["sid"], speed=job.get("speed", 1.0))
    sf.write(job["out"], a.samples, samplerate=a.sample_rate)
    print(f'{job["out"]} {len(a.samples)/a.sample_rate:.2f}s', flush=True)
