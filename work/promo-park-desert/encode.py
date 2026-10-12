"""Finish and verify the 60-second amusement-park/desert portrait promotional video.

The source is deterministic capture of the actual Three.js scenes, including
their live animation and a slow camera orbit. Each source contains 12 overlap
frames. Render one body/transition at a time to keep memory use bounded, then
concatenate matching H.264 streams without another lossy video generation.
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
VIDEO = OUT / "little-bloom-park-desert-60s.mp4"
COVER = OUT / "little-bloom-park-desert-cover.jpg"
WIDTH, HEIGHT, FPS = 1080, 1920, 30
SHOT_COUNT, SECONDS, OVERLAP_FRAMES = 14, 60, 12
FADE = OVERLAP_FRAMES / FPS
CRF = 18


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def run_ffmpeg(args, name):
    with (HERE / name).open("w", encoding="utf-8") as log:
        proc = subprocess.run([FFMPEG, "-hide_banner", "-nostdin", "-y", *args],
                              stdout=log, stderr=subprocess.STDOUT)
    if proc.returncode:
        tail = (HERE / name).read_text(encoding="utf-8", errors="replace")[-4500:]
        raise RuntimeError(f"FFmpeg failed ({name}):\n{tail}")


def metadata(path):
    probe = subprocess.run([FFMPEG, "-nostdin", "-threads", "2", "-i", str(path),
                            "-map", "0:v:0", "-frames:v", "0", "-f", "null", "-"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)
    return parse_ffmpeg_header(probe.stderr.decode("utf-8", errors="replace"))


def decoded_timing(path):
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
    require(values.get("progress") == "end", f"Incomplete decode: {path.name}")
    return int(values.get("frame", "0")), int(values.get("out_time_us", "0")) / 1_000_000


def prepare():
    shots = read_json(HERE / "shots.json")
    require(len(shots) == SHOT_COUNT, f"Expected {SHOT_COUNT} shots")
    durations = [float(shot["duration"]) for shot in shots]
    require(all(math.isfinite(d) and d > 2 * FADE for d in durations), "Invalid shot duration")
    require(abs(sum(durations) - SECONDS) < 1e-8, "Shot durations must total exactly 60 seconds")
    require(all(abs(d * FPS - round(d * FPS)) < 1e-8 for d in durations),
            "Shot durations must land on whole 30 fps frames")
    require({s["world"] for s in shots} == {"festival", "desert"}, "Unexpected featured worlds")
    music_path = HERE / "music.wav"
    require(music_path.is_file(), "music.wav is missing")
    with wave.open(str(music_path), "rb") as wav:
        music = {"sampleRate": wav.getframerate(), "channels": wav.getnchannels(),
                 "samples": wav.getnframes(), "sampleWidth": wav.getsampwidth(),
                 "duration": wav.getnframes() / wav.getframerate()}
    require(music["sampleRate"] == 48000 and music["channels"] == 2,
            "Music must be 48 kHz stereo")
    require(music["duration"] >= SECONDS - 1 / 48000, "Music is shorter than 60 seconds")
    capture_path = HERE / "raw" / "capture-report.json"
    if not capture_path.is_file():
        capture_path = HERE / "capture-report.json"
    require(capture_path.is_file(), "Capture evidence report is missing")
    capture = read_json(capture_path)
    captures = {int(row["index"]): row for row in capture.get("shots", [])}
    fireworks = next((row for row in captures.values()
                      if row.get("world") == "festival" and row.get("view") == "fireworks"), None)
    camp = next((row for row in captures.values()
                 if row.get("world") == "festival" and row.get("view") == "camp"), None)
    require(fireworks is not None and camp is not None, "Festival feature shots are missing")
    fire_samples = fireworks.get("samples", [])
    show_times = [float(sample.get("show", {}).get("showTime", -1)) for sample in fire_samples]
    particles = [int(sample.get("show", {}).get("activeParticles", 0)) for sample in fire_samples]
    require(show_times and min(show_times) <= 69.5 + 1 / FPS + .001 and max(show_times) >= 75.5,
            "Fireworks shot must span the programmed finale from 69.5 to 75.5 seconds")
    require(max(particles, default=0) > 100, "Fireworks finale has no visible particle activity")
    camp_samples = camp.get("samples", [])
    require(len(camp_samples) >= 2, "Camp lighting transition samples are missing")
    camp_start = float(camp_samples[0].get("night", -1))
    camp_end = float(camp_samples[-1].get("night", -1))
    require(0 <= camp_start < .3 and camp_end > .9,
            "Camp shot must transition from dusk into fully lit night")
    capture["featureChecks"] = {
        "fireworks": {"showTimeStart": min(show_times), "showTimeEnd": max(show_times),
                      "peakActiveParticles": max(particles), "passed": True},
        "campDuskToNight": {"startNight": camp_start, "endNight": camp_end, "passed": True}
    }
    sources, selections = [], []
    offset = 0.0
    for i, (shot, duration) in enumerate(zip(shots, durations)):
        name = f"{i + 1:02}.mp4"
        raw = HERE / "raw" / name
        require(raw.is_file() and raw.stat().st_size > 0, f"Missing capture: {name}")
        info = metadata(raw)
        require(tuple(info.get("source_size", info["size"])) == (WIDTH, HEIGHT),
                f"{name} must be portrait 1080x1920; refusing to stretch it")
        require(abs(info["fps"] - FPS) < .001, f"Wrong capture FPS: {name}")
        frames, decoded_seconds = decoded_timing(raw)
        expected_frames = round(duration * FPS) + OVERLAP_FRAMES
        require(frames == expected_frames,
                f"{name}: expected {expected_frames} source frames, received {frames}")
        require(i in captures, f"Capture evidence is missing for {name}")
        evidence = captures[i]
        require(evidence.get("name") == name and evidence.get("world") == shot["world"]
                and evidence.get("view") == shot["view"], f"Capture identity mismatch for {name}")
        require(evidence.get("frames", evidence.get("rawFrames")) == expected_frames,
                f"Capture evidence frame mismatch for {name}")
        require(evidence.get("bytes") == raw.stat().st_size, f"Capture changed after recording: {name}")
        samples = evidence.get("samples", [])
        require(len(samples) >= 2, f"Not enough runtime samples for {name}")
        camera_start, camera_end = np.asarray(samples[0]["camera"]), np.asarray(samples[-1]["camera"])
        camera_travel = float(np.linalg.norm(camera_end - camera_start))
        require(camera_travel > .001, f"Camera did not move in {name}")
        entry = {"index": i, "name": name, "world": shot["world"],
                 "view": shot["view"], "phase": shot.get("phase"),
                 "label": shot["label"], "start": offset, "duration": duration,
                 "frames": round(duration * FPS), "rawFrames": frames,
                 "rawDuration": decoded_seconds, "rawBytes": raw.stat().st_size,
                 "captureMethod": "deterministic actual scene capture",
                 "orbitRadians": shot.get("orbit"), "headingRadians": shot.get("heading", 0),
                 "runtimeCameraDistance": camera_travel, "runtimeSamples": len(samples)}
        sources.append(entry)
        selections.append({"shot": i + 1, "label": shot["label"],
                           "world": shot["world"], "view": shot["view"],
                           "frame": round((offset + duration / 2) * FPS)})
        offset += duration
        print(f"Source {name}: {frames} frames, {WIDTH}x{HEIGHT}", flush=True)
    return shots, sources, selections, music, capture


def video_options(frames):
    return ["-an", "-c:v", "libx264", "-threads", "4", "-preset", "medium",
            "-crf", str(CRF), "-profile:v", "high", "-pix_fmt", "yuv420p",
            "-r", str(FPS), "-fps_mode", "cfr", "-frames:v", str(frames),
            "-video_track_timescale", "90000", "-movflags", "+faststart"]


def encode(sources, destination):
    parts_dir = HERE / "edit-parts"
    parts_dir.mkdir(exist_ok=True)
    parts = []
    for i, source in enumerate(sources):
        # At cumulative base duration the outgoing last 12 frames dissolve
        # into the incoming first 12. The final extra handle is discarded,
        # yielding exactly 1800 output frames including all transitions.
        start = 0 if i == 0 else OVERLAP_FRAMES
        end = source["frames"]
        frames = end - start
        part = parts_dir / f"{i + 1:02}-body.mp4"
        chain = [f"trim=start_frame={start}:end_frame={end}",
                 f"setpts=N/({FPS}*TB)", "setsar=1", "format=yuv420p"]
        if i == 0:
            chain.append("fade=t=in:st=0:d=0.35")
        if i == len(sources) - 1:
            chain.append(f"fade=t=out:st={frames / FPS - .6:.8f}:d=0.6")
        print(f"Rendering shot {i + 1:02}/{len(sources)} body", flush=True)
        run_ffmpeg(["-threads", "2", "-i", str(HERE / "raw" / source["name"]),
                    "-vf", ",".join(chain), *video_options(frames), str(part)],
                   f"encode-{i + 1:02}-body.log")
        parts.append((part, frames))
        if i == len(sources) - 1:
            continue
        next_source = sources[i + 1]
        transition = parts_dir / f"{i + 1:02}-dissolve.mp4"
        filters = (
            f"[0:v]trim=start_frame={source['frames']}:end_frame={source['rawFrames']},"
            f"setpts=N/({FPS}*TB),fps={FPS},settb=AVTB,setsar=1,format=yuv420p[a];"
            f"[1:v]trim=start_frame=0:end_frame={OVERLAP_FRAMES},"
            f"setpts=N/({FPS}*TB),fps={FPS},settb=AVTB,setsar=1,format=yuv420p[b];"
            f"[a][b]xfade=transition=fade:duration={FADE}:offset=0,format=yuv420p[v]"
        )
        print(f"Rendering dissolve {i + 1:02}/{len(sources) - 1}", flush=True)
        run_ffmpeg(["-filter_complex_threads", "2", "-threads", "2",
                    "-i", str(HERE / "raw" / source["name"]), "-threads", "2",
                    "-i", str(HERE / "raw" / next_source["name"]),
                    "-filter_complex", filters, "-map", "[v]",
                    *video_options(OVERLAP_FRAMES), str(transition)],
                   f"encode-{i + 1:02}-dissolve.log")
        parts.append((transition, OVERLAP_FRAMES))
    require(sum(frames for _, frames in parts) == SECONDS * FPS, "Wrong edit frame count")
    # All paths here are generated ASCII basenames under this file's directory.
    # Explicit durations keep input packet rounding from accumulating.
    concat = HERE / "edit-concat.txt"
    concat.write_text("ffconcat version 1.0\n" + "".join(
        f"file 'edit-parts/{path.name}'\nduration {frames / FPS:.9f}\n"
        for path, frames in parts), encoding="utf-8")
    print("Muxing 60-second H.264 picture and original stereo score", flush=True)
    run_ffmpeg(["-f", "concat", "-safe", "0", "-i", str(concat),
                "-i", str(HERE / "music.wav"), "-map", "0:v:0", "-map", "1:a:0",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
                "-af", "afade=t=in:st=0:d=0.15,afade=t=out:st=59.4:d=0.6",
                "-t", str(SECONDS), "-movflags", "+faststart", "-video_track_timescale", "90000",
                "-metadata", "title=Little Bloom - A Carousel of Wishes and Dunes by the Sea",
                "-metadata", "comment=Deterministic capture of actual interactive Three.js scenes; original instrumental score",
                str(destination)], "encode-mux.log")
    return [{"file": str(path), "frames": frames} for path, frames in parts]


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


def validate_video(path, sources, selections):
    requested = {item["frame"] for item in selections}
    # These pairs lie inside the unblended body, away from titles near the
    # image edges. Their difference proves visible scene motion, not orbit
    # geometry; the latter remains in the capture report and planned rig.
    motion_samples = []
    for source in sources:
        first = round((source["start"] + max(.8, source["duration"] * .35)) * FPS)
        second = min(round((source["start"] + source["duration"] - .45) * FPS), first + 24)
        motion_samples.append((first, second))
    motion_frames = {frame for pair in motion_samples for frame in pair}
    pictures, small_pictures, checks, count = {}, {}, [], 0
    reader = imageio_ffmpeg.read_frames(str(path), pix_fmt="rgb24",
                                      input_params=["-threads", "4", "-xerror"])
    try:
        meta = next(reader)
        require(tuple(meta["size"]) == (WIDTH, HEIGHT), f"Wrong output dimensions: {meta}")
        require(abs(meta["fps"] - FPS) < .001, f"Wrong output frame rate: {meta}")
        require(abs(meta["duration"] - SECONDS) <= 1 / FPS, f"Wrong duration: {meta}")
        require(meta.get("codec") == "h264", f"Expected H.264: {meta}")
        require(meta.get("audio_codec") == "aac", f"Expected AAC: {meta}")
        for frame in reader:
            require(len(frame) == WIDTH * HEIGHT * 3, f"Incomplete video frame {count}")
            if count in requested or count in motion_frames:
                data = np.frombuffer(frame, dtype=np.uint8).reshape(HEIGHT, WIDTH, 3)
                center = data[int(HEIGHT * .25):int(HEIGHT * .76),
                              int(WIDTH * .14):int(WIDTH * .86)]
                if count in requested:
                    mean, spread = float(center.mean()), float(center.std())
                    require(mean > 2 and spread > 6,
                            f"Blank scene at frame {count}: mean={mean}, std={spread}")
                    pictures[count] = Image.fromarray(data).copy()
                    checks.append({"frame": count, "time": round(count / FPS, 4),
                                   "sceneMean": round(mean, 3), "sceneStddev": round(spread, 3)})
                if count in motion_frames:
                    small_pictures[count] = np.asarray(Image.fromarray(center).resize(
                        (216, 270), Image.Resampling.BILINEAR), dtype=np.float32)
            count += 1
    finally:
        reader.close()
    require(count == SECONDS * FPS, f"Expected 1800 frames; decoded {count}")
    require(set(pictures) == requested, "Missing contact sheet frames")
    motion = []
    for source, (first, second) in zip(sources, motion_samples):
        delta = np.abs(small_pictures[second] - small_pictures[first])
        score = float(delta.mean())
        fraction = float((delta.mean(axis=2) > 2).mean())
        require(score > .08, f"Scene appears frozen in shot {source['index'] + 1}: {score}")
        motion.append({"shot": source["index"] + 1, "world": source["world"],
                       "view": source["view"], "frames": [first, second],
                       "intervalSeconds": (second - first) / FPS,
                       "centerMeanAbsoluteDifference": round(score, 5),
                       "changedCenterFraction": round(fraction, 5), "passed": True})
    audio = subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-nostdin", "-xerror",
                            "-i", str(path), "-map", "0:a:0", "-vn", "-ac", "2", "-ar", "48000",
                            "-c:a", "pcm_s16le", "-f", "s16le", "pipe:1"],
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    require(len(audio.stdout) % 4 == 0, "Incomplete stereo audio sample")
    pcm = np.frombuffer(audio.stdout, dtype="<i2").astype(np.float64) / 32768
    duration = len(audio.stdout) / (48000 * 2 * 2)
    rms = float(np.sqrt(np.mean(pcm * pcm)))
    require(abs(duration - SECONDS) < .06, f"Audio duration mismatch: {duration}")
    require(rms > .001, "Soundtrack is silent")
    audio_info = {"codec": "aac", "channels": 2, "sampleRate": 48000,
                  "decodedSampleFrames": len(audio.stdout) // 4,
                  "decodedDuration": duration, "rms": round(rms, 6),
                  "peak": round(float(np.abs(pcm).max()), 6), "fullDecodePassed": True}
    return meta, count, pictures, checks, motion, audio_info


def font(size):
    for path in [Path("C:/Windows/Fonts/msyh.ttc"), Path("C:/Windows/Fonts/simhei.ttf"),
                 Path("C:/Windows/Fonts/arial.ttf")]:
        if path.is_file():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def write_stills(selections, pictures):
    columns, thumb_w, thumb_h, caption_h = 7, 216, 384, 64
    rows = math.ceil(len(selections) / columns)
    sheet = Image.new("RGB", (columns * thumb_w, rows * (thumb_h + caption_h)), "#edf1f0")
    draw, body_font, small_font = ImageDraw.Draw(sheet), font(14), font(12)
    for i, selection in enumerate(selections):
        x, y = (i % columns) * thumb_w, (i // columns) * (thumb_h + caption_h)
        thumbnail = pictures[selection["frame"]].resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        sheet.paste(thumbnail, (x, y))
        label = selection["label"]
        while len(label) > 1 and draw.textbbox((0, 0), label, font=body_font)[2] > thumb_w - 16:
            label = label[:-2] + "…"
        draw.text((x + 8, y + thumb_h + 7), label, font=body_font, fill="#34564b")
        draw.text((x + 8, y + thumb_h + 31),
                  f"{selection['shot']:02} / {selection['frame']/FPS:.2f}s / {selection['view']}",
                  font=small_font, fill="#5f7a70")
    sheet.save(HERE / "contact-sheet.jpg", quality=94, subsampling=0)
    pictures[selections[0]["frame"]].save(COVER, quality=96, subsampling=0)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check-inputs", action="store_true")
    parser.add_argument("--validate-only", action="store_true", help="Validate existing final MP4 without re-encoding")
    args = parser.parse_args()
    shots, sources, selections, music, capture = prepare()
    if args.check_inputs:
        print(json.dumps({"passed": True, "shotCount": len(shots), "duration": SECONDS,
                          "music": music, "captureReportPresent": capture is not None},
                         ensure_ascii=False, indent=2))
        return
    OUT.mkdir(parents=True, exist_ok=True)
    temporary = VIDEO if args.validate_only else OUT / "little-bloom-park-desert-60s.encoding.mp4"
    parts = [] if args.validate_only else encode(sources, temporary)
    print("Decoding all 1800 video frames and the complete audio track", flush=True)
    meta, count, pictures, checks, motion, audio_info = validate_video(temporary, sources, selections)
    boxes = check_faststart(temporary)
    if not args.validate_only:
        temporary.replace(VIDEO)
    write_stills(selections, pictures)
    report = {"file": str(VIDEO), "bytes": VIDEO.stat().st_size,
              "sha256": hashlib.sha256(VIDEO.read_bytes()).hexdigest(),
              "duration": meta["duration"], "size": list(meta["size"]), "fps": meta["fps"],
              "decodedFrames": count, "codec": meta["codec"], "audio": audio_info,
              "pixelFormat": "yuv420p", "crf": CRF, "preset": "medium", "faststart": True,
              "mp4Boxes": boxes, "shotCount": len(shots), "shots": sources,
              "frameChecks": checks, "visibleMotionChecks": motion,
              "contactSheetSelections": selections, "contactSheet": str(HERE / "contact-sheet.jpg"),
              "cover": str(COVER), "editParts": parts,
              "transition": "13 dissolve transitions, each 12 frames / 0.4 seconds; first 0.35 seconds and last 0.6 seconds fade",
              "source": "Deterministic actual scene capture of 14 views in the existing interactive Three.js amusement park and desert planets",
              "captureEvidence": capture,
              "featureChecks": capture["featureChecks"],
              "music": {"source": "Original synthesized instrumental; no third-party recording", **music},
              "validationScope": "Full video/audio decode, source frame counts, center nonblank and motion checks; visual composition checked separately",
              "passed": True}
    (HERE / "video-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: report[key] for key in ("file", "bytes", "duration", "size", "fps",
                                                   "decodedFrames", "shotCount", "cover", "passed")},
                     ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
