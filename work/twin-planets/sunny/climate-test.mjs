import assert from 'node:assert/strict';
import { createSunnyClimate, SEASONS, CLIMATE_WEATHER } from './climate.js';

const date = new Date(2026, 8, 20, 14, 15);
const checks = [];
function test(name, run) { run(); checks.push({ name, passed: true }); }
const make = options => createSunnyClimate({ date, seed: 4729, ...options });
function validate(state) {
  assert.ok(SEASONS[state.season]); assert.ok(CLIMATE_WEATHER[state.weather]);
  assert.ok(Number.isFinite(state.hour) && state.hour >= 0 && state.hour < 24);
  assert.ok(Number.isFinite(state.phaseRemaining) && state.phaseRemaining >= 0 && state.phaseRemaining <= 48);
  assert.ok(Math.abs(Object.keys(SEASONS).reduce((sum, key) => sum + state.env[key], 0) - 1) < 1e-10);
  for (const value of Object.values(state.env)) assert.ok(Number.isFinite(value) && value >= 0 && value <= 1);
}
test('Identical supplied dates and seeds produce an identical journey', () => {
  const a = make(), b = make();
  for (let i = 0; i < 1800; i++) assert.deepEqual(a.update(.47, date), b.update(.47, date));
  assert.equal(make().getState().season, 'autumn'); assert.equal(make().getState().hour, 8.5);
});
test('Automatic seasons wrap continuously with normalized finite color weights', () => {
  const c = make();
  for (let i = 0; i < 3000; i++) validate(c.update(.2, date));
  c.restoreState({ ...c.captureState(), journeyTime: 74.999 });
  const before = c.getState().env; const after = c.update(.002, date).env;
  for (const id of Object.keys(SEASONS)) assert.ok(Math.abs(before[id] - after[id]) < 1e-6);
  assert.equal(c.getState().season, 'winter');
});
test('Random event boundaries are independent of render frame size', () => {
  const a = make(), b = make();
  a.update(1000, date);
  for (let i = 0; i < 4000; i++) b.update(.25, date);
  assert.equal(a.getState().weather, b.getState().weather);
  assert.equal(a.captureState().randomState, b.captureState().randomState);
  assert.ok(Math.abs(a.getState().phaseRemaining - b.getState().phaseRemaining) < 1e-8);
});
test('Every random weather is reachable, rain and storm resolve to a rainbow, and choices do not repeat', () => {
  const seen = new Set();
  for (const season of Object.keys(SEASONS)) {
    const c = make(); c.selectSeason(season);
    for (let i = 0; i < 400; i++) {
      const before = c.getState(); seen.add(before.weather);
      const after = c.update(before.phaseRemaining, date); seen.add(after.weather);
      assert.notEqual(after.weather, before.weather);
      if (before.weather === 'rain' || before.weather === 'storm') assert.equal(after.weather, 'rainbow');
      if (season !== 'winter') assert.notEqual(after.weather, 'snow');
      validate(after);
    }
  }
  assert.deepEqual([...seen].sort(), Object.keys(CLIMATE_WEATHER).sort());
});
test('Winter strongly favors snow; natural summer snow is suppressed while manual snow works', () => {
  const c = make(); c.selectSeason('winter');
  let snow = 0;
  for (let i = 0; i < 400; i++) { if (c.getState().weather === 'snow') snow++; c.update(c.getState().phaseRemaining, date); }
  assert.ok(snow > 60, `Expected frequent winter snow, got ${snow}`);
  c.setMode('today'); c.selectSeason('auto');
  assert.equal(c.update(0, new Date(2026, 6, 1), { weatherType: 'snow', hour: 12 }).weather, 'cloudy');
  assert.equal(c.selectWeather('snow').weather, 'snow'); assert.equal(c.getState().env.snow, 1);
});
test('Explicit weather is persistent and supplies an appropriate hour for sky events', () => {
  const c = make(); c.selectHour(8);
  for (const [weather, hour] of [['meteor', 22], ['rainbow', 12.5], ['tornado', 16]]) {
    c.selectWeather(weather); const state = c.update(3600, date);
    assert.equal(state.weather, weather); assert.equal(state.hour, hour); validate(state);
  }
  c.selectWeather('clear'); assert.equal(c.selectHour(17.5).hour, 17.5);
  assert.equal(c.selectHour(null).hourMode, 'auto');
});
test('Today mode follows the supplied date and natural weather and never advances journey time', () => {
  const c = make(); c.setMode('today');
  const state = c.update(95, new Date(2026, 0, 2, 5, 20), { weatherType: 'snow', hour: 5.25 });
  assert.equal(state.season, 'winter'); assert.equal(state.weather, 'snow'); assert.equal(state.hour, 5.25);
  assert.equal(state.journeyTime, 0); assert.equal(state.phaseRemaining, 0);
  c.setMode('journey'); assert.equal(c.getState().season, 'autumn'); assert.equal(c.getState().hour, 8.5);
});
test('Paused or hidden dt=0 leaves clocks and PRNG unchanged', () => {
  const c = make(); c.update(21, date); const snapshot = c.captureState();
  for (let i = 0; i < 1000; i++) c.update(0, date);
  assert.deepEqual(c.captureState(), snapshot);
});
test('Preview snapshot restores modes, timers, state, and the entire future random sequence', () => {
  const a = make(), control = make(); a.update(57, date); control.update(57, date);
  const snapshot = a.captureState();
  a.selectSeason('winter'); a.selectWeather('meteor'); a.selectHour(17.5); a.update(1000, date); a.setMode('today');
  assert.equal(a.restoreState(snapshot), true); assert.deepEqual(a.getState(), control.getState());
  for (let i = 0; i < 60; i++) assert.deepEqual(a.update(27, date), control.update(27, date));
  assert.equal(a.restoreState({ ...snapshot, weatherRemaining: NaN }), false);
  assert.deepEqual(a.getState(), control.getState());
});
test('Invalid inputs are ignored or bounded without producing NaN', () => {
  const c = createSunnyClimate({ date: new Date(NaN), seed: NaN, seasonDuration: -4, dayDuration: Infinity });
  c.selectSeason('__proto__'); c.selectWeather('__proto__'); c.selectHour(NaN); c.setMode('broken');
  for (const dt of [NaN, Infinity, -1, 1e20]) validate(c.update(dt, new Date(NaN), { hour: Infinity, weatherType: '__proto__' }));
  assert.equal(c.getState().seasonMode, 'auto'); assert.equal(c.getState().weatherMode, 'auto');
});
console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
