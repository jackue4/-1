from pathlib import Path
import sys, subprocess, json
from PIL import Image, ImageDraw, ImageFont
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / 'vendor'))
import imageio_ffmpeg
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
OUT = HERE.parent.parent / 'outputs' / 'promo'
OUT.mkdir(parents=True, exist_ok=True)
video = OUT / 'little-bloom-xiaohongshu.mp4'
durations = [4, 5, 5, 5, 5]
args = [FFMPEG, '-hide_banner', '-y']
for i in range(1, 6):
    args += ['-i', str(HERE / 'raw' / f'{i:02}.webm')]
args += ['-i', str(HERE / 'music.wav')]
filters = []
for i, duration in enumerate(durations):
    filters.append(f'[{i}:v]trim=start=0.25:duration={duration},setpts=PTS-STARTPTS,fps=30,format=yuv420p,fade=t=in:st=0:d=0.16,fade=t=out:st={duration-.16}:d=0.16[v{i}]')
filters.append(''.join(f'[v{i}]' for i in range(5)) + 'concat=n=5:v=1:a=0[v]')
args += ['-filter_complex', ';'.join(filters), '-map', '[v]', '-map', '5:a:0',
         '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-profile:v', 'high',
         '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000',
         '-t', '24', '-movflags', '+faststart', '-metadata', 'title=Little Bloom - AI Creative Journal', str(video)]
with (HERE / 'encode.log').open('w', encoding='utf-8') as log:
    subprocess.run(args, stdout=log, stderr=subprocess.STDOUT, check=True)

reader = imageio_ffmpeg.read_frames(str(video), pix_fmt='rgb24')
meta = next(reader)
checks, selected = [], {}
indices = [45, 195, 345, 495, 660]
count = 0
for frame in reader:
    if count in indices:
        data = np.frombuffer(frame, dtype=np.uint8).reshape(1920, 1080, 3)
        shot = count // 150
        selected[count] = Image.fromarray(data).copy()
        checks.append({'frame': count, 'time': count/30, 'mean_luma': round(float(data.mean()),2), 'stddev': round(float(data.std()),2)})
    count += 1
assert meta['size'] == (1080, 1920), meta
assert abs(meta['duration'] - 24) < .1, meta
assert count == 720, count
assert len(selected) == 5 and all(c['stddev'] > 20 for c in checks)

sheet = Image.new('RGB', (1350, 520), '#f2f0e6')
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 18)
for i, (index, picture) in enumerate(selected.items()):
    thumbnail = picture.resize((270, 480), Image.Resampling.LANCZOS)
    sheet.paste(thumbnail, (i*270, 0))
    ImageDraw.Draw(sheet).text((i*270+12, 493), f'{index/30:.1f}s / Shot {i+1}', font=font, fill='#34564b')
sheet.save(HERE / 'contact-sheet.jpg', quality=94)
selected[45].save(OUT / 'little-bloom-poster.jpg', quality=96)
report = {'file': str(video), 'bytes': video.stat().st_size, 'duration': meta['duration'],
          'size': list(meta['size']), 'fps': meta['fps'], 'decodedFrames': count,
          'codec': meta['codec'], 'audio_codec': meta.get('audio_codec'),
          'frameChecks': checks, 'source': 'Five live canvas recordings from the existing interactive Three.js scenes',
          'music': 'Original synthesized instrumental, 24s stereo; no third-party recording',
          'weatherDisclosure': 'Weather App concept, simulated scene weather; no real city data',
          'passed': True}
assert meta.get('audio_codec') == 'aac', meta
with (HERE / 'video-report.json').open('w', encoding='utf-8') as f:
    json.dump(report, f, ensure_ascii=False, indent=2)
print(json.dumps(report, ensure_ascii=False, indent=2))
