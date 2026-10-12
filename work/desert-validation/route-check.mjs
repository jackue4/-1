// Exercise the real shell controller with deterministic animation frames.
// World/selector implementations are protocol mocks: this does not prove
// rendered layout, WebGL, animation pausing, or persistence inside each game.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

const sourceURL = new URL('../twin-planets/app.js', import.meta.url);
const original = await fs.readFile(sourceURL, 'utf8');
const source = original.replace(/^import .*;\r?\n/gm, '');
const reports = [];

function fixture(initialHash = '') {
  const frames = [], errors = [], listeners = new Map();
  const mounts = {sunny: 0, coast: 0, festival: 0, snow: 0, desert: 0}, disposals = {sunny: 0, coast: 0, festival: 0, snow: 0, desert: 0};
  const previewCalls = [], mountOptions = [], activationCalls = [], transitions = [];
  let now = 0, selectorCallbacks;
  const element = (id = '') => ({
    id, hidden: true, inert: true, dataset: {}, attributes: {}, parentNode: null,
    setAttribute(name, value) { this.attributes[name] = String(value); }
  });
  const container = id => ({
    id, children: [],
    append(child) {
      if (child.parentNode) child.parentNode.children = child.parentNode.children.filter(node => node !== child);
      this.children.push(child); child.parentNode = this;
    },
    insertBefore(child) { this.append(child); }
  });
  const hosts = Object.fromEntries(['sunny', 'coast', 'festival', 'snow', 'desert'].map(id => [id, element(`world-${id}`)]));
  const body = container('body'), preview = container('selector-preview');
  Object.values(hosts).forEach(host => body.append(host));
  const buttons = ['sunny', 'coast', 'festival', 'snow', 'desert'].map(id => Object.assign(element(), {dataset: {worldButton: id}}));
  const home = Object.assign(element('planet-home'), {focusCount: 0, focus() { this.focusCount++; }});
  const transitText = {textContent: ''};
  const transit = Object.assign(element('transit'), {querySelector: () => transitText});
  const status = {textContent: ''}, enter = {disabled: false, textContent: '进入星球'};
  const elements = {'planet-home': home, transit, 'journey-status': status, 'enter-planet': enter,
    'world-sunny': hosts.sunny, 'world-coast': hosts.coast, 'world-festival': hosts.festival, 'world-snow': hosts.snow, 'world-desert': hosts.desert};
  const document = {
    documentElement: {dataset: {}}, title: '', body,
    getElementById: id => elements[id],
    querySelector: () => buttons.find(b => b.attributes['aria-pressed'] === 'true'),
    querySelectorAll: selector => selector === '[data-world-button]' ? buttons : []
  };
  const location = {hash: initialHash};
  const historyEntries = [{hash: initialHash, state: null}], historyCalls = [];
  let historyIndex = 0;
  const writeHistory = (type, state, title, url) => {
    const entry = {hash: String(url), state};
    if (type === 'push') { historyEntries.splice(historyIndex + 1); historyEntries.push(entry); historyIndex++; }
    else historyEntries[historyIndex] = entry;
    location.hash = entry.hash; historyCalls.push({type, hash: entry.hash});
  };
  const selector = {
    preview, selected: null, visible: false, busy: false, phase: 'idle',
    select(id) { this.selected = id; },
    show() { this.visible = true; }, hide() { this.visible = false; this.cancelTransition(); },
    setBusy(value) { this.busy = value; },
    leave(direction) { return this.animate('leaving', direction); },
    enter(direction) { return this.animate('entering', direction); },
    animate(phase, direction) {
      this.cancelTransition(); this.phase = phase;
      let resolve;
      const promise = new Promise(done => { resolve = done; });
      transitions.push({phase, direction, pending: true});
      const transition = transitions.at(-1);
      transition.finish = value => {
        if (!transition.pending) return;
        transition.pending = false; transition.result = value;
        if (value && phase === 'entering') this.phase = 'idle';
        resolve(value);
      };
      return promise;
    },
    cancelTransition() {
      for (const transition of transitions) if (transition.pending) transition.finish(false);
      this.phase = 'idle';
    }
  };
  const window = {
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(callback);
    }
  };
  const mount = id => (doc, options) => {
    mounts[id]++; mountOptions.push({id, preview: options?.preview});
    doc.host.dataset.ready = 'true';
    const dispose = () => disposals[id]++;
    dispose.setPreview = value => previewCalls.push({id, preview: value});
    return dispose;
  };
  const context = vm.createContext({
    console: {log() {}, error: error => errors.push(String(error?.stack || error))},
    Promise, document, window, location,
    history: {pushState: (...args) => writeHistory('push', ...args), replaceState: (...args) => writeHistory('replace', ...args)},
    requestAnimationFrame: callback => frames.push(callback),
    coast: {markup: 'coast', css: '', attributes: {}}, sunny: {markup: 'sunny', css: '', attributes: {}}, festival: {markup: 'festival', css: '', attributes: {}}, snow: {markup: 'snow', css: '', attributes: {}}, desert: {markup: 'desert', css: '', attributes: {}},
    mountCoast: mount('coast'), mountSunny: mount('sunny'), mountFestival: mount('festival'), mountSnow: mount('snow'), mountDesert: mount('desert'),
    createPlanetSelector: callbacks => { selectorCallbacks = callbacks; return selector; },
    installViewport: () => ({getState: () => ({width: 390, height: 844})}),
    installDisplayControls: () => ({getState: () => ({immersive: false, toolsOpen: false})}),
    createWorldDocument: host => ({
      host,
      setActive(active) { host.hidden = !active; host.inert = !active; activationCalls.push({id: host.id, active}); },
      dispose() {}
    })
  });
  vm.runInContext(source, context, {filename: sourceURL.pathname});
  const snapshot = () => JSON.parse(JSON.stringify(window.bloomUniverse.getState()));
  const emit = type => { for (const callback of listeners.get(type) || []) callback({type}); };
  async function flush() { for (let i = 0; i < 8; i++) await Promise.resolve(); }
  async function frame() {
    const pending = frames.splice(0); now += 16;
    for (const callback of pending) callback(now);
    // Advance async navigate continuations after each individual RAF boundary.
    await flush();
  }
  async function finishTransition() {
    const pending = transitions.find(transition => transition.pending);
    assert(pending, 'No pending selector transition to finish');
    pending.finish(true); await flush();
  }
  async function settle() {
    await flush();
    for (let i = 0; i < 60; i++) {
      if (transitions.some(transition => transition.pending)) await finishTransition();
      else if (frames.length) await frame();
      else break;
    }
    assert.equal(frames.length, 0, 'Shell left pending animation frames');
    assert.equal(transitions.filter(transition => transition.pending).length, 0, 'Shell left pending selector transitions');
    assert.deepEqual(errors, [], 'Shell logged an error');
  }
  function expect(id, screen) {
    const state = snapshot(), isPreview = screen === 'select';
    assert.equal(state.active, id); assert.equal(state.selected, id); assert.equal(state.screen, screen);
    assert.equal(document.documentElement.dataset.screen, screen);
    assert.equal(document.documentElement.dataset.world, id);
    assert.equal(selector.selected, id); assert.equal(selector.visible, isPreview); assert.equal(selector.busy, false);
    assert.equal(state.navigating, false); assert.equal(selector.phase, 'idle');
    assert.equal(home.hidden, isPreview); assert.equal(transit.hidden, true);
    assert.equal(location.hash, isPreview ? `#select/${id}` : `#${id}`);
    assert.deepEqual(state.worlds.filter(world => world.visible).map(world => world.id), [id]);
    assert.equal(hosts[id].dataset.preview, String(isPreview));
    assert.equal(hosts[id].parentNode, isPreview ? preview : body);
    assert.equal(hosts[id].inert, isPreview, 'The visible preview must be inert; play must accept focus and input');
    for (const world of state.worlds.filter(world => world.id !== id)) assert.equal(hosts[world.id].inert, true);
    assert.deepEqual(previewCalls.at(-1), {id, preview: isPreview});
    for (const button of buttons) assert.equal(button.attributes['aria-pressed'], String(button.dataset.worldButton === id));
    assert.deepEqual(errors, []);
    return state;
  }
  return {
    snapshot, frame, flush, finishTransition, transitions, settle, expect, mounts, disposals, mountOptions, previewCalls,
    hosts, selector, home, transit, historyCalls, activationCalls, errors, location,
    select: id => selectorCallbacks.onSelect(id), enter: () => { if (!selector.busy) selectorCallbacks.onEnter(); },
    topNav: id => buttons.find(button => button.dataset.worldButton === id).onclick(),
    async back() {
      assert(historyIndex > 0, 'No back history'); historyIndex--;
      location.hash = historyEntries[historyIndex].hash;
      emit('popstate'); emit('hashchange'); await settle();
    },
    async forward() {
      assert(historyIndex < historyEntries.length - 1, 'No forward history'); historyIndex++;
      location.hash = historyEntries[historyIndex].hash;
      emit('popstate'); emit('hashchange'); await settle();
    },
    async hash(hash) { location.hash = hash; emit('hashchange'); await settle(); }
  };
}

