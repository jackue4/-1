# Lifecycle and hidden-world audit

Checked 2026-09-21. This audit did not change production files. Runtime checks use real Three.js geometry and world app code with deterministic DOM/WebGL boundaries; they do not establish GPU timings.

## Verification after the festival performance revision

The primary task subsequently changed festival scheduling and adaptive resolution. The expanded production-app harness now passes **19 checks**, and the adaptive-resolution controller passes **8 checks**.

- Hidden festival world: **0 RAF callbacks, 0 render calls, 0 simulation seconds** across 90 refresh intervals. The earlier 90-empty-callback baseline below is fixed for festival; the other worlds were not changed by this audit.
- Stable paused festival: **0 scene simulation and 0 Three.js render calls**. A drag wakes the scene and it becomes idle again when settled. Phase transitions and resize wake correctly, and night convergence returns to zero scene work.
- Twelve repeated foreground visibility notifications create only **one queued RAF**. Reactivation starts with a zero delta rather than advancing through the hidden interval.
- Existing preview restoration, pause, camera sizing, context restoration, quality toggles and resource cleanup continue to pass.
- Adaptive resolution ignores a 500 ms transient slowdown. At steady 33 ms intervals, the first downgrade happens after 3.663 seconds, subsequent reductions after at least five seconds, and the floor remains 0.8. Twelve seconds of fast frames does not restore quality; sustained fast frames recover approximately once per 14.6 seconds. Long intervals above 250 ms are ignored.

Pause evidence concerns the Three.js scene: the actual storybook sky remains a separately updated Canvas2D effect, while the harness mocks that rendering boundary. No physical-device FPS claim follows from these tests.

## Initial findings that affected the performance diagnosis

1. **Hidden worlds do not continue rendering or advancing simulation.** `scoped-document.js:12` exposes `actual.hidden || !active`, and the shell deactivates cached worlds before enabling the selected one (`twin-planets/app.js:41-49`). Each world returns before simulation/render when `running` is false. In the real festival app, 90 hidden refresh intervals produced **0 renders and 0 simulation seconds**. The selector sky also cancels its RAF when hidden (`planet-selector.js:132-135`). Therefore simultaneous rendering of all four worlds is not the primary cause of low frame rates.

2. **Hidden worlds still schedule empty RAF callbacks.** The next callback is requested before the `running` check in `festival-planet/app.js:69`, `snow-planet/app.js:43`, `kamakura-planet/app.js:104`, and `twin-planets/sunny/app.js:266`. The festival check records **90 callbacks over 90 hidden refresh intervals**. Three previously visited, hidden worlds therefore leave three extra callbacks per refresh. This is bounded, small overhead rather than hidden scene rendering. A visibility-driven cancel/restart (with `last=0`, a single queued frame, and context-loss guards) would remove it.

3. **World caching retains up to four WebGL renderers and their scene resources.** `twin-planets/app.js:12,41-49` creates one instance per world and never evicts one on ordinary switches. This preserves play state and prevents repeated expensive world construction; it is a deliberate bounded cache, not demonstrated listener or context growth on repeated navigation. Actual GPU-memory usage requires browser profiling. Do not discard this cache without preserving per-world state, and do not claim an FPS improvement merely from counting retained contexts.

4. **No repeated-navigation visibility-listener leak was found.** The real scoped-document module was switched 100 times: document listener count stayed at 4, each host stayed at 1, all worlds became hidden when the page became hidden, and disposal removed both listener registrations. See `scoped-document-report.json`.

## Separate lifecycle issues found by source review

- **Back/forward-cache restoration needs care.** Festival (`app.js:81`), snow (`app.js:50`) and coast (`app.js:119`) register unconditional `pagehide -> dispose`. Browsers can emit `pagehide` with `persisted=true` while preserving this page. The shell keeps the disposed instances and has no corresponding remount on `pageshow`; only viewport sizing listens for `pageshow`. If the page is actually restored from BFCache, the old renderer canvas has been removed and the existing instance cannot resume. Prefer suspending for persisted pagehide, disposing only on non-persisted unload, or a deliberate shell remount. This is a source-backed correctness risk, not a reproduced browser BFCache result or the current continuous-frame bottleneck.

- **Sunny and coast visibility handlers do not retain a context-lost guard.** Both set `running=false` on context loss, but the next `visibilitychange` sets `running=!document.hidden` (`sunny/app.js:239-242`, `kamakura-planet/app.js:100-101`), unlike festival/snow. A selected world could resume update attempts before its context recovers. Add a persistent `contextLost` flag if these worlds' lifecycle is revised. This is not an ordinary hidden-world issue.

- **Coast disposal omits scene and composer resources.** `kamakura-planet/app.js:118` disposes controls, sky and renderer but not `anime.dispose()` or owned geometry/materials. This presently runs on pagehide only, so its significance is chiefly for any future cache eviction/re-mount optimization; introducing eviction first would turn it into a real retained-resource problem.

## Checks completed

- `node work/festival-performance/lifecycle-audit.mjs`: 19 checks passed, including pause, exact preview restoration, zero hidden callbacks, wake-up triggers, portrait/landscape camera math, quality toggles, context restoration and once-only geometry disposal for the new snack/candy modules.
- `node work/festival-performance/render-budget-check.mjs`: 8 adaptive-resolution threshold checks passed.
- `node work/festival-performance/scoped-document-audit.mjs`: 5 checks passed, including 100 switches and listener cleanup.

Recommended priority for this task: optimize the visible festival renderer and its geometry/simulation first; remove empty hidden RAF callbacks if changing frame scheduling anyway. Keep the distinct BFCache and context-loss corrections scoped and tested.
