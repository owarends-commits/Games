#!/usr/bin/env python3
"""Synthesizes the placeholder sound set (22.05 kHz mono, 16-bit) into assets/audio/.

Everything here is procedural stand-in audio so the prologue's sound beats can be timed:
rain, party babble, the glass crash, the ACROSS shriek, panic, footsteps, the BMW.
Replace any file with a recorded/edited sound of the same name and Godot picks it up.
Run:  python3 tools/make_audio.py
"""
import os, wave, math
import numpy as np

SR = 22050
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'audio')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)

def t_(sec): return np.arange(int(sec * SR)) / SR
def noise(sec): return rng.uniform(-1, 1, int(sec * SR))
def lp(x, fc):
    a = math.exp(-2 * math.pi * fc / SR); y = np.zeros_like(x); acc = 0.0
    for i in range(len(x)): acc = (1 - a) * x[i] + a * acc; y[i] = acc
    return y
def lpf(x, fc):   # fast vectorised-ish one-pole using scipy if present
    try:
        from scipy.signal import lfilter
        a = math.exp(-2 * math.pi * fc / SR); return lfilter([1 - a], [1, -a], x)
    except ImportError:
        return lp(x, fc)
def hpf(x, fc): return x - lpf(x, fc)
def bpf(x, f0, q=4.0):
    try:
        from scipy.signal import iirpeak, lfilter
        b, a = iirpeak(min(f0, SR / 2 - 100) / (SR / 2), q); return lfilter(b, a, x)
    except ImportError:
        return hpf(lpf(x, f0 * 1.3), f0 * 0.7)
def env(n, a=0.005, d=0.1, sus=0.0):
    x = np.ones(n); na = max(1, int(a * SR)); x[:na] = np.linspace(0, 1, na)
    nd = n - na; x[na:] = np.exp(-np.arange(nd) / (d * SR)) * (1 - sus) + sus
    return x
def place(dst, src, at):
    i = int(at * SR); j = min(len(dst), i + len(src))
    if i < len(dst): dst[i:j] += src[:j - i]
def norm(x, peak=0.8):
    m = np.max(np.abs(x)) + 1e-9; return x / m * peak
def loopify(x, xf=0.25):
    n = int(xf * SR); head = x[:n].copy(); x = x[n:].copy()
    ramp = np.linspace(0, 1, n); x[-n:] = x[-n:] * (1 - ramp) + head * ramp
    return x
