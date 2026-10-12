# Mobile fishing edition — 2026-09-18

Production: https://little-bloom-island.vercel.app/

## Changes
- Existing resident 阿栗 sits on a wooden stool in lake 1, separate from lake 0's sailboat. Four residents total.
- Bamboo rod, curved line, wave-following float, bite animation, expanding ripples, bucket and bait box. Rain, snow and night stop fishing; existing navigation and homes take over.
- Shore position is selected from reachable, dry, obstacle-free candidates. Other residents avoid the stool.
- Scenic mode hides and disables the former sidebar, farm/travel/build/weather panels, intro and footer. Scene taps cannot reopen them. Farm saves and background systems are retained.
- Full-width scene; safe-area insets and dynamic viewport sizing; 44–48 CSS pixel touch targets; compact view and time controls; horizontal field of view preserved in portrait.
- Added fishing camera shortcut, concise help and inline favicon. Night controls retain readable contrast.

## Verification
- `test-fishing.mjs`: four checks passed: seated existing animal and underwater float location; weather exit; navigation back to stool; all four walk home at night without teleporting or entering navigation obstacles.
- `test-mobile-browser.cjs`: nine checks passed on local file and public production URL using actual headless Chromium/WebGL and fresh anonymous browser contexts. Portrait 440×956, landscape 956×440 and desktop 1440×900; no horizontal overflow, correct hidden UI, visible touch targets, fishing shortcut, single-finger drag, pinch zoom and night transition; zero console/page errors.
- Screenshots: mobile-meadow.png, mobile-fishing.png, mobile-night.png, mobile-landscape.png. These are browser captures, not CPU raster approximations.
- Anonymous production GET returns HTTP 200; bytes exactly match local deployment index.html (732344 bytes). SHA-256: `851936dea856cd61a9b38f002f05f3782102c07b16aac5ff228dc98442cd4517`.
- Physical iPhone/Safari, real safe-area rendering, real-device FPS and mainland mobile network reachability were not measured. In-app browser connector remains unavailable; standalone Chromium was used instead.

## Deployment
- Only index.html and vercel.json are deployed from outputs/little-bloom-site. Source, backups and tests are not published.
- Existing authenticated Vercel account was usable; no new login required. Project: little-bloom-island.
- Rebuild: `node work/planet-v2/build.mjs`; then copy outputs/little-bloom.html to outputs/little-bloom-site/index.html and run `vercel deploy --yes --prod` from that directory.
- Local-file and HTTPS origins have separate browser saves. No save migration or reset was performed.
- Backup: work/little-bloom-before-mobile-fishing.html.
