"""Original 70-second score for Little Bloom's extended island film.

Pure synthesis: no samples, external audio, services, or generative API.
The rounded piano and stereo reflections continue the first film's sound;
the new through-composed arrangement follows daylight, dusk, stars, a coastal
journey, and a gently resolving coda. Outputs 48 kHz stereo PCM16.
"""

from pathlib import Path
import json
import wave

import numpy as np


RATE = 48_000
DURATION = 70.0
FRAMES = int(RATE * DURATION)
OUTPUT = Path(__file__).with_name("music.wav")
mix = np.zeros((FRAMES, 2), dtype=np.float64)


def hz(midi):
    return 440.0 * 2.0 ** ((midi - 69) / 12.0)


def place(signal, start, gain, pan):
    offset = max(0, int(round(start * RATE)))
    length = min(len(signal), FRAMES - offset)
    if length <= 0:
        return
    angle = (pan + 1.0) * np.pi / 4.0
    stereo = np.array([np.cos(angle), np.sin(angle)])
    mix[offset : offset + length] += signal[:length, None] * stereo * gain


def soft_key(midi, length=3.8):
    """Same soft piano body as v1; no sharp sampled hammer transient."""
    t = np.arange(int(length * RATE), dtype=np.float64) / RATE
    frequency = hz(midi)
    signal = np.sin(2 * np.pi * frequency * t) * np.exp(-t / 1.22)
    signal += 0.22 * np.sin(2 * np.pi * frequency * 2.002 * t) * np.exp(-t / 0.68)
    signal += 0.065 * np.sin(2 * np.pi * frequency * 3.001 * t) * np.exp(-t / 0.36)
    signal += 0.021 * np.sin(2 * np.pi * frequency * 4.004 * t) * np.exp(-t / 0.21)
    attack = 1 - np.exp(-t / 0.021)
    tail = np.minimum(1.0, np.maximum(0.0, (length - t) / 0.4)) ** 2
    return signal * attack * tail


def soft_pad(midi, length):
    t = np.arange(int(length * RATE), dtype=np.float64) / RATE
    frequency = hz(midi)
    signal = (
        np.sin(2 * np.pi * frequency * t)
        + 0.27 * np.sin(2 * np.pi * frequency * 1.0018 * t)
        + 0.12 * np.sin(2 * np.pi * frequency * 2 * t)
    ) / 1.39
    attack = np.sin(np.minimum(t / 1.25, 1) * np.pi / 2) ** 2
    release = np.sin(np.minimum((length - t) / 2.15, 1) * np.pi / 2) ** 2
    return signal * attack * release


def soft_pluck(midi, length=2.4):
    """A faint nylon-like answer, warmer and shorter than the piano."""
    t = np.arange(int(length * RATE), dtype=np.float64) / RATE
    frequency = hz(midi)
    body = np.sin(2 * np.pi * frequency * t) * np.exp(-t / 0.76)
    body += 0.15 * np.sin(2 * np.pi * frequency * 2.001 * t) * np.exp(-t / 0.29)
    body += 0.05 * np.sin(2 * np.pi * frequency * 3.002 * t) * np.exp(-t / 0.17)
    attack = 1 - np.exp(-t / 0.012)
    tail = np.minimum(1.0, np.maximum(0.0, (length - t) / 0.3)) ** 2
    return body * attack * tail


# Every phrase has its own voicing, arpeggio direction, density and melody.
# Timing is aligned to the film's chapter boundaries, not a repeated audio loop.
# start, duration, pad voicing, piano arpeggio, accompaniment gain
phrases = [
    (0.0, 5.0, [48, 55, 59, 62], [48, 55, 62, 64, 67, 62], 0.165),
    (5.0, 8.0, [45, 52, 55, 59], [45, 52, 59, 64, 60, 55, 52], 0.144),
    (13.0, 8.0, [41, 48, 52, 57], [41, 48, 57, 60, 64, 57], 0.123),
    (21.0, 6.0, [48, 55, 59, 64], [48, 55, 59, 62, 67, 64, 62, 55], 0.178),
    (27.0, 6.0, [47, 50, 55, 62], [47, 55, 62, 67, 62, 59, 55, 50], 0.176),
    (33.0, 6.0, [45, 52, 55, 60], [45, 52, 60, 64, 67, 64, 60, 55], 0.168),
    (39.0, 6.0, [41, 48, 52, 57], [41, 48, 57, 60, 64, 60, 57, 52], 0.180),
    (45.0, 6.0, [50, 53, 57, 64], [50, 57, 60, 64, 69, 65, 64, 57], 0.173),
    (51.0, 6.0, [43, 50, 55, 60], [43, 50, 57, 60, 62, 59, 55, 50], 0.151),
    (57.0, 6.0, [41, 48, 52, 57], [41, 48, 55, 57, 64, 60], 0.141),
    (63.0, 7.0, [48, 55, 60, 64], [48, 55, 60, 64], 0.133),
]

