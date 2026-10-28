# 用 Kokoro（sherpa-onnx 离线运行）把一句中文读成 wav。用法：tts.py <sid> <speed> <文本> <输出.wav>
import os, sys, sherpa_onnx, soundfile as sf
K = sys.argv[5] if len(sys.argv) > 5 else os.environ.get("KOKORO_DIR", "kokoro")
cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
    model=f"{K}/model.onnx", voices=f"{K}/voices.bin", tokens=f"{K}/tokens.txt", data_dir=f"{K}/espeak-ng-data",
    dict_dir=f"{K}/dict", lexicon=f"{K}/lexicon-zh.txt,{K}/lexicon-us-en.txt"), num_threads=4),
    rule_fsts=f"{K}/date-zh.fst,{K}/phone-zh.fst,{K}/number-zh.fst", max_num_sentences=1)
tts = sherpa_onnx.OfflineTts(cfg)
print("speakers:", tts.num_speakers, file=sys.stderr)
audio = tts.generate(sys.argv[3], sid=int(sys.argv[1]), speed=float(sys.argv[2]))
sf.write(sys.argv[4], audio.samples, samplerate=audio.sample_rate)
print(f"{sys.argv[4]} {len(audio.samples)/audio.sample_rate:.2f}s sr={audio.sample_rate}")
