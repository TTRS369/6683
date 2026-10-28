import subprocess, sys, numpy as np
f = sys.argv[1]
raw = subprocess.run(["ffmpeg","-v","error","-i",f,"-ac","1","-ar","8000","-f","s16le","-"],capture_output=True).stdout
x = np.frombuffer(raw, np.int16).astype(np.float32)/32768
step = 8000*2
db = [20*np.log10(np.sqrt(np.mean(x[i:i+step]**2))+1e-9) for i in range(0,len(x),step)]
mx = max(db)
for i,d in enumerate(db):
    print(f"{i*2:4d}s {d:6.1f} " + "#"*max(0,int((d-mx+40))))
