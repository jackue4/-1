import assert from 'node:assert/strict';
import {installViewport} from '../twin-planets/viewport.js';

class Surface {
  listeners = new Map();
  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
  }
  removeEventListener(type, handler) { this.listeners.get(type)?.delete(handler); }
  fire(type) { for (const handler of this.listeners.get(type) ?? []) handler(); }
  count() { return [...this.listeners.values()].reduce((sum, set) => sum + set.size, 0); }
}
function fixture(withVisualViewport = true) {
  const values = new Map(), frames = new Map();
  let serial = 0, writes = 0;
  const style = {
    getPropertyValue: name => values.get(name)?.value || '',
    getPropertyPriority: name => values.get(name)?.priority || '',
    setProperty(name, value, priority = '') { values.set(name, {value, priority}); writes++; },
    removeProperty: name => values.delete(name)
  };
  const document = new Surface();
  document.documentElement = {style, clientWidth: 852, clientHeight: 393};
  const window = Object.assign(new Surface(), {
    innerWidth: 852, innerHeight: 393,
    requestAnimationFrame(callback) { const id = ++serial; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); }
  });
  if (withVisualViewport) window.visualViewport = Object.assign(new Surface(), {width: 852, height: 300, scale: 1, offsetLeft: 0, offsetTop: 0});
  return {
    window, document, style, frames,
    writes: () => writes,
    flush() { const pending = [...frames.values()]; frames.clear(); for (const callback of pending) callback(); }
  };
}
const checks = [];
function check(name, fn) { fn(); checks.push(name); }

check('Address bar expansion/collapse and viewport scrolling use visible bounds', () => {
  const f = fixture(), controller = installViewport(f.document, f.window), vv = f.window.visualViewport;
  assert.equal(f.style.getPropertyValue('--app-height'), '300px');
  vv.height = 360; vv.fire('resize'); f.flush();
  assert.equal(controller.getState().height, 360);
  assert.equal(f.style.getPropertyValue('--app-height'), '360px');
  vv.height = 300; vv.offsetTop = 7.5; vv.offsetLeft = 2; vv.fire('resize'); vv.fire('scroll');
  assert.equal(f.frames.size, 1); f.flush();
  assert.equal(f.style.getPropertyValue('--app-left'), '2px');
  assert.equal(f.style.getPropertyValue('--app-top'), '7.5px');
  controller.dispose();
});
check('Rotation replaces landscape dimensions, without locking orientation', () => {
  const f = fixture(), controller = installViewport(f.document, f.window), vv = f.window.visualViewport;
  Object.assign(vv, {width: 390, height: 700});
  f.window.fire('orientationchange'); f.window.fire('resize'); vv.fire('resize'); f.flush();
  assert.deepEqual(controller.getState(), {width: 390, height: 700, left: 0, top: 0, source: 'visualViewport'});
  controller.dispose();
});
check('Pinch zoom never refits or relocates the shell; release resumes viewport updates', () => {
  const f = fixture(), controller = installViewport(f.document, f.window), vv = f.window.visualViewport;
  const before = controller.getState(), writes = f.writes();
  Object.assign(vv, {scale: 2, width: 426, height: 150, offsetTop: 70, offsetLeft: 90});
  vv.fire('resize'); vv.fire('scroll'); f.flush();
  assert.deepEqual(controller.getState(), before); assert.equal(f.writes(), writes);
  Object.assign(vv, {scale: 1, width: 852, height: 360, offsetTop: 0, offsetLeft: 0});
  vv.fire('resize'); f.flush(); assert.equal(controller.getState().height, 360);
  controller.dispose();
});
check('Browsers without visualViewport and zero-sized startup use valid layout bounds', () => {
  const f = fixture(false), controller = installViewport(f.document, f.window);
  assert.equal(controller.getState().source, 'layoutViewport');
  assert.equal(controller.getState().height, 393);
  f.window.innerWidth = 390; f.window.innerHeight = 700; f.window.fire('resize'); f.flush();
  assert.equal(controller.getState().width, 390); assert.equal(controller.getState().height, 700);
  f.window.innerWidth = 0; f.window.innerHeight = 0; f.window.fire('resize'); f.flush();
  assert.equal(controller.getState().width, 852); assert.equal(controller.getState().height, 393);
  controller.dispose();
  const z = fixture(); z.window.visualViewport.height = 0;
  const zeroController = installViewport(z.document, z.window);
  assert.equal(zeroController.getState().height, 393); zeroController.dispose();
});
check('Restoration and fullscreen events remeasure; event bursts coalesce with no redundant writes', () => {
  const f = fixture(), controller = installViewport(f.document, f.window);
  const writes = f.writes();
  f.window.fire('pageshow'); f.document.fire('fullscreenchange'); f.document.fire('webkitfullscreenchange');
  f.window.fire('resize'); f.window.visualViewport.fire('scroll');
  assert.equal(f.frames.size, 1); f.flush(); assert.equal(f.writes(), writes);
  f.window.visualViewport.height = 393; f.document.fire('fullscreenchange'); f.flush();
  assert.equal(controller.getState().height, 393); controller.dispose();
});
check('Cleanup cancels queued updates, removes listeners, and restores existing custom properties', () => {
  const f = fixture(); f.style.setProperty('--app-height', '100dvh', 'important');
  const controller = installViewport(f.document, f.window);
  f.window.visualViewport.height = 360; f.window.fire('resize');
  assert.equal(f.frames.size, 1); controller.dispose(); controller.dispose();
  assert.equal(f.frames.size, 0); assert.equal(f.window.count(), 0);
  assert.equal(f.document.count(), 0); assert.equal(f.window.visualViewport.count(), 0);
  assert.equal(f.style.getPropertyValue('--app-width'), '');
  assert.equal(f.style.getPropertyValue('--app-height'), '100dvh');
  assert.equal(f.style.getPropertyPriority('--app-height'), 'important');
  const writes = f.writes(); f.window.fire('resize'); f.flush(); assert.equal(f.writes(), writes);
});
console.log(JSON.stringify({passed: true, count: checks.length, checks}, null, 2));
