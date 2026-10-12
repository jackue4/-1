"""Original 60 s miniature: Carousel Wishes / A Sea of Sand.

Entirely synthesized instruments, no samples, imported music, or external API.
48 kHz stereo PCM16; a bright music-box and piano opening, warm plucks at 30 s, starlit coda.
"""

from pathlib import Path
import json
import wave
import numpy as np

RATE = 48000
SECONDS = 60
FRAMES = RATE * SECONDS
ROOT = Path(__file__).resolve().parent
mix = np.zeros((FRAMES, 2), dtype=np.float64)
events = []


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def add(signal, start, gain, pan, instrument, pitch):
    offset = max(0, round(start * RATE))
    length = min(len(signal), FRAMES - offset)
    if length <= 0:
        return
    angle = (pan + 1) * np.pi / 4
    mix[offset:offset + length] += signal[:length, None] * np.array([np.cos(angle), np.sin(angle)]) * gain
    events.append({"time": round(start, 3), "instrument": instrument, "midi": pitch})


def piano(pitch, length=4.2):
    t = np.arange(round(length * RATE)) / RATE
    f = hz(pitch)
    decay = 1.7 - .009 * (pitch - 48)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / decay)
    y += .24 * np.sin(2 * np.pi * f * 2.0007 * t) * np.exp(-t / .71)
    y += .07 * np.sin(2 * np.pi * f * 3.0018 * t) * np.exp(-t / .39)
    y += .018 * np.sin(2 * np.pi * f * 4.0027 * t) * np.exp(-t / .23)
    return y * (1 - np.exp(-t / .017)) * np.clip((length-t)/.6, 0, 1)**2


def bell(pitch, length=4.6):
    t = np.arange(round(length * RATE)) / RATE
    f = hz(pitch)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / 1.5)
    y += .1 * np.sin(2 * np.pi * f * 2.756 * t) * np.exp(-t / .57)
    y += .025 * np.sin(2 * np.pi * f * 5.404 * t) * np.exp(-t / .32)
    return y * (1 - np.exp(-t/.009)) * np.clip((length-t)/.6, 0, 1)**2


def musicbox(pitch, length=3.4):
    t = np.arange(round(length * RATE)) / RATE
    f = hz(pitch)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / 1.25)
    y += .115 * np.sin(2 * np.pi * f * 2.002 * t) * np.exp(-t / .52)
    y += .035 * np.sin(2 * np.pi * f * 3.997 * t) * np.exp(-t / .31)
    return y * (1 - np.exp(-t / .008)) * np.clip((length-t)/.5, 0, 1)**2


def nylon(pitch, length=2.8):
    t = np.arange(round(length * RATE)) / RATE
    f = hz(pitch)
    y = np.sin(2*np.pi*f*t) * np.exp(-t/1.04)
    y += .25*np.sin(2*np.pi*f*2.001*t) * np.exp(-t/.43)
    y += .105*np.sin(2*np.pi*f*3.001*t) * np.exp(-t/.23)
    y += .028*np.sin(2*np.pi*f*4.002*t) * np.exp(-t/.14)
    return y * (1-np.exp(-t/.007)) * np.clip((length-t)/.4, 0, 1)**2


def pad(pitch, length):
    t = np.arange(round(length * RATE)) / RATE
    f = hz(pitch)
    y = (np.sin(2*np.pi*f*t) + .24*np.sin(2*np.pi*f*1.0013*t) + .1*np.sin(2*np.pi*f*1.999*t)) / 1.34
    attack = np.sin(np.minimum(t/1.7, 1)*np.pi/2)**2
    release = np.sin(np.clip((length-t)/2.1, 0, 1)*np.pi/2)**2
    return y*attack*release


# Twelve independently voiced five-second phrases. The 30 s modulation of
# instrumentation is aligned with the amusement-park-to-desert visual chapter boundary.
# start, chord, piano/pluck figuration
phrases = [
    (0,  [50,57,61,64], [50,57,64,66,69,64]),
    (5,  [47,54,57,62], [47,54,62,66,69,66]),
    (10, [43,50,54,59], [43,50,59,62,66,62]),
    (15, [45,52,59,62], [45,52,59,64,62,57]),
    (20, [42,50,57,61], [42,50,57,61,66,64]),
    (25, [43,50,54,62], [43,50,62,66,64,62]),
    (30, [50,57,62,66], [50,57,62,66,69,66,64,62]),
    (35, [47,54,57,62], [47,54,62,66,71,69,66,62]),
    (40, [43,50,54,61], [43,50,57,62,66,64,62,57]),
    (45, [40,47,54,59], [40,47,54,59,64,66,64,59]),
    (50, [45,52,55,61], [45,52,57,61,64,62,61,57]),
    (55, [50,57,62,66], [50,57,62,66]),
]

for n, (start, voicing, notes) in enumerate(phrases):
    duration = min(6.1, SECONDS-start)
    for j, pitch in enumerate(voicing):
        add(pad(pitch, duration), start, .029, (j-1.5)*.33, "warm pad", pitch)
    playtime = 2.9 if start == 55 else 4.4
    step = playtime/len(notes)
    for j, pitch in enumerate(notes):
        micro = [0,.016,-.007,.011,-.004,.007][(j+n)%6]
        velocity = [1,.76,.82,.88,.75,.81,.86,.74][j%8]
        onset = start+.13+j*step+micro
        if start < 30:
            add(piano(pitch), onset, .115*velocity, [-.22,.14,-.07,.2][j%4], "gentle piano", pitch)
            add(musicbox(pitch+12), onset+.022, .065*velocity, [.28,-.24,.16,-.19][j%4], "carousel music box", pitch+12)
        elif start == 55:
            add(piano(pitch), onset, .16*velocity, [-.22,.14,-.07,.2][j%4], "felt piano", pitch)
        else:
            add(nylon(pitch), onset, .14*velocity, [-.28,.18,-.12,.26][j%4], "warm nylon", pitch)
            if j in (0,4):
                add(piano(pitch-12 if pitch>60 else pitch), onset+.008, .064, -.05, "felt piano", pitch)

