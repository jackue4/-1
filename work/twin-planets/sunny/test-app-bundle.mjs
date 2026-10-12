// work/planet-v2/test-app.mjs
import { build } from "esbuild";
import { parseHTML } from "linkedom";
import vm from "node:vm";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
var dir = path.dirname(fileURLToPath(import.meta.url));
var realThree = path.resolve(dir, "../node_modules/three/build/three.module.js").replaceAll("\\", "/");
var mock = `export * from ${JSON.stringify(realThree)};
import {Texture,Color} from ${JSON.stringify(realThree)};
export class WebGLRenderer {
 constructor(){this.domElement=document.createElement('canvas');this.shadowMap={enabled:false};this.info={render:{calls:0,triangles:0}};}
 setPixelRatio(){} setClearColor(){} setSize(){} dispose(){}
 render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);this.info.render.calls++;}
}
export class PMREMGenerator { constructor(){} fromScene(){return {texture:new Texture(),dispose(){}};} dispose(){} }
`;
var bundle = await build({ entryPoints: [path.join(dir, "app.js")], bundle: true, format: "iife", write: false, plugins: [{ name: "test-renderer-stub", setup(b) {
  b.onResolve({ filter: /^three$/ }, () => ({ path: "three-stub", namespace: "stub" }));
  b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({ contents: mock, loader: "js", resolveDir: dir }));
} }] });
var template = await fs.readFile(path.join(dir, "page.html"), "utf8");
var { window } = parseHTML(template);
var { document } = window;
var now = new Date(2026, 8, 16, 12, 0, 0).getTime();
var frame = null;
var stored = /* @__PURE__ */ new Map();
var fatalErrors = [];
var RealDate = Date;
var FakeDate = class extends RealDate {
  constructor(...args) {
    super(...args.length ? args : [now]);
  }
  static now() {
    return now;
  }
};
var create = document.createElement.bind(document);
document.createElement = (name, ...args) => {
  const el = create(name, ...args);
  if (name === "canvas") {
    el.getContext = () => ({ createRadialGradient: () => ({ addColorStop() {
    } }), fillRect() {
    } });
    el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 980, height: 527 });
  }
  return el;
};
document.getElementById("scene").getBoundingClientRect = () => ({ left: 150, top: 78, width: 980, height: 527 });
var storage = { getItem: (key) => stored.get(key) || null, setItem: (key, value) => stored.set(key, value) };
var context = { window, document, localStorage: storage, Date: FakeDate, performance: { now: () => now }, console: { log: console.log, warn: console.warn, error: (...v) => fatalErrors.push(v) }, devicePixelRatio: 1, matchMedia: () => ({ matches: false }), ResizeObserver: class {
  constructor(fn) {
    this.fn = fn;
  }
  observe() {
    this.fn();
  }
  disconnect() {
  }
}, requestAnimationFrame: (fn) => (frame = fn, 1), cancelAnimationFrame() {
}, setTimeout: () => 1, clearTimeout() {
}, addEventListener: window.addEventListener.bind(window), location: { reload() {
} }, Float32Array, Uint32Array, Uint16Array, Int32Array, Uint8Array, ArrayBuffer, DataView, Math, Map, Set, WeakMap, WeakSet, Promise };
vm.runInNewContext(bundle.outputFiles[0].text, context, { timeout: 2e4 });
assert.deepEqual(fatalErrors, []);
assert.ok(window.littleBloom, "Application boot completed");
function frames(count = 90) {
  for (let i = 0; i < count; i++) {
    now += 33;
    const fn = frame;
    frame = null;
    assert.ok(fn);
    fn(now);
  }
}
var $ = (id) => document.getElementById(id);
frames();
assert.equal(document.documentElement.dataset.ready, "true");
var checks = [];
checks.push("DOM boot, scene construction, animation loop");
$("sunny-view").click();
frames(120);
assert.equal(window.littleBloom.getState().weather, "clear");
assert.ok(window.littleBloom.getState().night < 0.1);
assert.equal($("time-value").textContent, "10:30");
checks.push("Sunny coast shortcut opens bright morning preview");
for (const type of ["clear", "cloudy", "rain", "mist", "snow"]) {
  document.querySelector(`[data-weather="${type}"]`).click();
  frames();
  assert.equal(window.littleBloom.getState().weather, type);
  assert.equal(window.littleBloom.getState().preview, true);
  assert.equal($("weather-mode").textContent, "\u9884\u89C8\u4E2D");
}
checks.push("All five preview weather controls update scene and UI state");
$("time-range").value = "0";
$("time-range").dispatchEvent(new window.Event("input"));
frames(120);
assert.ok(window.littleBloom.getState().night > 0.9);
assert.equal($("phase-label").textContent, "\u6708\u5149\u65F6\u523B");
$("time-range").value = "12";
$("time-range").dispatchEvent(new window.Event("input"));
frames(120);
assert.ok(window.littleBloom.getState().night < 0.1);
checks.push("Day / night slider drives lighting state");
$("return-live").click();
frames();
assert.equal(window.littleBloom.getState().preview, false);
assert.equal(window.littleBloom.getState().weather, window.littleBloom.getState().naturalWeather);
checks.push("Return to today clears both weather and time overrides");
$("encounter").click();
frames();
assert.ok(window.littleBloom.getState().history.length >= 1);
assert.ok($("event-title").textContent.length > 0);
$("diary-toggle").click();
assert.equal($("diary").hidden, false);
assert.ok($("diary-list").children.length > 0);
$("diary-close").click();
assert.equal($("diary").hidden, true);
checks.push("Encounter, persisted event log and diary controls");
var oldDate = window.littleBloom.getState().date;
now = new RealDate(2026, 8, 17, 0, 0, 1).getTime();
frames(2);
assert.notEqual(window.littleBloom.getState().date, oldDate);
assert.equal(window.littleBloom.getState().date, "2026-09-17");
assert.equal(window.littleBloom.getState().history.length, 0);
checks.push("Open page rolls weather and diary over at midnight");
now += 8e4;
frames(2);
assert.ok(window.littleBloom.getState().history.length > 0);
checks.push("Scheduled encounter happens while page is open");
$("return-live").click();
frames();
$("travel-button").click();
frames(2);
var travel = window.littleBloom.getState().travel;
assert.equal(travel.away, true);
assert.equal($("travel-button").disabled, true);
assert.equal($("pet-status").textContent.startsWith("\u6B63\u5728\u524D\u5F80"), true);
now += 11e4;
frames(2);
travel = window.littleBloom.getState().travel;
assert.equal(travel.away, false);
assert.equal(travel.postcards.length, 1);
assert.equal($("postcard-count").textContent, "1");
checks.push("Pet packs, leaves the island, returns with a postcard and persists the trip");
$("rotate-toggle").click();
assert.equal($("rotate-toggle").getAttribute("aria-pressed"), "false");
$("quality-toggle").click();
assert.equal($("quality-toggle").getAttribute("aria-pressed"), "true");
$("home-view").click();
frames();
checks.push("Rotation, quality and home view controls");
assert.deepEqual(fatalErrors, []);
console.log(JSON.stringify({ passed: checks.length, checks, note: "Headless DOM integration; WebGL renderer was stubbed." }, null, 2));