async function check(name, run) {
  try { reports.push({name, passed: true, ...await run()}); }
  catch (error) { reports.push({name, passed: false, error: error.stack || String(error)}); }
}

await check('An unqualified URL starts the sunny preview, with no game entry', async () => {
  const f = fixture(); await f.settle(); const state = f.expect('sunny', 'select');
  assert.deepEqual(f.mounts, {sunny: 1, coast: 0, festival: 0, snow: 0, desert: 0});
  assert.deepEqual(f.mountOptions, [{id: 'sunny', preview: true}]);
  assert.equal(f.home.focusCount, 0);
  assert.deepEqual(f.historyCalls, [{type: 'replace', hash: '#select/sunny'}]);
  return {state};
});

await check('Selecting another planet changes its preview without starting play', async () => {
  const f = fixture(); await f.settle(); f.select('coast');
  assert.equal(f.selector.busy, true); assert.equal(f.selector.visible, true); assert.equal(f.transit.hidden, true);
  await f.settle(); f.expect('coast', 'select');
  assert.deepEqual(f.mountOptions, [{id: 'sunny', preview: true}, {id: 'coast', preview: true}]);
  assert.equal(f.home.focusCount, 0);
  assert.deepEqual(f.historyCalls.at(-1), {type: 'replace', hash: '#select/coast'});
  return {mounts: f.mounts};
});