def save(name, x, peak=0.8):
    x = norm(np.asarray(x, float), peak)
    d = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(os.path.join(OUT, name + '.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())

VOWELS = [(730, 1090, 2440), (270, 2290, 3010), (530, 1840, 2480), (570, 840, 2410), (300, 870, 2240), (640, 1190, 2390), (440, 1020, 2240)]
def voice(sec, f0, rate=6.0, energy=1.0, scream=False):
    """Formant-filtered buzz chopped into syllables: reads as distant speech/babble."""
    n = int(sec * SR); out = np.zeros(n); t = 0.0
    while t < sec:
        syl = rng.uniform(0.6, 1.4) / rate; gap = rng.uniform(0.0, 0.5) / rate * (0.3 if scream else 1)
        if rng.random() < 0.12 and not scream: gap += rng.uniform(0.3, 1.2)
        m = int(syl * SR); tt = np.arange(m) / SR
        f = f0 * (1 + 0.15 * rng.normal()) * (1 + 0.08 * np.sin(2 * np.pi * rng.uniform(4, 7) * tt))
        if scream: f = f * np.linspace(1.0, rng.uniform(1.1, 1.5), m)
        ph = np.cumsum(f / SR); src = (ph % 1.0) * 2 - 1 + 0.15 * rng.uniform(-1, 1, m)
        fm = VOWELS[rng.integers(len(VOWELS))]; k = 1.3 if f0 > 200 else 1.0
        sy = sum(bpf(src, fm[i] * k, 5) * g for i, g in enumerate((1.0, 0.6, 0.3)))
        e = np.sin(np.linspace(0, np.pi, m)) ** 0.7 * rng.uniform(0.5, 1.0) * energy
        place(out, sy * e, t); t += syl + gap
    return out

def babble(sec, n_voices, f_lo, f_hi, rate=6.0, energy=1.0):
    out = np.zeros(int(sec * SR))
    for _ in range(n_voices):
        g = rng.uniform(0.2, 1.0)
        out += voice(sec, rng.uniform(f_lo, f_hi), rate * rng.uniform(0.8, 1.2), energy) * g
    return out

def scream(sec, f0, vib=6.0):
    tt = t_(sec); f = f0 * (1 + 0.25 * np.sin(np.pi * tt / sec)) * (1 + 0.03 * np.sin(2 * np.pi * vib * tt)) * (1 + 0.02 * rng.normal(size=len(tt)).cumsum() / 300)
    ph = np.cumsum(f / SR); src = np.tanh(3 * np.sin(2 * np.pi * ph) + 0.6 * np.sin(4 * np.pi * ph)) + 0.25 * noise(sec)
    y = bpf(src, 900, 3) + 0.7 * bpf(src, 1400, 4) + 0.4 * bpf(src, 2800, 5)
    e = np.minimum(1, tt / 0.05) * np.minimum(1, (sec - tt) / 0.25)
    return y * e

def tinkle(sec=0.25, f=None):
    f = f or rng.uniform(2500, 8000); tt = t_(sec)
    return (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 2.76 * tt)) * np.exp(-tt / rng.uniform(0.03, 0.12))

def thud(sec=0.5, f0=70, f1=38, nz=0.4):
    tt = t_(sec); f = np.linspace(f0, f1, len(tt)); ph = np.cumsum(f / SR)
    return (np.sin(2 * np.pi * ph) + nz * lpf(noise(sec), 400)) * np.exp(-tt / (sec * 0.25))

def step(kind):
    sec = 0.18; tt = t_(sec)
    if kind == 'tile': x = hpf(noise(sec), 1500) * np.exp(-tt / 0.012) * 0.8 + thud(sec, 120, 80, 0.2) * 0.5
    elif kind == 'carpet': x = lpf(noise(sec), 600) * np.exp(-tt / 0.03) + thud(sec, 90, 60, 0.3) * 0.4
    else: x = bpf(noise(sec), 2500, 1.5) * np.exp(-tt / 0.06) * 0.9 + thud(sec, 100, 60, 0.2) * 0.3   # wet asphalt
    return x

# ---------------------------------------------------------------- ambience loops
r = hpf(lpf(noise(8.25), 3500), 200) * 0.6
for _ in range(500): place(r, hpf(noise(0.01), 3000) * rng.uniform(0.1, 0.5) * np.exp(-t_(0.01) / 0.002), rng.uniform(0, 8.2))
save('rain_ext_loop', loopify(r), 0.5)
r = lpf(noise(8.25), 700) * 0.7
for _ in range(220): place(r, lpf(noise(0.02), 1500) * rng.uniform(0.1, 0.4) * np.exp(-t_(0.02) / 0.004), rng.uniform(0, 8.2))
save('rain_int_loop', loopify(r), 0.45)
tt = t_(6.25)
hum = 0.5 * np.sin(2 * np.pi * 60 * tt) + 0.25 * np.sin(2 * np.pi * 120 * tt) + 0.12 * np.sign(np.sin(2 * np.pi * 120 * tt)) * 0.3 + 0.05 * hpf(noise(6.25), 4000)
save('room_tone_loop', loopify(hum), 0.3)
p = babble(10.25, 16, 95, 230, 5.5) + 0.5 * babble(10.25, 6, 260, 420, 7, 1.2)
for _ in range(10): place(p, voice(0.6, rng.uniform(180, 300), 11, 1.4) * 0.8, rng.uniform(0, 9.5))   # laughs
for _ in range(14): place(p, tinkle(0.15, rng.uniform(1500, 2500)) * 0.15, rng.uniform(0, 10))    # cups, cutlery
save('party_loop', loopify(lpf(p, 3200)), 0.55)
k = babble(8.25, 8, 260, 450, 8, 1.3)
for _ in range(8):
    tt = t_(0.5); place(k, np.sin(2 * np.pi * np.cumsum(np.linspace(600, 1200, len(tt))) / SR) * np.sin(np.pi * tt / 0.5) * 0.5, rng.uniform(0, 7.5))
save('kids_loop', loopify(lpf(k, 4000)), 0.5)
pn = np.zeros(int(8.25 * SR))
for _ in range(26): place(pn, scream(rng.uniform(0.6, 1.6), rng.uniform(250, 650)) * rng.uniform(0.3, 1.0), rng.uniform(0, 7.5))
pn += babble(8.25, 12, 120, 300, 9, 2.0) * 0.8
for _ in range(60): place(pn, step(['tile', 'carpet'][rng.integers(2)]) * 0.6, rng.uniform(0, 8))
for _ in range(5): place(pn, thud(0.4, 90, 40, 0.8) * 0.8, rng.uniform(0, 7.8))
save('panic_loop', loopify(lpf(pn, 4500)), 0.8)
ds = np.zeros(int(10.25 * SR))
for _ in range(9): place(ds, scream(rng.uniform(0.8, 1.8), rng.uniform(300, 600)) * rng.uniform(0.2, 0.7), rng.uniform(0, 9))
tt = t_(10.25); siren = np.sin(2 * np.pi * np.cumsum(700 + 250 * np.sin(2 * np.pi * 0.35 * tt)) / SR) * 0.25
for _ in range(4): place(ds, thud(1.2, 50, 30, 1.0) * 0.6, rng.uniform(0, 9))
save('distant_chaos_loop', loopify(lpf(ds + siren, 1600)), 0.6)
fz = lpf(noise(6.25), 500) * 0.5
for _ in range(300): place(fz, hpf(noise(0.008), 2000) * rng.uniform(0.2, 1.0) * np.exp(-t_(0.008) / 0.0015), rng.uniform(0, 6.2))
save('fire_loop', loopify(fz), 0.6)
tt = t_(8.25)
dr = sum(np.sin(2 * np.pi * f * tt + rng.uniform(0, 6)) * g for f, g in ((41.2, 1), (41.6, 0.8), (61.7, 0.4), (82.0, 0.25), (123.5, 0.08)))
dr *= 0.7 + 0.3 * np.sin(2 * np.pi * tt / 8.25)
save('drone_loop', loopify(dr + 0.1 * lpf(noise(8.25), 200)), 0.45)
tt = t_(2.05)
eng = np.zeros(len(tt))
for h, g in ((1, 1), (2, 0.5), (3, 0.35), (4, 0.2), (6, 0.1)): eng += g * np.sign(np.sin(2 * np.pi * 34 * h * tt)) * 0.3 + g * np.sin(2 * np.pi * 34 * h * tt)
save('engine_loop', loopify(lpf(eng, 900) + 0.2 * lpf(noise(2.05), 300), 0.05), 0.6)

# ---------------------------------------------------------------- one-shots
g = np.zeros(int(2.0 * SR))
place(g, hpf(noise(0.25), 1200) * np.exp(-t_(0.25) / 0.05) * 1.3, 0.0)
place(g, thud(0.6, 85, 35, 0.7) * 1.2, 0.0)
for _ in range(260):
    tm = abs(rng.normal(0.0, 0.35)); place(g, tinkle() * rng.uniform(0.1, 0.6) * math.exp(-tm * 1.5), tm)
save('glass_crash', g, 0.95)
g = np.zeros(int(1.2 * SR))
for _ in range(10): place(g, tinkle() * rng.uniform(0.05, 0.25), rng.uniform(0, 1.0))
save('glass_settle', g, 0.35)
g = np.zeros(int(1.6 * SR)); tm = 0.0; gap = 0.05
while tm < 1.4: place(g, tinkle(0.05, rng.uniform(4000, 6000)) * 0.4, tm); tm += gap; gap *= 1.18
save('shard_roll', g, 0.3)
save('body_land', thud(0.6, 70, 40, 0.9), 0.8)
tt = t_(1.0)
car_ = 700 + 700 * np.sin(np.pi * np.minimum(1, tt / 0.6)) - 200 * tt
ph = np.cumsum(car_ / SR); mod = np.sin(2 * np.pi * np.cumsum(car_ * 1.48 / SR)) * (6 + 4 * rng.normal(size=len(tt)).cumsum() / 400)
sh = np.tanh(2.5 * np.sin(2 * np.pi * ph + mod)) + 0.5 * bpf(noise(1.0), 2500, 2)
sh *= np.minimum(1, tt / 0.01) * np.exp(-np.maximum(0, tt - 0.55) / 0.15)
save('across_shriek', bpf(sh, 1500, 1.2) + 0.6 * sh, 0.9)
sk = np.zeros(int(1.05 * SR))
for i in range(12): place(sk, (hpf(noise(0.03), 900) * np.exp(-t_(0.03) / 0.006) + thud(0.03, 150, 90, 0.5) * 0.4) * rng.uniform(0.5, 1), i / 12 + rng.uniform(0, 0.02))
save('across_skitter_loop', sk[:int(1.0 * SR)], 0.7)
st = np.zeros(int(1.55 * SR))
for i in range(9): place(st, thud(0.18, 110, 60, 1.0) * rng.uniform(0.5, 1), i * 0.16 + rng.uniform(0, 0.03))
tt = t_(1.55); growl = np.tanh(3 * np.sin(2 * np.pi * np.cumsum(70 + 20 * rng.normal(size=len(tt)).cumsum() / 300) / SR)) * 0.4
save('across_attack_loop', loopify(lpf(st + growl * lpf(noise(1.55), 900) * 3, 1800), 0.05), 0.75)
save('knockdown', thud(0.5, 90, 45, 1.2) + hpf(noise(0.5), 2000) * np.exp(-t_(0.5) / 0.04) * 0.4, 0.8)
for i, f0 in enumerate((330, 470, 560, 260)): save('scream_%d' % i, scream(rng.uniform(0.9, 1.4), f0), 0.8)
for k_ in ('tile', 'carpet', 'wet'): save('step_' + k_, step(k_), 0.5)
save('car_door', thud(0.35, 140, 70, 0.6) + hpf(noise(0.35), 1000) * np.exp(-t_(0.35) / 0.03) * 0.5, 0.8)
tt = t_(1.4); st_ = np.zeros(len(tt))
for i in range(6): place(st_, thud(0.12, 60, 40, 0.8), i * 0.09)
place(st_, lpf(np.sign(np.sin(2 * np.pi * np.cumsum(np.linspace(20, 45, int(0.9 * SR))) / SR)), 600) * np.minimum(1, t_(0.9) / 0.2), 0.5)
save('engine_start', st_, 0.8)
tt = t_(1.2); rev = np.sin(2 * np.pi * np.cumsum(np.linspace(35, 110, len(tt))) / SR)
save('engine_rev', lpf(np.sign(rev) * 0.4 + rev, 1200) * np.minimum(1, tt / 0.1) * np.minimum(1, (1.2 - tt) / 0.3), 0.85)
tt = t_(0.9); sc = bpf(noise(0.9), 2200, 6) * (0.6 + 0.4 * np.sin(2 * np.pi * 30 * tt))
save('tire_screech', sc * np.minimum(1, tt / 0.05) * np.minimum(1, (0.9 - tt) / 0.3), 0.6)
save('curb_bump', thud(0.5, 80, 35, 1.0) + thud(0.5, 80, 35, 1.0) * 0 , 0.85)
tt = t_(0.035); save('ui_blip', np.sign(np.sin(2 * np.pi * 900 * tt)) * np.exp(-tt / 0.012), 0.25)
tt = t_(0.12); save('ui_next', np.sign(np.sin(2 * np.pi * np.where(tt < 0.05, 660, 990) * tt)) * np.exp(-tt / 0.05), 0.3)
tt = t_(3.0); hit = (np.sin(2 * np.pi * 55 * tt) + 0.5 * np.sin(2 * np.pi * 82.4 * tt) + 0.3 * lpf(noise(3.0), 300)) * np.exp(-tt / 0.9)
save('title_hit', hit, 0.6)
print('wrote', len(os.listdir(OUT)), 'files to', OUT)

# ---------------------------------------------------------------- ending pass
tt = t_(2.05); al = np.sign(np.sin(2 * np.pi * np.where((tt * 2.5) % 1.0 < 0.5, 880, 660) * tt)) * 0.5
save('car_alarm_loop', loopify(lpf(al, 3000), 0.02), 0.35)
st = np.zeros(int(1.6 * SR))
for i in range(5):
    tt = t_(0.22); place(st, lpf(np.sign(np.sin(2 * np.pi * (28 + 6 * np.sin(2 * np.pi * 3 * tt)) * tt)), 700) * np.minimum(1, tt / 0.03) * 0.8, i * 0.26)
save('starter_fail', st, 0.6)
wt = thud(0.6, 95, 40, 1.2) + hpf(noise(0.6), 2500) * np.exp(-t_(0.6) / 0.05) * 0.8
for _ in range(6): place(wt, tinkle(0.3) * 0.3, rng.uniform(0, 0.2))
save('windshield_thump', wt, 0.95)
cr = np.zeros(int(3.0 * SR))
place(cr, thud(1.5, 70, 25, 1.6) * 1.4, 0.0)
place(cr, hpf(noise(0.5), 900) * np.exp(-t_(0.5) / 0.12) * 1.2, 0.0)
for _ in range(220):
    tm = abs(rng.normal(0.0, 0.5)); place(cr, tinkle() * rng.uniform(0.05, 0.4) * math.exp(-tm), tm)
for _ in range(14): place(cr, thud(0.25, 140, 70, 1.0) * rng.uniform(0.2, 0.6), rng.uniform(0.05, 1.6))
save('car_crash', cr, 0.98)
mc = np.zeros(int(4.0 * SR))
for i in range(26):
    tm = (i / 26) ** 0.8 * 3.8
    place(mc, (hpf(noise(0.04), 1800) * np.exp(-t_(0.04) / 0.008) + thud(0.04, 220, 120, 0.8) * 0.5) * rng.uniform(0.4, 1.0), tm)
tt = t_(4.0); mc += lpf(noise(4.0), 300) * 0.25 * (tt / 4.0)
save('morph_cracks', mc, 0.8)
tt = t_(1.2); wp = bpf(noise(1.2), 1400, 3) * np.abs(np.sin(np.pi * tt / 1.2)) ** 3
save('wiper_loop', loopify(wp + thud(1.2, 60, 50, 0.1) * 0.0, 0.05), 0.25)
tt = t_(2.5); rg = np.zeros(len(tt))
for k in range(3): rg += np.sin(2 * np.pi * (80 + 20 * k) * tt + rng.uniform(0, 6)) * np.exp(-tt / 1.6) * (0.5 ** k)
save('heartbeat_hit', rg + thud(2.5, 50, 35, 0.3), 0.6)
print('ending sounds added')

# ---------------------------------------------------------------- chapter one
def mx(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[:len(x)] += x
    return o
# gunshot: a sharp crack, a low body, a short room tail
gs = np.zeros(int(1.4 * SR))
place(gs, hpf(noise(0.06), 1500) * np.exp(-t_(0.06) / 0.012) * 2.0, 0.0)
place(gs, thud(0.5, 120, 45, 1.6) * 1.4, 0.0)
place(gs, lpf(noise(1.3), 1200) * np.exp(-t_(1.3) / 0.25) * 0.5, 0.01)
save('gunshot', gs, 0.98)
cl = hpf(noise(0.05), 2500) * np.exp(-t_(0.05) / 0.004)
save('gun_cock', np.concatenate([cl, np.zeros(int(0.08 * SR)), hpf(noise(0.05), 2000) * np.exp(-t_(0.05) / 0.006)]), 0.6)
# the flash: a pressure swell, a high whine, a deep boom when it peaks
tt = t_(3.2); fl = lpf(noise(3.2), 160) * np.minimum(1, tt / 0.6) * np.exp(-np.maximum(0, tt - 0.8) / 0.7) * 1.5
fl += np.sin(2 * np.pi * np.cumsum(np.linspace(2400, 5200, len(tt))) / SR) * np.exp(-tt / 0.9) * 0.15
place(fl, thud(2.0, 45, 22, 0.6) * 1.6, 0.55)
save('flash_boom', fl, 0.95)
# headlight: crackling sputter, flickers, then the metallic CRACK
hl = np.zeros(int(1.9 * SR))
for i in range(14): place(hl, bpf(noise(0.03), 3200, 3) * np.exp(-t_(0.03) / 0.008) * rng.uniform(0.2, 0.7), 0.05 + i * 0.075 + rng.uniform(0, 0.03))
place(hl, hpf(noise(0.08), 2000) * np.exp(-t_(0.08) / 0.01) * 2, 1.25); place(hl, np.sin(2 * np.pi * 2900 * t_(0.25)) * np.exp(-t_(0.25) / 0.05) * 0.6, 1.25)
save('headlight_crack', hl, 0.9)
# jumpscare: everything at once
js = np.zeros(int(1.6 * SR))
place(js, thud(1.2, 60, 28, 2.0) * 1.6, 0.0)
place(js, hpf(noise(0.4), 700) * np.exp(-t_(0.4) / 0.09) * 1.5, 0.0)
tt = t_(1.1); scr = np.tanh(3 * np.sin(2 * np.pi * np.cumsum(1300 + 500 * np.sin(2 * np.pi * 9 * tt)) / SR)) * np.exp(-tt / 0.45)
place(js, bpf(scr, 1700, 1.5) * 1.2 + scr * 0.5, 0.02)
save('jumpscare_hit', js, 0.99)
# Louis: a low wet growl loop, nails on siding, rattles, pounding
tt = t_(3.05); gr = np.tanh(2.5 * np.sin(2 * np.pi * np.cumsum(62 + 14 * np.sin(2 * np.pi * 0.7 * tt) + 8 * rng.normal(size=len(tt)).cumsum() / 900) / SR))
gr = lpf(gr * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 0.45 * tt))) + lpf(noise(3.05), 500) * 0.4, 900)
save('growl_loop', loopify(gr, 0.05), 0.55)
tt = t_(1.6); scr2 = bpf(noise(1.6), 2600, 5) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 6 * tt))) * np.minimum(1, tt / 0.1) * np.minimum(1, (1.6 - tt) / 0.3)
save('siding_scratch', mx(scr2, lpf(noise(1.6), 400) * 0.2), 0.55)
dr = np.zeros(int(1.2 * SR))
for i in range(7): place(dr, mx(thud(0.12, 160, 90, 0.9), hpf(noise(0.06), 1500) * np.exp(-t_(0.06) / 0.01) * 0.6) * rng.uniform(0.5, 1), i * 0.15 + rng.uniform(0, 0.03))
save('door_rattle', dr, 0.85)
save('door_pound', mx(thud(0.55, 75, 38, 1.4), hpf(noise(0.2), 900) * np.exp(-t_(0.2) / 0.03) * 0.5), 0.95)
save('door_slam', mx(thud(0.6, 95, 40, 1.2), hpf(noise(0.3), 1200) * np.exp(-t_(0.3) / 0.03) * 0.7), 0.9)
tt = t_(2.6); ws = lpf(noise(2.6), 260) * (0.7 + 0.3 * np.sin(2 * np.pi * 7 * tt)) + bpf(noise(2.6), 120, 2) * 0.8
save('wardrobe_scrape', ws * np.minimum(1, tt / 0.2) * np.minimum(1, (2.6 - tt) / 0.3), 0.85)
save('dial_click', hpf(noise(0.03), 3000) * np.exp(-t_(0.03) / 0.004), 0.5)
save('lock_open', np.concatenate([hpf(noise(0.04), 2500) * np.exp(-t_(0.04) / 0.006), np.zeros(int(0.05 * SR)), thud(0.2, 300, 180, 0.6)]), 0.7)
kj = np.zeros(int(0.5 * SR))
for f_ in (3200, 4100, 5200, 3700): place(kj, tinkle(0.35, f_) * rng.uniform(0.3, 0.8), rng.uniform(0, 0.12))
save('keys_jingle', kj, 0.5)
tt = t_(2.0); save('steam_loop', loopify(hpf(noise(2.0), 2500) * (0.8 + 0.2 * np.sin(2 * np.pi * 1.3 * tt)), 0.1), 0.35)
# gravel footstep
gv = np.zeros(int(0.22 * SR))
for _ in range(9): place(gv, hpf(noise(0.02), 1800) * np.exp(-t_(0.02) / 0.004) * rng.uniform(0.3, 1), rng.uniform(0, 0.12))
place(gv, thud(0.12, 90, 60, 0.3) * 0.5, 0.0)
save('step_gravel', gv, 0.5)
# phone: US ringback, the voicemail beep, a dead line
tt = t_(4.0); rb = (np.sin(2 * np.pi * 440 * tt) + np.sin(2 * np.pi * 480 * tt)) * (tt < 2.0)
save('phone_ringback', lpf(rb, 1800), 0.35)
tt = t_(0.5); save('voicemail_beep', np.sin(2 * np.pi * 1000 * tt) * np.minimum(1, (0.5 - tt) / 0.02), 0.35)
tt = t_(2.0); save('phone_static', bpf(noise(2.0), 1500, 1.5) * (0.6 + 0.4 * (rng.uniform(size=len(tt)) > 0.97)), 0.4)
# the emergency broadcast: three long dual tones, then the TV's static bed
eas = np.zeros(int(3.6 * SR))
for i in range(3):
    tt = t_(0.95); place(eas, (np.sin(2 * np.pi * 853 * tt) + np.sin(2 * np.pi * 960 * tt)) * np.minimum(1, np.minimum(tt, 0.95 - tt) / 0.01), i * 1.2)