for phrase_index, (start, duration, voicing, arpeggio, gain) in enumerate(phrases):
    pad_duration = min(duration + 1.2, DURATION - start)
    pad_gain = 0.029 if 5 <= start < 21 else 0.035
    for index, pitch in enumerate(voicing):
        place(soft_pad(pitch, pad_duration), start, pad_gain, (index - 1.5) * 0.28)

    # The coda stops playing new notes early, allowing an audible natural tail.
    playing_duration = 3.4 if start == 63 else duration - 0.45
    step = playing_duration / len(arpeggio)
    for index, pitch in enumerate(arpeggio):
        microtime = (0, 0.016, -0.009, 0.008, -0.004)[(index + phrase_index) % 5]
        velocity = (1.0, 0.76, 0.79, 0.91, 0.84, 0.77, 0.82, 0.72)[index % 8]
        pan = (-0.20, 0.13, -0.05, 0.23)[(index + phrase_index) % 4]
        place(soft_key(pitch), start + 0.12 + index * step + microtime,
              gain * velocity, pan)

# Original melody: airy opening, descending dusk, a few notes under the stars,
# a more legato coastal phrase, then a simple final E-D-C resolution.
melody = [
    (1.65, 67, 0.085), (3.15, 69, 0.072), (4.25, 67, 0.068),
    (6.90, 64, 0.078), (9.10, 62, 0.070), (11.00, 60, 0.061),
    (14.60, 64, 0.062), (17.20, 67, 0.057), (19.15, 64, 0.054),
    (22.65, 67, 0.098), (24.10, 71, 0.084), (25.65, 69, 0.078),
    (28.60, 67, 0.093), (30.15, 62, 0.077), (31.45, 64, 0.078),
    (34.20, 64, 0.084), (35.80, 67, 0.091), (37.15, 72, 0.078),
    (40.50, 69, 0.094), (42.00, 67, 0.083), (43.25, 64, 0.076),
    (46.45, 65, 0.088), (47.90, 69, 0.086), (49.30, 72, 0.072),
    (52.60, 69, 0.080), (54.20, 67, 0.069), (55.30, 62, 0.066),
    (58.60, 64, 0.072), (60.00, 62, 0.064), (61.45, 60, 0.060),
    (64.10, 64, 0.064), (65.00, 62, 0.058), (66.10, 60, 0.053),
]
for index, (start, pitch, gain) in enumerate(melody):
    place(soft_key(pitch, 4.0), start, gain, 0.09 if index % 2 == 0 else -0.10)

# Soft plucked counterpoints appear only in the travelling middle chapter.
# Each little answer differs, and leaves a breath before the following phrase.
answers = [
    (23.25, 60), (24.75, 64), (26.10, 67),
    (29.25, 59), (30.75, 62), (32.10, 67),
    (35.15, 60), (36.65, 64), (38.00, 67),
    (41.10, 57), (42.75, 60), (44.05, 64),
    (47.20, 60), (48.70, 64), (50.10, 65),
    (53.30, 59), (54.85, 62),
]
for index, (start, pitch) in enumerate(answers):
    place(soft_pluck(pitch), start, 0.047 + (index % 3) * 0.004,
          -0.33 if index % 2 == 0 else 0.32)

# Quiet frozen-source stereo room; no recursive feedback or long ringing tail.
dry = mix.copy()
for delay, gain in [(0.083, 0.11), (0.147, 0.075), (0.229, 0.045), (0.337, 0.025)]:
    shift = int(delay * RATE)
    mix[shift:] += dry[:-shift, ::-1] * gain
del dry

t = np.arange(FRAMES, dtype=np.float64) / RATE
fade_in = np.sin(np.minimum(t / 1.1, 1) * np.pi / 2) ** 2
fade_out = np.sin(np.minimum((DURATION - t) / 3.1, 1) * np.pi / 2) ** 2
envelope = (fade_in * fade_out)[:, None]
mix *= envelope
mix -= mix.mean(axis=0, keepdims=True)
mix *= envelope
mix *= 10 ** (-13.5 / 20.0) / np.max(np.abs(mix))
mix[0] = 0
mix[-1] = 0

pcm = np.round(mix * 32767).astype("<i2")
with wave.open(str(OUTPUT), "wb") as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(RATE)
    wav.writeframes(pcm.tobytes())

with wave.open(str(OUTPUT), "rb") as wav:
    decoded = np.frombuffer(wav.readframes(wav.getnframes()), dtype="<i2").reshape(-1, 2)
    normalized = decoded.astype(np.float64) / 32768
    peak = np.max(np.abs(normalized))
    rms = np.sqrt(np.mean(normalized * normalized))
    assert wav.getnframes() == FRAMES
    assert wav.getframerate() == RATE and wav.getnchannels() == 2 and wav.getsampwidth() == 2
    assert -15 <= 20 * np.log10(peak) <= -12
    assert not np.any(decoded[0]) and not np.any(decoded[-1])
    assert not np.any((decoded == -32768) | (decoded == 32767))
    print(json.dumps({
        "file": str(OUTPUT.resolve()), "seconds": wav.getnframes() / wav.getframerate(),
        "sample_rate": wav.getframerate(), "channels": wav.getnchannels(),
        "bits_per_sample": wav.getsampwidth() * 8,
        "peak_dbfs": round(float(20 * np.log10(peak)), 3),
        "rms_dbfs": round(float(20 * np.log10(rms)), 3),
        "clipped_samples": int(np.count_nonzero((decoded == -32768) | (decoded == 32767))),
        "first_samples": decoded[0].tolist(), "last_samples": decoded[-1].tolist(),
        "phrases": len(phrases), "melody_notes": len(melody),
        "method": "original synthesis; no external audio or API; no repeated audio loop",
    }, ensure_ascii=False))
