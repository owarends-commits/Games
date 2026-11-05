"""The dark before the leap (Chapter One, CAM_05): Louis rushing through the leaves toward Norah, and his shriek.

  rush_leaves.wav  ~2.6 s: fast four-beat footfalls (hands and feet) crunching through dry leaves and snapping
                   twigs, far and muffled at first, then loud and bright right on top of her; ragged breathing
                   at the end.
  louis_shriek.wav ~1.7 s: a torn, half-human shriek: several detuned screaming voices that rise and crack,
                   a growl underneath, breath noise and clipping.

Run: python3 tools/make_audio_rush.py   (writes into assets/audio/)
"""
import math, os, wave
import numpy as np
from scipy.signal import lfilter, iirpeak

SR = 22050
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'audio')
rng = np.random.default_rng(31)

def t_(sec): return np.arange(int(sec * SR)) / SR
def noise(n): return rng.uniform(-1, 1, n)
def lpf(x, fc):
    a = math.exp(-2 * math.pi * fc / SR); return lfilter([1 - a], [1, -a], x)
def hpf(x, fc): return x - lpf(x, fc)
def bpf(x, f0, q=4.0):
    b, a = iirpeak(min(f0, SR / 2 - 100) / (SR / 2), q); return lfilter(b, a, x)
def place(dst, src, at):
    i = int(at * SR); j = min(len(dst), i + len(src))
    if 0 <= i < len(dst): dst[i:j] += src[:j - i]