await check('Enter and return-home move the same world between play and preview', async () => {
  const f = fixture(); await f.settle(); const host = f.hosts.sunny;
  f.enter(); assert.equal(f.transit.hidden, false); await f.settle(); f.expect('sunny', 'play');
  assert.equal(f.home.focusCount, 1); assert.equal(f.hosts.sunny, host);
  f.home.onclick(); await f.settle(); f.expect('sunny', 'select');
  assert.equal(f.hosts.sunny, host); assert.deepEqual(f.mounts, {sunny: 1, coast: 0, festival: 0, snow: 0, desert: 0});
  assert.deepEqual(f.disposals, {sunny: 0, coast: 0, festival: 0, snow: 0, desert: 0});
  assert.deepEqual(f.previewCalls.map(call => call.preview), [true, false, true]);
  return {history: f.historyCalls, previewCalls: f.previewCalls};
});

await check('A full sunny-home-coast-home journey reuses both mounted worlds', async () => {
  const f = fixture(); await f.settle();
  for (const id of ['sunny', 'coast', 'sunny', 'coast']) {
    f.select(id); await f.settle(); f.expect(id, 'select');
    f.enter(); await f.settle(); f.expect(id, 'play');
    f.home.onclick(); await f.settle(); f.expect(id, 'select');
  }
  assert.deepEqual(f.mounts, {sunny: 1, coast: 1, festival: 0, snow: 0, desert: 0}); assert.deepEqual(f.disposals, {sunny: 0, coast: 0, festival: 0, snow: 0, desert: 0});
  return {mounts: f.mounts, disposalCalls: f.disposals};
});

await check('Existing coast and sunny deep links still enter their games directly', async () => {
  for (const id of ['coast', 'sunny']) {
    const f = fixture(`#${id}`); await f.settle(); f.expect(id, 'play');
    assert.equal(f.mounts[id], 1); assert.equal(f.mounts[id === 'sunny' ? 'coast' : 'sunny'], 0);
    assert.deepEqual(f.mountOptions, [{id, preview: false}]);
    assert.deepEqual(f.historyCalls, []);
    f.home.onclick(); await f.settle(); f.expect(id, 'select'); assert.equal(f.mounts[id], 1);
  }
  return {links: ['#coast', '#sunny']};
});

