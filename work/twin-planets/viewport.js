// Keep the shell inside Safari's visible viewport as its address bar expands.
// Pinch zoom keeps its normal browser behavior instead of refitting the page.
export function installViewport(document, window) {
  const root = document.documentElement;
  const viewport = window.visualViewport;
  const properties = ['--app-width', '--app-height', '--app-left', '--app-top'];
  const previous = properties.map(name => [name, root.style.getPropertyValue(name), root.style.getPropertyPriority(name)]);
  let frame = null;
  let disposed = false;
  let state = null;

  const positive = (...values) => values.find(value => Number.isFinite(value) && value > 0) || 1;
  function update() {
    frame = null;
    if (disposed) return;
    const scale = viewport?.scale ?? 1;
    const zoomed = !Number.isFinite(scale) || Math.abs(scale - 1) > .02;
    // Updating layout while zooming would shrink the scene a second time.
    if (zoomed && state) return;
    const visible = viewport && !zoomed && viewport.width > 0 && viewport.height > 0;
    const next = {
      width: positive(visible && viewport.width, window.innerWidth, root.clientWidth),
      height: positive(visible && viewport.height, window.innerHeight, root.clientHeight),
      left: visible && Number.isFinite(viewport.offsetLeft) ? Math.max(0, viewport.offsetLeft) : 0,
      top: visible && Number.isFinite(viewport.offsetTop) ? Math.max(0, viewport.offsetTop) : 0,
      source: visible ? 'visualViewport' : 'layoutViewport'
    };
    for (const [index, key] of ['width', 'height', 'left', 'top'].entries()) {
      if (!state || state[key] !== next[key]) root.style.setProperty(properties[index], `${next[key]}px`);
    }
    state = next;
  }
  function schedule() {
    if (!disposed && frame === null) frame = window.requestAnimationFrame(update);
  }
  const listeners = [
    [window, 'resize'], [window, 'orientationchange'], [window, 'pageshow'],
    [document, 'fullscreenchange'], [document, 'webkitfullscreenchange'],
    ...(viewport ? [[viewport, 'resize'], [viewport, 'scroll']] : [])
  ];
  for (const [target, type] of listeners) target.addEventListener(type, schedule, {passive: true});
  update();
  return {
    getState: () => ({...state}),
    dispose() {
      if (disposed) return;
      disposed = true;
      if (frame !== null) window.cancelAnimationFrame(frame);
      for (const [target, type] of listeners) target.removeEventListener(type, schedule);
      for (const [name, value, priority] of previous) {
        if (value) root.style.setProperty(name, value, priority);
        else root.style.removeProperty(name);
      }
      frame = null;
    }
  };
}