def save(name, x, peak=0.9):
    x = np.asarray(x, float); x = x / (np.max(np.abs(x)) + 1e-9) * peak
    d = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(os.path.join(OUT, name + '.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())

# ------------------------------------------------------------------ one footfall in dry leaves
def crunch(bright=1.0):
    """A hand or foot landing in leaf litter: a dense spray of tiny dry crackles plus a soft body thump."""
    sec = rng.uniform(0.07, 0.13); n = int(sec * SR); x = np.zeros(n)
    for _ in range(rng.integers(14, 30)):                      # the individual leaves snapping
        k = int(rng.uniform(0.002, 0.004) * SR)
        c = noise(k) * np.exp(-np.arange(k) / (0.0006 * SR)) * rng.uniform(0.3, 1.0)
        at = int(min(rng.exponential(sec * 0.25), sec * 0.9) * SR)
        x[at:at + k] += c[:max(0, min(k, n - at))]
    x = hpf(x, 1400) * 0.9 + bpf(x, rng.uniform(2600, 4200), 1.8) * 0.6
    tt = np.arange(n) / SR
    thump = np.sin(2 * np.pi * np.cumsum(np.linspace(110, 55, n)) / SR) * np.exp(-tt / 0.025)
    thump += lpf(noise(n), 300) * np.exp(-tt / 0.03)
    return x * bright + thump * 0.55
def twig():
    k = int(0.04 * SR); tt = np.arange(k) / SR
    return (hpf(noise(k), 900) * np.exp(-tt / 0.004) + np.sin(2 * np.pi * 1900 * tt) * np.exp(-tt / 0.006) * 0.5)

# ------------------------------------------------------------------ the rush: far -> right on top of her
sec = 2.6
out = np.zeros(int(sec * SR))
near = np.zeros_like(out)
tm = 0.0; stride = 0.36
hits = []
while tm < sec - 0.08:
    # a gallop: four beats bunched in each stride (back feet, then hands), the strides quickening
    for off in (0.0, 0.055, 0.17, 0.215):
        hits.append(tm + off + rng.uniform(-0.012, 0.012))
    tm += stride; stride = max(0.24, stride * 0.95)
for h in hits:
    if h >= sec - 0.05: continue
    p = (h / sec) ** 2.2                                       # 0 far .. 1 close
    place(out, crunch(0.5 + 0.8 * p) * (0.14 + 0.86 * p), h)
    if rng.random() < 0.18:
        place(out, twig() * (0.08 + 0.7 * p), h + rng.uniform(0.0, 0.03))
# distance: muffled far off, opening up as it closes in (a sliding low-pass, done in blocks)
blk = int(0.05 * SR)
y = np.zeros_like(out); zi_prev = 0.0
for i in range(0, len(out), blk):
    p = (i / len(out)) ** 1.6
    fc = 900 + 7600 * p
    a = math.exp(-2 * math.pi * fc / SR)
    seg, zf = lfilter([1 - a], [1, -a], out[i:i + blk], zi=[zi_prev * a])
    y[i:i + blk] = seg * 0.6 + out[i:i + blk] * 0.4 * p       # the crisp top end only when close
    zi_prev = seg[-1] if len(seg) else zi_prev
# breathing: rough, fast huffs over the last second, close
br = np.zeros_like(out)
tb = sec - 1.1
while tb < sec - 0.05:
    k = int(0.11 * SR); tt = np.arange(k) / SR
    huff = bpf(noise(k), rng.uniform(600, 900), 1.2) * np.sin(np.pi * tt / tt[-1]) ** 2
    place(br, huff * ((tb - (sec - 1.1)) / 1.1) * 0.6, tb)
    tb += rng.uniform(0.16, 0.22)
save('rush_leaves', y + br, 0.85)

# ------------------------------------------------------------------ the shriek
sec = 1.75; tt = t_(sec); n = len(tt)
sh = np.zeros(n)
for f0, amp, delay in ((980, 1.0, 0.0), (1240, 0.8, 0.02), (1610, 0.55, 0.035), (720, 0.6, 0.01)):
    rise = 1 + 0.45 * np.minimum(1, tt / 0.35)                  # shoots up at the start
    crack = 1 + 0.18 * (tt > 0.62) * np.sin(2 * np.pi * 23 * tt)  # the voice cracks and rattles
    wob = 1 + 0.05 * np.sin(2 * np.pi * rng.uniform(7, 11) * tt) + 0.03 * np.cumsum(rng.normal(size=n)) / 400
    f = f0 * rise * crack * wob * (1 - 0.22 * np.maximum(0, tt - 0.9) / 0.85)   # sags as it runs out of breath
    ph = np.cumsum(f / SR)
    v = np.tanh(4.0 * np.sin(2 * np.pi * ph) + 1.2 * np.sin(6 * np.pi * ph + 0.4))
    v = bpf(v, 1100, 2) + 0.8 * bpf(v, 2300, 3) + 0.5 * bpf(v, 3400, 4) + 0.3 * v
    e = np.minimum(1, np.maximum(0, tt - delay) / 0.02) * np.minimum(1, (sec - tt) / 0.35)
    sh += v * e * amp
# the growl under it: a low, rough subharmonic
g = np.tanh(3 * np.sin(2 * np.pi * np.cumsum(np.full(n, 92.0) * (1 + 0.1 * np.sin(2 * np.pi * 31 * tt))) / SR))
g = lpf(g, 600) * np.minimum(1, tt / 0.05) * np.exp(-tt / 0.9)
# breath, rasping through the scream
b = bpf(noise(n), 3000, 0.8) * np.minimum(1, tt / 0.03) * np.minimum(1, (sec - tt) / 0.3)
mix = sh + 0.7 * g + 0.45 * b
mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 2.4)        # clipped, ragged
save('louis_shriek', mix, 0.97)
print('wrote rush_leaves.wav, louis_shriek.wav')

# ================================================================== v13b: Louis the Brute
# sharp_sting.wav ~1.6 s: as he walks out of the dark. A piercing bowed-metal shriek (two detuned, beating partials
#                  sliding up), a hard transient crack on top, a sub thump under it, ringing off.
sec = 1.6; tt = t_(sec); n = len(tt)
f = 1850 * (1 + 0.06 * np.minimum(1, tt / 0.25))
s1 = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.8 * np.sin(2 * np.pi * np.cumsum(f * 1.013) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(f * 2.71) / SR)
bow = s1 * (1 + 0.35 * bpf(noise(n), 1900, 3)) * np.minimum(1, tt / 0.01) * np.exp(-tt / 0.55)
crack = hpf(noise(n), 2000) * np.exp(-tt / 0.012) * 2.2
sub = np.sin(2 * np.pi * np.cumsum(np.linspace(70, 34, n)) / SR) * np.exp(-tt / 0.35) * 1.4
save('sharp_sting', np.tanh((bow * 0.9 + crack + sub) * 1.3), 0.95)

# leaf_rustle.wav ~0.9 s: something moving fast through dry undergrowth, off in the trees
sec = 0.9; out2 = np.zeros(int(sec * SR))
tm = 0.0
while tm < sec - 0.1:
    place(out2, crunch(0.8) * (0.4 + 0.6 * np.sin(np.pi * tm / sec)), tm); tm += rng.uniform(0.05, 0.11)
for _ in range(40):                                            # leaves brushed aside: soft hiss bursts
    k = int(rng.uniform(0.03, 0.09) * SR); tt = np.arange(k) / SR
    place(out2, bpf(noise(k), rng.uniform(3000, 6000), 1.0) * np.sin(np.pi * tt / tt[-1]) * 0.35, rng.uniform(0, sec - 0.1))
save('leaf_rustle', lpf(out2, 5200), 0.75)

# brute_whoosh.wav ~0.5 s: the huge arm cutting the air over her head
sec = 0.5; tt = t_(sec); n = len(tt)
env_ = np.sin(np.pi * np.minimum(1, tt / sec)) ** 2
wh = np.zeros(n)
for i in range(0, n, 256):
    seg = noise(min(256, n - i)); fc = 300 + 1500 * env_[i]
    wh[i:i + len(seg)] = bpf(seg, fc, 1.6)
save('brute_whoosh', wh * env_, 0.8)

# wall_smash.wav ~1.4 s: his fist going into the house: a deep body hit, splintering siding, debris pattering down
sec = 1.4; tt = t_(sec); n = len(tt)
hit = np.sin(2 * np.pi * np.cumsum(np.linspace(85, 38, n)) / SR) * np.exp(-tt / 0.18) * 1.6 + lpf(noise(n), 500) * np.exp(-tt / 0.08) * 1.2
spl = np.zeros(n)
for _ in range(26):                                            # boards cracking
    k = int(rng.uniform(0.01, 0.05) * SR); tt2 = np.arange(k) / SR
    place(spl, (hpf(noise(k), 1200) * np.exp(-tt2 / 0.008) + np.sin(2 * np.pi * rng.uniform(600, 1400) * tt2) * np.exp(-tt2 / 0.015) * 0.6) * rng.uniform(0.3, 1.0),
          rng.exponential(0.06))
deb = np.zeros(n)
for _ in range(30):                                            # bits of siding and paint pattering down
    k = int(0.02 * SR); tt2 = np.arange(k) / SR
    place(deb, hpf(noise(k), 2500) * np.exp(-tt2 / 0.004) * rng.uniform(0.1, 0.35), rng.uniform(0.15, 1.2))
save('wall_smash', np.tanh(hit + spl * 0.9 + deb), 0.97)
print('wrote sharp_sting, leaf_rustle, brute_whoosh, wall_smash')