save('eas_tones', eas, 0.5)
save('tv_static_loop', loopify(hpf(noise(2.05), 1200) * 0.8, 0.05), 0.3)
save('tv_on', np.concatenate([hpf(noise(0.08), 3000) * np.exp(-t_(0.08) / 0.02), np.sin(2 * np.pi * 7867 * t_(0.3)) * 0.05]), 0.5)
# small things in the house
save('drawer_open', mx(bpf(noise(0.5), 600, 2) * np.exp(-t_(0.5) / 0.2), thud(0.15, 120, 80, 0.5)), 0.6)
save('item_get', np.sign(np.sin(2 * np.pi * np.where(t_(0.25) < 0.1, 523, 784) * t_(0.25))) * np.exp(-t_(0.25) / 0.12) * 0.5, 0.35)
print('chapter one sounds added')

# ---------------------------------------------------------------- chapter one, parts 7-8: Louis's house, the road out
tt = t_(0.7); rip = bpf(noise(0.7), 2200, 1.2) * (0.5 + 0.5 * (rng.uniform(size=len(tt)) > 0.6)) * np.minimum(1, tt / 0.03) * np.minimum(1, (0.7 - tt) / 0.08)
save('tape_rip', mx(rip, hpf(noise(0.7), 4000) * 0.3 * np.exp(-tt / 0.3)), 0.6)
tt = t_(1.1); cr = np.sin(2 * np.pi * np.cumsum(180 + 60 * np.sin(2 * np.pi * 1.4 * tt) + 40 * rng.normal(size=len(tt)).cumsum() / 400) / SR)
cr = bpf(np.sign(cr) * 0.5 + bpf(noise(1.1), 300, 3) * 0.6, 380, 2.5) * np.minimum(1, tt / 0.15) * np.minimum(1, (1.1 - tt) / 0.25)
save('floor_creak', cr, 0.5)
save('thud_upstairs', mx(lpf(thud(0.7, 70, 34, 1.0), 400), np.zeros(int(0.35 * SR)), cr[: int(0.6 * SR)] * 0.5), 0.7)
tt = t_(4.0); wd = lpf(noise(4.0), 500) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.25 * tt) ** 2) + bpf(noise(4.0), 900, 3) * 0.25 * np.abs(np.sin(2 * np.pi * 0.6 * tt))
save('wind_loop', loopify(wd, 0.3), 0.45)
def far(x, fc=1300, delay=0.23, fb=0.35):
    y = lpf(x, fc); out = np.concatenate([y, np.zeros(int(1.2 * SR))])
    for k in range(1, 4): place(out, y * fb ** k, delay * k)
    return out
save('distant_scream', far(scream(1.8, 520)), 0.35)
save('distant_scream2', far(scream(1.2, 640, 8.0), 1100, 0.3), 0.3)
save('car_key', mx(tinkle(0.2, 3600) * 0.6, np.concatenate([np.zeros(int(0.15 * SR)), hpf(noise(0.05), 2000) * np.exp(-t_(0.05) / 0.008)])), 0.5)
tt = t_(1.2); bz = np.sign(np.sin(2 * np.pi * 120 * tt)) * 0.3 * (rng.uniform(size=len(tt)) > 0.4) * np.minimum(1, (1.2 - tt) / 0.2)
save('headlight_buzz', mx(lpf(bz, 2500), hpf(noise(1.2), 3000) * 0.08), 0.4)
print('chapter one part 7-8 sounds added')
