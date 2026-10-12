"""Render an original, quiet 24-second instrumental bed using only NumPy.

No samples, external music, voice, or API calls. Soft arpeggios over
Cmaj7 / Am7 / Fmaj7 / Gsus2, with gentle stereo room reflections.
"""

from pathlib import Path
import json
import wave

import numpy as np


RATE = 48_000
DURATION = 24.0
FRAMES = int(RATE * DURATION)
OUTPUT = Path(__file__).with_name("music.wav")
mix = np.zeros((FRAMES, 2), dtype=np.float64)


def hz(midi):
    return 440.0 * 2.0 ** ((midi - 69) / 12.0)


def place(signal, start, gain, pan):
    offset = int(start * RATE)
    length = min(len(signal), FRAMES - offset)
    if length <= 0:
        return
    angle = (pan + 1.0) * np.pi / 4.0
    stereo = np.array([np.cos(angle), np.sin(angle)])
    mix[offset : offset + length] += signal[:length, None] * stereo * gain


def soft_key(midi, length=3.2):
    t = np.arange(int(length * RATE), dtype=np.float64) / RATE
    frequency = hz(midi)
    # A soft, rounded fundamental; upper partials fade faster than the body.
    signal = np.sin(2 * np.pi * frequency * t) * np.exp(-t / 1.22)
    signal += 0.22 * np.sin(2 * np.pi * frequency * 2.002 * t) * np.exp(-t / 0.68)
    signal += 0.065 * np.sin(2 * np.pi * frequency * 3.001 * t) * np.exp(-t / 0.36)
    signal += 0.021 * np.sin(2 * np.pi * frequency * 4.004 * t) * np.exp(-t / 0.21)
    attack = 1 - np.exp(-t / 0.021)
    tail = np.minimum(1.0, np.maximum(0.0, (length - t) / 0.32)) ** 2
    return signal * attack * tail


def soft_pad(midi, length=7.0):
    t = np.arange(int(length * RATE), dtype=np.float64) / RATE
    frequency = hz(midi)
    signal = (
        np.sin(2 * np.pi * frequency * t)
        + 0.27 * np.sin(2 * np.pi * frequency * 1.0018 * t)
        + 0.12 * np.sin(2 * np.pi * frequency * 2 * t)
    ) / 1.39
    attack = np.sin(np.minimum(t / 1.15, 1) * np.pi / 2) ** 2
    release = np.sin(np.minimum((length - t) / 1.75, 1) * np.pi / 2) ** 2
    return signal * attack * release


chords = [
    ([48, 52, 55, 59], [48, 55, 59, 64, 67, 64, 59, 55]),
    ([45, 48, 52, 55], [45, 52, 55, 60, 64, 60, 55, 52]),
    ([41, 45, 48, 52], [41, 48, 52, 57, 60, 57, 52, 48]),
    ([43, 45, 50, 55], [43, 50, 55, 57, 62, 57, 55, 50]),
]
for section, (voicing, arpeggio) in enumerate(chords):
    start = section * 6.0
    for index, pitch in enumerate(voicing):
        place(soft_pad(pitch), start, 0.047, (index - 1.5) * 0.22)
    for index, pitch in enumerate(arpeggio):
        # Small fixed timing/velocity changes keep the accompaniment unhurried.
        offset = (0.0, 0.012, -0.009, 0.006)[index % 4]
        gain = (0.22, 0.17, 0.16, 0.19, 0.18, 0.15, 0.14, 0.16)[index]
        pan = (-0.22, 0.14, -0.06, 0.25)[index % 4]
        place(soft_key(pitch), start + 0.08 + index * 0.75 + offset, gain, pan)

# Sparse upper notes give the four chords a small original melodic contour.
for start, pitch, pan in [(2.3, 67, 0.12), (5.2, 64, -0.1),
                          (8.3, 64, 0.16), (11.2, 62, -0.12),
                          (14.3, 64, 0.10), (17.2, 60, -0.1),
                          (20.3, 62, 0.12), (22.0, 60, -0.06)]:
    place(soft_key(pitch, 3.6), start, 0.085, pan)

# Quiet, short reflections. Work from a frozen dry mix to avoid feedback.
dry = mix.copy()
for delay, gain in [(0.083, 0.11), (0.147, 0.075), (0.229, 0.045), (0.337, 0.025)]:
    shift = int(delay * RATE)
    mix[shift:] += dry[:-shift, ::-1] * gain

t = np.arange(FRAMES) / RATE
fade_in = np.sin(np.minimum(t / 0.8, 1) * np.pi / 2) ** 2
fade_out = np.sin(np.minimum((DURATION - t) / 1.9, 1) * np.pi / 2) ** 2
mix *= (fade_in * fade_out)[:, None]
mix -= mix.mean(axis=0, keepdims=True)
mix *= (fade_in * fade_out)[:, None]
mix *= 10 ** (-15.0 / 20.0) / np.max(np.abs(mix))

pcm = np.round(mix * 32767).astype("<i2")
with wave.open(str(OUTPUT), "wb") as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(RATE)
    wav.writeframes(pcm.tobytes())

with wave.open(str(OUTPUT), "rb") as wav:
    decoded = np.frombuffer(wav.readframes(wav.getnframes()), dtype="<i2").astype(np.float64) / 32768
    peak = np.max(np.abs(decoded))
    rms = np.sqrt(np.mean(decoded * decoded))
    print(json.dumps({
        "file": str(OUTPUT.resolve()), "seconds": wav.getnframes() / wav.getframerate(),
        "sample_rate": wav.getframerate(), "channels": wav.getnchannels(),
        "bits_per_sample": wav.getsampwidth() * 8,
        "peak_dbfs": round(float(20 * np.log10(peak)), 3),
        "rms_dbfs": round(float(20 * np.log10(rms)), 3),
        "clipped_samples": int(np.count_nonzero(np.abs(decoded) >= 1)),
        "first_samples": pcm[0].tolist(), "last_samples": pcm[-1].tolist(),
    }, ensure_ascii=False))
