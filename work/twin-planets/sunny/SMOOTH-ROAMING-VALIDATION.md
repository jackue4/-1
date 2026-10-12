# Three residents, smooth roaming, fishing life — 2026-09-18

## Changes
- Three island residents: rabbit 棉棉, bear 麦麦, corgi 阿栗. Removed the cat and hid the separate ambient travel animal; travel/save data remains intact. Bear inherits harvesting helper jobs so existing hired-helper saves still work.
- All five views share frame-smoothed planet rotation with exponential inertia decay. Pinch, cancellation, blur and view changes clear accumulated motion. OrbitControls still handles zoom.
- Globe preserves the meadow orientation and uses the same camera direction, exposure, vegetation density, paper wash and absence of a surface cloud shell. It changes framing rather than switching art treatment.
- Three dry, reachable fishing stations, one existing fisher. After 44–58 seconds seated, the corgi walks to another station using solid-aware navigation. Casting, waiting, biting, reeling, tiny splashes, a jumping fish and cheerful paw motion run as a lightweight animation cycle. Weather and homecoming retain priority.
- Fishing shortcut uses the current station's frame, including after relocation. Stools stay at their shore positions; villagers avoid the stations.

## Checks
- test-smooth-navigation.mjs: gradual frame movement, release inertia, convergence, reset, pinch isolation and pointer cancellation.
- test-fishing.mjs: three residents, three visited stations, all animation phases, no teleport or blocked steps, small splash bounds, weather exit/re-entry and all three residents returning indoors at night.
- test-mobile-browser.cjs: mobile layout/touch regression passed after the population and control changes.
- test-roaming-browser.cjs: actual Chromium/WebGL touch interaction in meadow, coast, fishing, animal and globe views; release inertia and settling; preserved orientation and render profile when switching meadow to globe; zero page or console errors. Captures: smooth-fishing.png and smooth-globe.png.
- Physical iPhone Safari and actual-device FPS have not been measured.

## Published artifact
- https://little-bloom-island.vercel.app/
- Anonymous HTTP 200, byte-identical to outputs/little-bloom-site/index.html, 735653 bytes.
- SHA-256: e8701c2a2996749ad658cd551376878d06aa6b34733506cb57b71b9c06d2fa99
- Original standalone output remains outputs/little-bloom.html. Backup: work/little-bloom-before-smooth-roaming.html.