# Unhurried, through-composed original motif. Rests leave space for the scenes.
melody = [
    (1.5,69,.09),(3.0,73,.077),(4.25,71,.065),
    (6.8,69,.084),(8.1,66,.074),
    (11.6,67,.083),(13.2,66,.072),(14.15,62,.06),
    (16.5,64,.079),(18.4,69,.065),
    (21.6,66,.084),(23.0,69,.074),(24.25,73,.06),
    (26.1,71,.072),(27.45,69,.068),(28.7,66,.059),
    (31.7,69,.092),(32.9,74,.08),(34.2,73,.07),
    (36.5,71,.087),(37.9,69,.075),(39.15,66,.064),
    (41.65,67,.085),(43.15,69,.075),(44.3,66,.065),
    (46.5,64,.08),(48.15,66,.07),(49.25,69,.06),
    (51.3,67,.073),(52.45,64,.065),(53.65,61,.056),
    (55.4,66,.072),(56.35,64,.06),(57.3,62,.055),
]
for j, (start, pitch, gain) in enumerate(melody):
    add(piano(pitch, 4.6), start, gain*(.78 if start<30 else 1), .12 if j%2 else -.1, "piano melody", pitch)
    if start < 30:
        add(musicbox(pitch+12, 3.2), start+.01, gain*.46, -.18 if j%2 else .17, "carousel melody", pitch+12)

# Sparse upper bells suggest a carousel, then return over the final night sky.
for j, (start, pitch) in enumerate([(2.45,81),(7.5,78),(12.8,78),(18.85,76),(22.6,81),(27.95,78),(47.35,78),(52.0,76),(56.7,81)]):
    add(bell(pitch), start, .023 if start<30 else .019, -.36 if j%2 else .34, "carousel chime", pitch)

# Quiet answering plucks form the warm second chapter without percussion.
for j, (start, pitch) in enumerate([(30.85,74),(33.55,69),(36.2,66),(38.6,62),(41.05,69),(43.7,66),(46.15,71),(48.75,66),(51.1,69),(53.95,64)]):
    add(nylon(pitch, 2.1), start, .039, -.34 if j%2 else .33, "nylon answer", pitch)

# Stereo room reflections use a frozen dry signal, not recursive feedback.
dry = mix.copy()
for delay, gain in [(.079,.13),(.137,.085),(.211,.06),(.313,.037),(.433,.022)]:
    shift = round(delay*RATE)
    mix[shift:] += dry[:-shift, ::-1]*gain
del dry

t = np.arange(FRAMES)/RATE
fade = (np.sin(np.minimum(t/.8,1)*np.pi/2)**2 * np.sin(np.minimum((SECONDS-t)/2.8,1)*np.pi/2)**2)[:,None]
mix -= mix.mean(axis=0,keepdims=True)
mix *= fade
mix *= 10**(-8.5/20)/np.max(np.abs(mix))
mix[0] = 0
mix[-1] = 0
pcm = np.round(mix*32767).astype('<i2')
output = ROOT/'music.wav'
with wave.open(str(output),'wb') as audio:
    audio.setnchannels(2)
    audio.setsampwidth(2)
    audio.setframerate(RATE)
    audio.writeframes(pcm.tobytes())

with wave.open(str(output),'rb') as audio:
    decoded = np.frombuffer(audio.readframes(audio.getnframes()),dtype='<i2').reshape(-1,2)
    norm = decoded.astype(np.float64)/32768
    peak = float(np.max(np.abs(norm)))
    rms = float(np.sqrt(np.mean(norm**2)))
    clipped = int(np.count_nonzero((decoded==-32768)|(decoded==32767)))
    assert audio.getnframes() == FRAMES and audio.getframerate() == RATE
    assert audio.getnchannels() == 2 and audio.getsampwidth() == 2
    assert clipped == 0 and not decoded[0].any() and not decoded[-1].any()
    assert -8.6 < 20*np.log10(peak) < -8.4
    report = {
        'file': str(output), 'seconds': SECONDS, 'frames': audio.getnframes(),
        'sample_rate': RATE, 'channels': 2, 'bits_per_sample': 16,
        'peak_dbfs': round(20*np.log10(peak),3), 'rms_dbfs': round(20*np.log10(rms),3),
        'clipped_samples': clipped, 'first_samples': decoded[0].tolist(), 'last_samples': decoded[-1].tolist(),
        'chapter_boundaries_seconds': [0,30,55,60], 'chapters': ['bright carousel music box and gentle piano', 'warm desert nylon plucks', 'starlit piano resolution'], 'phrases': len(phrases),
        'events': len(events), 'method': 'original instrument synthesis; no samples, external music or API',
        'segment_rms_dbfs': [round(float(20*np.log10(np.sqrt(np.mean(norm[i*RATE:(i+5)*RATE]**2)))),3) for i in range(0,60,5)]
    }
(ROOT/'music-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
