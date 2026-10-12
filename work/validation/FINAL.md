# Final validation

Validation uses fresh bundles from `C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/planet-v2`. No source tests were edited. No browser, Playwright, CDP, GPU capture, or browser-security bypass was used.

- **19/19 shader programs compile and link** with local glslangValidator. Includes water, composed ground paint/caustics, grass, canopy/spray color and shadow shaders, shrubs, wildflower petals, and new pollen.
- Shader insertion assertions confirm water sky-wash/glint code executes before the actual `opaque_fragment` output chunk, ground paint and underwater caustics coexist, and ground/grass custom uniforms are declared once per shader stage.
- **DOM smoke passes all five groups**: startup/animation, meadow/globe cameras, sunny preview, every weather, night/day pollen visibility, and quality mode grass reduction/restoration. Pollen positions/uniforms remain finite. This uses a renderer stub.
- **All scene geometry checks pass**: 2,162 geometry attributes and all object/instance transforms are finite; 27 instanced meshes contain 38,739 instances; 1,404 tree leaf sprays are arranged at 12 per crown. Visible and depth leaf cutout masks match.
- Current primary-regression budget sample: **617,048 total triangles / 134,392 shadow triangles**, down from 625,204 / 135,976. Both stay under the existing 650,000 / 200,000 limits. Grass: 15,339 blades / 92,034 triangles. This is CPU geometry counting, not GPU timing.
- Original world regression: **18/21 pass**. Two failures are unchanged from baseline: expected four residents where current project has three, and a construction carrying-pose assertion. The third asserts the old concave leaf shape; the new tree leaves intentionally use a gently convex/drooping surface. Normals, attachment distances, alpha-mask consistency and finite geometry pass.
- Original tree test stops at a hard-coded 440 crown triangles, while current intentional simplified geometry has 396. Do not revert the new geometry to satisfy a stale exact count.
- Desktop shadow resolution deliberately changes to 2048; mobile remains 1024. The original DOM test hard-codes 1024 and also contains a baseline failure expecting immediate, rather than smoothed, camera rotation.

## Repeatable checks

From any directory:

```
node C:/Users/chenyahan/Documents/Codex/2026-09-18/file-c-users-chenyahan-documents-codex/work/validation/shader-test.mjs
node C:/Users/chenyahan/Documents/Codex/2026-09-18/file-c-users-chenyahan-documents-codex/work/validation/final-app-smoke.mjs
node C:/Users/chenyahan/Documents/Codex/2026-09-18/file-c-users-chenyahan-documents-codex/work/validation/final-geometry.mjs
```

The shader runner regenerates `final-shader-world.mjs` used by the geometry check. JSON results are saved alongside these scripts. Actual displayed style, transparency/antialiasing and GPU frame times remain unverified in this run.
