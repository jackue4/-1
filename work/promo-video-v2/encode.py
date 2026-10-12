"""Encode the 70-second extended promo, then decode and verify the deliverables.

Run with a Python environment containing Pillow and NumPy. The local FFmpeg
package/binary is reused from ../promo-video/vendor. No browser is needed.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import struct
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "promo-video" / "vendor"))
import imageio_ffmpeg
from imageio_ffmpeg._parsing import parse_ffmpeg_header

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
OUT = HERE.parent.parent / "outputs" / "promo"
VIDEO = OUT / "little-bloom-xiaohongshu-extended.mp4"
POSTER = OUT / "little-bloom-poster-extended.jpg"
WIDTH, HEIGHT, FPS = 1080, 1920, 30
TRIM_START, FADE = 0.25, 0.16
EXPECTED_SHOTS, EXPECTED_SECONDS = 15, 70


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def metadata(path):
    # A zero-frame null output lets FFmpeg terminate normally after reporting
    # its stream headers; closing a raw-frame pipe early can block on Windows.
    probe = subprocess.run([FFMPEG, "-nostdin", "-threads", "2", "-i", str(path),
                            "-map", "0:v:0", "-frames:v", "0", "-f", "null", "-"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)
    return parse_ffmpeg_header(probe.stderr.decode("utf-8", errors="replace"))


def decoded_timing(path):
    # MediaRecorder's streaming WebM normally has Duration: N/A. Obtain actual
    # media timestamps and the number of decoded source frames, without using
    # capture wall-clock time or fabricating a duration from the planned edit.
    decoded = subprocess.run([
        FFMPEG, "-hide_banner", "-nostdin", "-loglevel", "error", "-xerror",
        "-stats_period", "3600", "-progress", "pipe:1", "-threads", "2",
        "-i", str(path), "-map", "0:v:0", "-an", "-fps_mode", "passthrough",
        "-f", "null", "-"
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    values = {}
    for line in decoded.stdout.decode("ascii", errors="replace").splitlines():
        if "=" in line:
            key, value = line.split("=", 1)
            values[key] = value
    require(values.get("progress") == "end", f"Media decode did not finish: {path.name}")
    frames = int(values.get("frame", "0"))
    seconds = int(values.get("out_time_us", "0")) / 1_000_000
    require(frames > 0 and seconds > 0, f"No decoded media timing for {path.name}")
    return frames, seconds


def compact_sample(sample):
    return {key: sample[key] for key in (
        "at", "timeHour", "night", "sunset", "nightSky", "streetLights", "homes"
    ) if key in sample}


def prepare():
    shots = read_json(HERE / "shots.json")
    require(isinstance(shots, list) and len(shots) == EXPECTED_SHOTS,
            "shots.json must contain exactly 15 shots")
    durations = [float(shot["duration"]) for shot in shots]
    require(all(math.isfinite(d) and d > 2 * FADE for d in durations),
            "All shot durations must be positive finite numbers")
    require(abs(sum(durations) - EXPECTED_SECONDS) < 1e-8,
            f"Expected 70 seconds, received {sum(durations)}")
    require(all(abs(d * FPS - round(d * FPS)) < 1e-8 for d in durations),
            "Every shot duration must have an integer number of frames at 30 fps")

    capture = read_json(HERE / "raw" / "capture-report.json")
    captures = {int(row["index"]): row for row in capture["shots"]}
    music = HERE / "music.wav"
    require(music.is_file(), "music.wav is missing")
    with wave.open(str(music), "rb") as wav:
        music_info = {"sampleRate": wav.getframerate(), "channels": wav.getnchannels(),
                      "samples": wav.getnframes(),
                      "duration": wav.getnframes() / wav.getframerate()}
    require(music_info["duration"] >= EXPECTED_SECONDS - 1 / 48000,
            "music.wav is shorter than the finished video")

    sources, selections, meteors, day_night = [], [], [], []
    offset = 0.0
    for index, (shot, duration) in enumerate(zip(shots, durations)):
        name = f"{index + 1:02}.webm"
        raw = HERE / "raw" / name
        require(raw.is_file() and raw.stat().st_size > 0, f"Missing recording: {raw}")
        require(index in captures, f"No capture evidence for {name}")
        recorded = captures[index]
        require(recorded.get("name") == name, f"Capture name mismatch for {name}")
        require(recorded.get("world") == shot["world"] and
                recorded.get("view") == shot["view"], f"Capture view mismatch for {name}")
        require(recorded.get("bytes") == raw.stat().st_size,
                f"Recording changed after capture-report was saved: {name}")
        info = metadata(raw)
        require(tuple(info.get("source_size", info["size"])) == (WIDTH, HEIGHT),
                f"{name} must already be portrait 1080x1920; refusing to stretch it")
        decoded_frames = None
        timing_source = "container metadata"
        if not math.isfinite(info.get("duration", 0)) or info.get("duration", 0) <= 0:
            print(f"Decoding source timing: {name}", flush=True)
            decoded_frames, info["duration"] = decoded_timing(raw)
            timing_source = "full source decode and media timestamps"
        require(info.get("duration", 0) >= duration + TRIM_START - 0.04,
                f"{name} is too short for the requested trim")
        require(abs(float(recorded.get("editedDuration", duration)) - duration) < 1e-8,
                f"Capture duration mismatch for {name}")
        samples = sorted(recorded.get("samples", []), key=lambda s: float(s["at"]))
        kept = [s for s in samples if TRIM_START <= s["at"] < TRIM_START + duration]
        require(kept, f"No retained scene-state samples for {name}")
        entry = {"index": index, "name": name, "world": shot["world"],
                 "view": shot["view"], "label": shot["label"], "start": offset,
                 "duration": duration, "frames": round(duration * FPS),
                 "rawDuration": info["duration"], "rawBytes": raw.stat().st_size,
                 "rawTimingSource": timing_source, "rawDecodedFrames": decoded_frames,
                 "trimStart": TRIM_START, "fadeIn": FADE, "fadeOut": FADE,
                 "continuousDayNight": bool(shot.get("dayNight"))}
        selected_time = duration / 2

        if shot.get("meteor"):
            active = [s for s in samples if s.get("nightSky", {}).get("meteorActive")]
            require(active, f"No actual meteor was captured in {name}")
            require(all(TRIM_START <= s["at"] < TRIM_START + duration for s in active),
                    f"The requested trim would remove meteor samples in {name}; re-record it")
            # Never fade a recorded shooting star: disable an edge fade if the
            # meteor overlaps it, rather than moving or shortening the shot.
            if active[0]["at"] - TRIM_START < FADE + 0.2:
                entry["fadeIn"] = 0
            if TRIM_START + duration - active[-1]["at"] < FADE + 0.2:
                entry["fadeOut"] = 0
            middle = active[len(active) // 2]
            selected_time = float(middle["at"]) - TRIM_START
            meteors.append({"shot": index + 1, "retainedActiveSamples": len(active),
                            "firstOutputTime": offset + active[0]["at"] - TRIM_START,
                            "lastOutputTime": offset + active[-1]["at"] - TRIM_START,
                            "selectedSample": compact_sample(middle)})

        selections.append({"shot": index + 1, "kind": "meteor" if shot.get("meteor") else "shot",
                           "label": shot["label"],
                           "frame": round((offset + selected_time) * FPS)})
        if shot.get("dayNight"):
            # Three additional stills document the real, uninterrupted lighting
            # transition; these do not add edits or extra frames to the video.
            clean = [s for s in kept if TRIM_START + FADE <= s["at"] <=
                     TRIM_START + duration - FADE]
            require(clean, f"No clean daylight-transition samples in {name}")
            morning = min(clean, key=lambda s: abs(s.get("timeHour", 99) - 8.5)
                          + s.get("night", 1) * 2 + abs(s["at"] - 1.0) * 0.01)
            dusk = min(clean, key=lambda s: abs(s.get("timeHour", 99) - 17.5)
                       + abs(1 - s.get("sunset", 0)) * 0.5)
            night = min(clean, key=lambda s: abs(s.get("timeHour", 99) - 22)
                        + abs(1 - s.get("night", 0)))
            require(morning.get("night", 1) < .15 and dusk.get("sunset", 0) > .5
                    and night.get("night", 0) > .9,
                    f"Morning, sunset and night are not all present in {name}")
            phases = []
            for label, sample in [("清晨 · 08:30", morning), ("黄昏 · 17:30", dusk),
                                  ("星夜 · 22:00", night)]:
                frame = round((offset + sample["at"] - TRIM_START) * FPS)
                selections.append({"shot": index + 1, "kind": "day-night-detail",
                                   "label": label, "frame": frame})
                phases.append({"label": label, "frame": frame,
                               "sample": compact_sample(sample)})
            day_night.append({"shot": index + 1, "duration": duration,
                              "uninterrupted": True, "phases": phases})
        sources.append(entry)
        offset += duration
    require(len(meteors) > 0 and len(day_night) > 0,
            "The extended edit needs both a recorded meteor and a continuous day/night shot")
    return shots, sources, selections, meteors, day_night, music_info


def encode(sources, destination):
    args = [FFMPEG, "-hide_banner", "-nostdin", "-y", "-filter_complex_threads", "2"]
    for source in sources:
        args += ["-threads", "2", "-i", str(HERE / "raw" / source["name"])]
    args += ["-i", str(HERE / "music.wav")]
    filters = []
    for i, source in enumerate(sources):
        chain = [f"trim=start={TRIM_START}:duration={source['duration']}",
                 "setpts=PTS-STARTPTS", f"fps=fps={FPS}:start_time=0",
                 f"trim=end_frame={source['frames']}", f"setpts=N/({FPS}*TB)",
                 f"scale={WIDTH}:{HEIGHT}:flags=lanczos", "setsar=1", "format=yuv420p"]
        if source["fadeIn"]:
            chain.append(f"fade=t=in:st=0:d={source['fadeIn']}")
        if source["fadeOut"]:
            chain.append(f"fade=t=out:st={source['duration']-source['fadeOut']}:d={source['fadeOut']}")
        filters.append(f"[{i}:v:0]" + ",".join(chain) + f"[v{i}]")
    filters.append("".join(f"[v{i}]" for i in range(len(sources))) +
                   f"concat=n={len(sources)}:v=1:a=0[v]")
    args += ["-filter_complex", ";".join(filters), "-map", "[v]",
             "-map", f"{len(sources)}:a:0", "-c:v", "libx264", "-threads", "6",
             "-preset", "medium", "-crf", "19", "-profile:v", "high",
             "-pix_fmt", "yuv420p", "-fps_mode", "cfr", "-r", str(FPS),
             "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
             "-t", str(EXPECTED_SECONDS), "-movflags", "+faststart",
             "-metadata", "title=Little Bloom - Extended AI Creative Journal",
             "-metadata", "comment=Interactive scene recording; weather App concept, no real city weather data",
             str(destination)]
    with (HERE / "encode.log").open("w", encoding="utf-8") as log:
        subprocess.run(args, stdout=log, stderr=subprocess.STDOUT, check=True)


def check_faststart(path):
    boxes = []
    with path.open("rb") as source:
        while source.tell() < path.stat().st_size:
            start = source.tell()
            header = source.read(8)
            require(len(header) == 8, "Incomplete MP4 box header")
            size, kind = struct.unpack(">I4s", header)
            header_size = 8
            if size == 1:
                size = struct.unpack(">Q", source.read(8))[0]
                header_size = 16
            elif size == 0:
                size = path.stat().st_size - start
            require(size >= header_size, "Invalid MP4 box size")
            boxes.append(kind.decode("ascii", errors="replace"))
            source.seek(start + size)
    require("moov" in boxes and "mdat" in boxes and boxes.index("moov") < boxes.index("mdat"),
            "MP4 faststart is missing")
    return boxes


def validate_video(path, selections):
    requested = {item["frame"] for item in selections}
    pictures, frame_checks, count = {}, [], 0
    reader = imageio_ffmpeg.read_frames(str(path), pix_fmt="rgb24",
                                      input_params=["-threads", "4", "-xerror"])
    try:
        meta = next(reader)
        require(tuple(meta["size"]) == (WIDTH, HEIGHT), f"Wrong output dimensions: {meta}")
        require(abs(meta["fps"] - FPS) < .001, f"Wrong output frame rate: {meta}")
        require(abs(meta["duration"] - EXPECTED_SECONDS) <= 1 / FPS,
                f"Wrong output duration: {meta}")
        require(meta.get("codec") == "h264", f"Expected H.264 video: {meta}")
        require(meta.get("audio_codec") == "aac", f"Expected AAC audio: {meta}")
        for frame in reader:
            require(len(frame) == WIDTH * HEIGHT * 3, f"Incomplete decoded video frame {count}")
            if count in requested:
                data = np.frombuffer(frame, dtype=np.uint8).reshape(HEIGHT, WIDTH, 3)
                center = data[int(HEIGHT * .23):int(HEIGHT * .78),
                              int(WIDTH * .12):int(WIDTH * .88)]
                mean, spread = float(center.mean()), float(center.std())
                require(mean > 2 and spread > 6,
                        f"Scene region appears blank at frame {count}: mean={mean}, std={spread}")
                pictures[count] = Image.fromarray(data).copy()
                frame_checks.append({"frame": count, "time": round(count / FPS, 4),
                                     "sceneMean": round(mean, 3), "sceneStddev": round(spread, 3)})
            count += 1
    finally:
        reader.close()
    require(count == EXPECTED_SECONDS * FPS, f"Expected 2100 decoded frames; received {count}")
    require(set(pictures) == requested, "Some requested contact-sheet frames are missing")

    # Decode the entire AAC track too, not just its container metadata. This
    # detects damaged audio packets and verifies a non-silent stereo soundtrack.
    audio = subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-nostdin", "-xerror",
                            "-i", str(path), "-map", "0:a:0", "-vn", "-ac", "2", "-ar", "48000",
                            "-c:a", "pcm_s16le", "-f", "s16le", "pipe:1"],
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    require(len(audio.stdout) % 4 == 0, "Incomplete decoded stereo audio sample")
    pcm = np.frombuffer(audio.stdout, dtype="<i2").astype(np.float64) / 32768
    duration = len(audio.stdout) / (48000 * 2 * 2)
    rms = float(np.sqrt(np.mean(pcm * pcm)))
    require(abs(duration - EXPECTED_SECONDS) < .06, f"Audio duration mismatch: {duration}")
    require(rms > .001, "Decoded soundtrack is silent")
    audio_info = {"codec": "aac", "channels": 2, "sampleRate": 48000,
                  "decodedSampleFrames": len(audio.stdout) // 4,
                  "decodedDuration": duration, "rms": round(rms, 6),
                  "peak": round(float(np.abs(pcm).max()), 6), "fullDecodePassed": True}
    return meta, count, pictures, frame_checks, audio_info


def font(size):
    for path in [Path("C:/Windows/Fonts/msyh.ttc"), Path("C:/Windows/Fonts/simhei.ttf"),
                 Path("C:/Windows/Fonts/arial.ttf")]:
        if path.is_file():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def write_stills(selections, pictures):
    # Put all 15 main shots first; the final row additionally shows the three
    # lighting states within the uncut day/night shot.
    ordered = ([s for s in selections if s["kind"] != "day-night-detail"] +
               [s for s in selections if s["kind"] == "day-night-detail"])
    columns, thumb_w, thumb_h, caption_h = 5, 216, 384, 66
    rows = math.ceil(len(ordered) / columns)
    sheet = Image.new("RGB", (columns * thumb_w, rows * (thumb_h + caption_h)), "#edeedc")
    draw, body_font, small_font = ImageDraw.Draw(sheet), font(14), font(12)
    for i, selection in enumerate(ordered):
        x, y = (i % columns) * thumb_w, (i // columns) * (thumb_h + caption_h)
        thumbnail = pictures[selection["frame"]].resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        sheet.paste(thumbnail, (x, y))
        label = selection["label"]
        # Avoid text clipping in the small, annotated overview sheet.
        while len(label) > 1 and draw.textbbox((0, 0), label, font=body_font)[2] > thumb_w - 16:
            label = label[:-2] + "…"
        draw.text((x + 8, y + thumb_h + 7), label, font=body_font, fill="#34564b")
        suffix = " · 流星" if selection["kind"] == "meteor" else ""
        draw.text((x + 8, y + thumb_h + 31),
                  f"{selection['shot']:02} / {selection['frame']/FPS:.2f}s{suffix}",
                  font=small_font, fill="#5f7a70")
    sheet.save(HERE / "contact-sheet.jpg", quality=94, subsampling=0)
    first = next(s for s in ordered if s["shot"] == 1)
    pictures[first["frame"]].save(POSTER, quality=96, subsampling=0)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check-inputs", action="store_true",
                        help="Validate capture files and state evidence without encoding")
    args = parser.parse_args()
    shots, sources, selections, meteors, day_night, music_info = prepare()
    if args.check_inputs:
        print(json.dumps({"passed": True, "shots": len(shots), "duration": EXPECTED_SECONDS,
                          "selectedFrames": len(selections), "meteors": meteors,
                          "dayNight": day_night}, ensure_ascii=False, indent=2))
        return
    OUT.mkdir(parents=True, exist_ok=True)
    temporary = OUT / "little-bloom-xiaohongshu-extended.encoding.mp4"
    print("Encoding 15 shots / 70 seconds; FFmpeg progress is in encode.log", flush=True)
    encode(sources, temporary)
    print("Decoding every video frame and the full audio track", flush=True)
    meta, count, pictures, checks, audio_info = validate_video(temporary, selections)
    boxes = check_faststart(temporary)
    temporary.replace(VIDEO)
    write_stills(selections, pictures)
    report = {"file": str(VIDEO), "bytes": VIDEO.stat().st_size,
              "sha256": hashlib.sha256(VIDEO.read_bytes()).hexdigest(),
              "duration": meta["duration"], "size": list(meta["size"]),
              "fps": meta["fps"], "decodedFrames": count, "codec": meta["codec"],
              "audio_codec": meta.get("audio_codec"), "audio": audio_info,
              "pixelFormat": "yuv420p", "crf": 19, "preset": "medium",
              "faststart": True, "mp4Boxes": boxes, "shotCount": len(shots),
              "shots": sources, "meteorEvidence": meteors, "dayNightEvidence": day_night,
              "frameChecks": checks, "contactSheetSelections": selections,
              "contactSheet": str(HERE / "contact-sheet.jpg"), "poster": str(POSTER),
              "transition": "0.16s edge fades, without overlapping time; uninterrupted day/night shot; meteor frames retained",
              "source": "15 live recordings of the existing interactive Three.js scenes",
              "music": {"source": "Original synthesized instrumental; no third-party recording", **music_info},
              "weatherDisclosure": "Weather App concept and simulated scene weather; no real city weather data",
              "validationScope": "Full video/audio decode, runtime-state evidence and nonblank scene samples; contact sheet requires human visual review",
              "passed": True}
    (HERE / "video-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: report[key] for key in ("file", "bytes", "duration", "size", "fps",
                                                   "decodedFrames", "shotCount", "poster", "passed")},
                     ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Extended promo encoding/verification failed: {error}", file=sys.stderr)
        raise
