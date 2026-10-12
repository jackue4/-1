# Visual upgrade validation baseline

Source: `C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/planet-v2`.

- `test.mjs` does not exist. `test.js` is the primary world regression source; existing bundled `.mjs` files can be stale.
- `../package.json` has a placeholder failing `npm test`. Build uses `node build.mjs` and writes `../../outputs/little-bloom.html`.
- Freshly bundled `test.js` stops at the existing resident-count assertion (`test.js:55`, actual 3, expected 4). Current `VILLAGERS` contains three residents.
- A diagnostic copy of the fresh bundle changed only the test wrapper to collect failures: 19 of 21 checks passed. The second failure is the existing construction carry animation assertion `assert.ok(sawCarry)`.
- Scene baseline: 625,204 triangles; 135,976 shadow triangles; 14,967 grass blades. Budget assertions are 650,000 total and 200,000 shadow triangles.
- `node test-app.mjs` boots with a renderer stub, then fails its old immediate camera half-turn assertion at line 40. It cannot prove WebGL rendering or visual quality.
- Equivalent relocated `test-shaders.mjs` passed all 16 material vertex/fragment compile-and-link checks with `../glslang/bin/glslangValidator.exe`. Relocation changes only package imports/source path and artifact output directory.
- Browser, Playwright and CDP were not used. GPU visual appearance, anti-aliasing, frame times, and real device rendering remain unverified.

## Final checks

Run the relocated shader test again after final source edits: `node C:/Users/chenyahan/Documents/Codex/2026-09-18/file-c-users-chenyahan-documents-codex/work/validation/shader-test.mjs`.

Regenerate the main regression bundle with the local esbuild executable before running. Keep known baseline failures separate from new regressions. Tree-specific source assertions include hard-coded geometry counts and may require interpretation if geometry was intentionally redesigned. Never fix a visual task by changing unrelated gameplay to satisfy obsolete assertions.
