# Shared sky compatibility audit

The shared module is used by the lobby and all four planet apps. Existing planet lifecycle tests replace the whole sky with a mock, so they cannot verify the Canvas2D sky itself. `sky-module-check.mjs` executes the real module and cloud painter against a recording Canvas2D boundary. It does not rasterize pixels or establish perceived image quality or browser frame rates.

Latest verification: **26 checks passed** after the new sky implementation landed. The test identified a real clear-on-preview edge case: visibility became zero while Canvas clearing was still throttled after the preceding draw. The primary task fixed it. Both immediate preview and immediate daylight now clear exactly once even when `dt=0`; steady zero-time updates remain idle. See `sky-module-report.json` for the complete result.

## Interface and clock

- Preserve `createStorybookSky({container, variant, seed})` and its `element`, `update(dt, env)`, `setActive(bool)`, `getState()`, and idempotent `dispose()` members.
- `container.ownerDocument` is the actual page document even when the planet uses the scoped-document facade. An atlas cached by this owner document can therefore be shared across all worlds.
- The sky must not create its own animation clock. Planets call `update` from their frames; the lobby owns its separate sky RAF. Hidden planets call `setActive(false)`.
- Keep the existing diagnostic state fields: `variant`, `active`, `reducedMotion`, `width`, `height`, `dpr`, `stars`, `dust`, `moon`, `clouds`, `visibility`, `weatherDim`, `meteors`. The planned additions are `nightVisibility`, `duskVisibility`, `renderedFrames`, and `cachedCloudSprites`.
- `dt=0` must freeze star, cloud and meteor time; an explicit dirty event such as resize or activation may still trigger one redraw. Festival now passes zero while stably paused. Other worlds have historically kept sky time moving while their scene pause is active, so module-only tests cannot promise every world's pause wiring.

## Environment and preview

- Sunny supplies `sunset`; the other planets supply `dusk`. Nullish precedence preserves explicit `sunset:0` rather than falling back to a stale `dusk` value.
- Sunny previously pre-attenuated `night` for sunset, storms and tornadoes. The caller adjustment should send raw night to avoid double attenuation when the shared sky owns weather blending.
- Dusk must remain visible when `night` is zero. A dusk layer gated only by night intensity would disappear in the existing dusk presets.
- The lobby has `variant:'lobby'` and passes `{night:1}`. It should keep its night composition regardless of the day palette selected for the planet preview.
- Preview order differs: some apps call `update(0,{night:0})` before deactivation, others deactivate first. Both sequences must hide the world's overlay. An explicit `env.preview:true` must clear/hide night and dusk overlays as an extra guard.
- Weather inputs are normalized numbers, but many callers omit cloud/rain/snow. Clamp omitted fields to zero. Heavy weather should reduce stars and suppress incidental meteors without erasing all atmospheric color.

## Lifecycle and drawing resources

- `setActive(false)` should disconnect resize/motion observers and stop drawing, particle timing and sprite rebuilds. Reactivation must use the latest viewport and motion preference.
- Preserve the DPR ceiling and resize only when size or DPR changed. Ignore zero-sized containers without drawing invalid coordinates. Keep the event-listener fallback when `ResizeObserver` is unavailable.
- Reduced motion may still blend a changed lighting preset, but must stop meteor spawning and continuous cloud/star movement/redrawing once the environment settles. Runtime media-query changes need the same behavior.
- Reuse cached cloud plates across frames and across skies in the same document. Disposing one consumer must not release an atlas used by another; disposing the last consumer should release its backing canvases.
- The test checks finite Canvas2D arguments and balanced save/restore, but browser review is still required for clipping, color balance, layering and actual Canvas support.