await check('Back and forward restore screen/planet without adding history or remounting', async () => {
  const f = fixture(); await f.settle(); f.enter(); await f.settle();
  f.home.onclick(); await f.settle(); f.select('coast'); await f.settle(); f.enter(); await f.settle();
  const calls = f.historyCalls.length;
  await f.back(); f.expect('coast', 'select');
  await f.back(); f.expect('sunny', 'play');
  await f.back(); f.expect('sunny', 'select');
  await f.forward(); f.expect('sunny', 'play');
  await f.forward(); f.expect('coast', 'select');
  await f.forward(); f.expect('coast', 'play');
  assert.equal(f.historyCalls.length, calls);
  assert.deepEqual(f.mounts, {sunny: 1, coast: 1, festival: 0, snow: 0, desert: 0});
  return {navigations: 6, historyWrites: calls, mounts: f.mounts};
});

await check('Hash changes and old top-nav buttons open the correct selector or game', async () => {
  const f = fixture('#select/coast'); await f.settle(); f.expect('coast', 'select');
  await f.hash('#sunny'); f.expect('sunny', 'play');
  f.topNav('coast'); await f.settle(); f.expect('coast', 'select');
  await f.hash('#select/unknown'); f.expect('sunny', 'select');
  assert.deepEqual(f.historyCalls.at(-1), {type: 'replace', hash: '#select/sunny'});
  return {fallback: '#select/sunny'};
});

await check('Rapid preview cancellation never mounts the abandoned planet', async () => {
  const f = fixture(); await f.settle();
  f.select('coast'); await f.frame(); f.select('sunny');
  await f.settle(); f.enter();
  await f.settle(); f.expect('sunny', 'play');
  assert.deepEqual(f.mounts, {sunny: 1, coast: 0, festival: 0, snow: 0, desert: 0});
  assert.equal(f.home.focusCount, 1);
  return {mounts: f.mounts, finalState: f.snapshot()};
});

await check('A newer request wins after an older mount but before its final RAF', async () => {
  const f = fixture(); await f.settle();
  f.select('coast'); await f.finishTransition(); await f.frame(); await f.frame();
  assert.equal(f.mounts.coast, 1); assert.equal(f.selector.busy, true);
  f.select('sunny'); await f.frame();
  assert.equal(f.selector.busy, true, 'The stale completion must not clear a newer loading state');
  f.select('coast'); await f.settle(); f.enter(); await f.settle(); f.expect('coast', 'play');
  assert.deepEqual(f.mounts, {sunny: 1, coast: 1, festival: 0, snow: 0, desert: 0});
  assert.equal(f.home.focusCount, 1);
  return {mounts: f.mounts, finalState: f.snapshot()};
});

await check('A departing preview remains mounted until leave resolves, and busy lasts through arrival', async () => {
  const f = fixture(); await f.settle(); f.select('coast');
  assert.equal(f.selector.phase, 'leaving'); assert.equal(f.selector.selected, 'sunny');
  assert.equal(f.snapshot().active, 'sunny'); assert.equal(f.mounts.coast, 0);
  for (let i = 0; i < 4; i++) await f.frame();
  assert.equal(f.mounts.coast, 0, 'An unresolved departure must not mount the incoming world');
  f.enter(); assert.equal(f.snapshot().screen, 'select', 'Disabled enter cannot skip departure');
  await f.finishTransition();
  assert.equal(f.selector.selected, 'coast'); assert.equal(f.mounts.coast, 0);
  await f.frame(); await f.frame(); await f.frame();
  assert.equal(f.mounts.coast, 1); assert.equal(f.selector.phase, 'entering');
  assert.equal(f.selector.busy, true); assert.equal(f.snapshot().navigating, true);
  await f.frame(); assert.equal(f.selector.busy, true, 'Arrival must resolve before input is enabled');
  await f.finishTransition(); f.expect('coast', 'select');
  return {transitions: f.transitions.map(({phase, result}) => ({phase, result}))};
});

await check('Rapid selections cancel older leave or enter completions and keep the final request', async () => {
  const f = fixture(); await f.settle();
  f.select('coast'); f.select('sunny'); f.select('coast');
  await f.flush();
  assert.equal(f.selector.busy, true); assert.equal(f.mounts.coast, 0);
  assert.deepEqual(f.transitions.slice(0, 2).map(item => item.result), [false, false]);
  await f.finishTransition(); await f.frame(); await f.frame(); await f.frame();
  assert.equal(f.selector.phase, 'entering'); assert.equal(f.selector.busy, true);
  f.select('sunny'); await f.flush();
  assert.equal(f.transitions[3].result, false, 'Old arrival should be superseded');
  assert.equal(f.selector.busy, true, 'Cancelled arrival must not unblock a newer selection');
  f.select('coast'); f.select('sunny'); await f.settle();
  f.expect('sunny', 'select');
  assert.deepEqual(f.mounts, {sunny: 1, coast: 1, festival: 0, snow: 0, desert: 0});
  assert.equal(f.home.focusCount, 0);
  return {transitionCount: f.transitions.length, finalState: f.snapshot()};
});

await check('Festival has independent preview and play deep links without loading other worlds', async () => {
  for (const mode of ['select', 'play']) {
    const f = fixture(mode === 'select' ? '#select/festival' : '#festival');
    await f.settle(); f.expect('festival', mode);
    assert.deepEqual(f.mounts, {sunny: 0, coast: 0, festival: 1, snow: 0, desert: 0});
    assert.deepEqual(f.mountOptions, [{id: 'festival', preview: mode === 'select'}]);
    if (mode === 'select') { f.enter(); await f.settle(); f.expect('festival', 'play'); }
    f.home.onclick(); await f.settle(); f.expect('festival', 'select');
    assert.equal(f.mounts.festival, 1);
  }
  return {links: ['#select/festival', '#festival']};
});

await check('All three planets support enter and return while reusing their live instances', async () => {
  const f = fixture(); await f.settle();
  for (const id of ['festival', 'coast', 'sunny', 'festival']) {
    f.select(id); await f.settle(); f.expect(id, 'select');
    f.enter(); await f.settle(); f.expect(id, 'play');
    f.home.onclick(); await f.settle(); f.expect(id, 'select');
  }
  assert.deepEqual(f.mounts, {sunny: 1, coast: 1, festival: 1, snow: 0, desert: 0});
  assert.deepEqual(f.disposals, {sunny: 0, coast: 0, festival: 0, snow: 0, desert: 0});
  f.topNav('coast'); await f.settle(); f.expect('coast', 'select');
  f.topNav('festival'); await f.settle(); f.expect('festival', 'select');
  return {mounts: f.mounts, finalState: f.snapshot()};
});

await check('Transition directions follow the visible order of all three destination cards', async () => {
  const f = fixture(); await f.settle();
  for (const [id, direction] of [['coast', 1], ['festival', 1], ['sunny', -1], ['festival', 1], ['coast', -1]]) {
    const start = f.transitions.length;
    f.select(id); await f.settle(); f.expect(id, 'select');
    assert.deepEqual(f.transitions.slice(start).map(({phase, direction: actual}) => ({phase, direction: actual})), [
      {phase: 'leaving', direction}, {phase: 'entering', direction}
    ]);
  }
  return {transitions: f.transitions.map(({phase, direction}) => ({phase, direction}))};
});

await check('Rapid three-planet choices keep only the final destination and cannot strand busy state', async () => {
  const f = fixture(); await f.settle();
  f.select('coast'); f.select('festival'); f.select('sunny'); f.select('festival');
  await f.settle(); f.expect('festival', 'select');
  assert.deepEqual(f.mounts, {sunny: 1, coast: 0, festival: 1, snow: 0, desert: 0});
  f.select('coast'); await f.finishTransition(); await f.frame(); await f.frame(); await f.frame();
  assert.equal(f.selector.phase, 'entering');
  f.select('sunny'); f.select('festival'); await f.settle(); f.expect('festival', 'select');
  f.enter(); await f.settle(); f.expect('festival', 'play');
  assert.deepEqual(f.mounts, {sunny: 1, coast: 1, festival: 1, snow: 0, desert: 0});
  return {mounts: f.mounts, finalState: f.snapshot()};
});

await check('Festival back and forward links preserve each screen without adding history', async () => {
  const f = fixture('#select/festival'); await f.settle();
  f.enter(); await f.settle(); f.home.onclick(); await f.settle();
  f.select('coast'); await f.settle(); f.enter(); await f.settle();
  const calls = f.historyCalls.length;
  await f.back(); f.expect('coast', 'select');
  await f.back(); f.expect('festival', 'play');
  await f.back(); f.expect('festival', 'select');
  await f.forward(); f.expect('festival', 'play');
  await f.forward(); f.expect('coast', 'select');
  await f.forward(); f.expect('coast', 'play');
  assert.equal(f.historyCalls.length, calls);
  assert.deepEqual(f.mounts, {sunny: 0, coast: 1, festival: 1, snow: 0, desert: 0});
  return {historyWrites: calls, finalState: f.snapshot()};
});

await check('Snow and desert preview/play deep links mount only the requested world', async () => {
  for (const id of ['snow', 'desert']) for (const mode of ['select', 'play']) {
    const f=fixture(mode==='select'?`#select/${id}`:`#${id}`);await f.settle();f.expect(id,mode);
    assert.equal(Object.values(f.mounts).reduce((a,b)=>a+b,0),1);
    assert.equal(f.mounts[id],1);
    if(mode==='select'){f.enter();await f.settle();f.expect(id,'play');}
    f.home.onclick();await f.settle();f.expect(id,'select');assert.equal(f.mounts[id],1);
  }
});
await check('All five worlds can be entered and revisited while each mounts exactly once', async () => {
  const f=fixture();await f.settle();
  for(const id of ['desert','snow','festival','coast','sunny','desert']){
    f.topNav(id);await f.settle();f.expect(id,'select');
    f.enter();await f.settle();f.expect(id,'play');
    f.home.onclick();await f.settle();f.expect(id,'select');
  }
  assert.deepEqual(f.mounts,{sunny:1,coast:1,festival:1,snow:1,desert:1});
  assert.equal(Object.values(f.disposals).reduce((a,b)=>a+b,0),0);
});
await check('Desert history returns to its original screen without remounting or extra writes', async () => {
  const f=fixture('#select/desert');await f.settle();f.enter();await f.settle();f.home.onclick();await f.settle();
  f.select('snow');await f.settle();f.enter();await f.settle();const writes=f.historyCalls.length;
  await f.back();f.expect('snow','select');await f.back();f.expect('desert','play');await f.back();f.expect('desert','select');
  await f.forward();f.expect('desert','play');await f.forward();f.expect('snow','select');await f.forward();f.expect('snow','play');
  assert.equal(f.historyCalls.length,writes);assert.equal(f.mounts.desert,1);assert.equal(f.mounts.snow,1);
});
await check('Rapid fifth-world choices cancel abandoned worlds and release the busy state', async () => {
  const f=fixture();await f.settle();f.select('snow');f.select('desert');f.select('festival');f.select('desert');
  await f.settle();f.expect('desert','select');assert.equal(f.mounts.snow,0);assert.equal(f.mounts.festival,0);
  f.enter();await f.settle();f.expect('desert','play');
});
await check('Transition directions include the fifth card in the visible order', async () => {
  const f=fixture();await f.settle();
  for(const [id,direction] of [['desert',1],['snow',-1],['desert',1],['sunny',-1]]){
    const start=f.transitions.length;f.select(id);await f.settle();f.expect(id,'select');
    assert.deepEqual(f.transitions.slice(start).map(t=>t.direction),[direction,direction]);
  }
});
const report = {
  checkedAt: new Date().toISOString(),
  scope: 'Actual twin-planets/app.js in a VM with selector/world/DOM mocks and controlled RAF. No browser layout, GPU, actual game persistence or device proof.',
  sourceSha256: createHash('sha256').update(original).digest('hex'),
  passed: reports.every(result => result.passed), total: reports.length, checks: reports
};
await fs.writeFile(new URL('./route-report.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
