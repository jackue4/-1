import assert from 'node:assert/strict';
import { createSunnyClimate } from '../twin-planets/sunny/climate.js';
import { makeDay, weatherAt, weatherSegments, restore, persist, STORAGE_KEY, lightAt, random, chooseEvent } from '../twin-planets/sunny/ecology.js';
import { restoreFarm, plant, water, advanceFarm, harvest } from '../twin-planets/sunny/farming.js';
import { restoreConstruction, advanceConstruction, BUILD_DURATION } from '../twin-planets/sunny/construction.js';
import { createResidentHomes } from '../twin-planets/sunny/resident-homes.js';
import { createFarmUI } from '../twin-planets/sunny/farm-ui.js';
import { createWorld, direction } from '../twin-planets/sunny/world.js';

export const report = { passed: 0, failed: 0, checks: [], scope: 'Fresh actual ecology, farming, construction, resident homes and Three world modules; GPU and DOM rendering are not tested.' };
function test(name, run) { try { run(); report.passed++; report.checks.push({ name, passed: true }); } catch (error) { report.failed++; report.checks.push({ name, passed: false, error: error.message }); } }
const date = new Date(2026, 8, 20, 12), stamp = date.getTime();
test('Existing local natural weather and offline farm segmentation stay deterministic', () => {
  assert.deepEqual(makeDay(date), makeDay(new Date(stamp)));
  const segments = weatherSegments(stamp - 30 * 60 * 60 * 1000, stamp);
  assert.ok(segments.length > 5);
  assert.equal(segments.reduce((sum, value) => sum + value.seconds, 0), 30 * 60 * 60);
  assert.ok(segments.every(value => value.seconds > 0 && typeof value.rain === 'boolean'));
  assert.ok(weatherAt(makeDay(date), date).type);
  assert.equal(lightAt(22).daylight, 0); assert.equal(lightAt(12).daylight, 1); assert.equal(lightAt(17.5).sunset, 1);
  const rng = random(91);
  for (let i = 0; i < 20; i++) assert.ok(['rainDance', 'sprouts', 'breeze'].includes(chooseEvent('rain', false, '', rng)));
});
test('Wet and dry farm growth, harvest inventory and save round trip still work', () => {
  const wet = restoreFarm(null, stamp), dry = restoreFarm(null, stamp);
  assert.equal(plant(wet, 0, 'radish').ok, true); assert.equal(plant(dry, 0, 'radish').ok, true);
  advanceFarm(wet, stamp + 30000, () => [{ seconds: 30, rain: true }]);
  advanceFarm(dry, stamp + 30000, () => [{ seconds: 30, rain: false }]);
  assert.ok(wet.plots[0].growth > dry.plots[0].growth); assert.equal(wet.plots[0].water, 100);
  assert.equal(water(dry, 0).ok, true);
  advanceFarm(wet, stamp + 60000, () => [{ seconds: 30, rain: true }]);
  assert.equal(harvest(wet, 0).ok, true); assert.equal(wet.produce.radish, 2); assert.equal(wet.seeds.radish, 6);
  const values = new Map(), storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const saved = restore(storage, date); saved.farm = wet; saved.construction.elapsed = 37;
  assert.equal(persist(storage, saved), true); assert.ok(values.has(STORAGE_KEY));
  const reloaded = restore(storage, new Date(stamp + 60000)); assert.deepEqual(reloaded.farm, wet); assert.equal(reloaded.construction.elapsed, 37);
});
test('Visual climate clock and manual presets cannot accelerate or mutate farm/construction save', () => {
  const farm = restoreFarm(null, stamp), building = restoreConstruction({ elapsed: 10, speed: 3 });
  plant(farm, 0, 'wheat'); const before = JSON.stringify({ farm, building });
  const climate = createSunnyClimate({ date, seed: 15 });
  for (const weather of ['storm', 'tornado', 'meteor', 'rainbow', 'snow']) { climate.selectWeather(weather); climate.selectSeason('winter'); climate.update(3600, date); }
  assert.equal(JSON.stringify({ farm, building }), before);
  advanceConstruction(building, .05, false); assert.equal(building.elapsed, 10);
  advanceConstruction(building, .05, true); assert.equal(building.elapsed, 10.15);
  building.paused = true; advanceConstruction(building, .05, true); assert.equal(building.elapsed, 10.15);
});
test('Actual resident-home state machine admits severe-weather shelter, restores daylight and retains night behavior', () => {
  for (const weather of ['storm', 'tornado', 'night']) {
    const n = direction(.4, .5), resident = { normal: n.clone(), root: { visible: true }, working: true };
    let opens = 0;
    const cottage = { entryNormal: n.clone(), root: { position: direction(.44, .52) }, name: '小屋', getState: () => ({ complete: true }), welcomeHome: () => opens++ };
    const homes = createResidentHomes({ residents: [resident], cottages: [cottage], navigation: { safeGoal: value => value.clone(), blocked: () => false } });
    const env = { night: Number(weather === 'night'), storm: Number(weather === 'storm'), tornado: Number(weather === 'tornado') };
    homes.update(.05, 1, env); assert.equal(homes.getState().bedtime, true); assert.ok(homes.pose(0));
    homes.update(.05, 2.6, env); assert.equal(homes.getState().inside, 1); assert.equal(resident.root.visible, false); assert.equal(resident.working, false); assert.ok(opens >= 1);
    homes.update(.05, 3, { night: 0, storm: 0, tornado: 0 });
    homes.update(.05, 4.1, { night: 0, storm: 0, tornado: 0 });
    assert.equal(homes.getState().bedtime, false); assert.equal(homes.getState().inside, 0); assert.equal(resident.root.visible, true);
  }
});
const climate = createSunnyClimate({ date, seed: 91 });
climate.selectSeason('summer'); climate.selectHour(12);
const environment = weather => { climate.selectWeather(weather); const c = climate.getState(); return { ...c.env, night: 1 - lightAt(c.hour).daylight, sunset: lightAt(c.hour).sunset, petAway: 0 }; };
const world = createWorld(3, BUILD_DURATION);
let time = 0;
function frames(count, env) { for (let i = 0; i < count; i++) world.update(.05, time += .05, env); }
test('Actual farm UI clears queued work during severe weather before any delayed watering or harvest can occur', () => {
  const now = Date.now(), state = { farm: restoreFarm(null, now), construction: restoreConstruction({ elapsed: BUILD_DURATION }), travel: { snacks: 0 } };
  const ui = createFarmUI({ document: globalThis.__sunnyRegressionDOM, getState: () => state, world, save() {}, toast() {}, focus() {}, renderTravel() {} });
  plant(state.farm, 0, 'wheat');
  for (const weather of ['tornado', 'storm']) {
    const jobs = ui.beforeFrame(.05, .1, environment('clear')); assert.ok(jobs.size > 0);
    const job = jobs.get(0), resident = world.residents[0], original = resident.normal.clone();
    resident.normal.copy(job.normal); job.dwell = 2.18;
    const waterBefore = state.farm.plots[0].water;
    assert.equal(ui.beforeFrame(.05, .2, environment(weather)).size, 0);
    ui.afterFrame(1);
    assert.equal(state.farm.plots[0].water, waterBefore, `${weather} completed a cancelled farm job`);
    resident.normal.copy(original);
    assert.ok(ui.beforeFrame(.05, .3, environment('clear')).size > 0);
  }
});
test('Real world still supports sunny activity and rain umbrellas; precipitation never assigns outdoor work', () => {
  frames(2, environment('clear')); assert.equal(world.homes.getState().bedtime, false); assert.ok(world.residents.every(p => p.root.visible));
  frames(2, { ...environment('rain'), farmJobs: new Map([[0, { normal: world.residents[0].normal.clone(), lookAt: direction(.4, 0), kind: 'water' }]]) });
  assert.ok(world.residents.every(p => !p.working && !p.watering.visible)); assert.ok(world.residents.every(p => p.umbrella.visible));
  assert.equal(world.homes.getState().bedtime, false);
});
test('Real world tornado and storm shelter take priority over farm jobs and fishing without teleporting residents', () => {
  for (const weather of ['tornado', 'storm']) {
    const positions = world.residents.map(p => p.normal.clone());
    frames(2, { ...environment(weather), farmJobs: new Map([[0, { normal: world.residents[0].normal.clone(), lookAt: direction(.4, 0), kind: 'water' }]]) });
    assert.equal(world.homes.getState().bedtime, true); assert.equal(world.homes.getState().returning, world.residents.length);
    for (const [i, resident] of world.residents.entries()) { assert.equal(resident.working, false); assert.equal(resident.watering.visible, false); assert.ok(resident.normal.distanceTo(positions[i]) < .02); assert.ok(!world.navigation.blocked(resident.normal)); }
    frames(2, environment('clear')); assert.equal(world.homes.getState().bedtime, false);
  }
});
test('Real world meteor night turns on path lamps and returns residents home; clear noon resumes the day', () => {
  frames(90, environment('meteor')); assert.equal(world.pathLights.getState().on, true); assert.equal(world.homes.getState().bedtime, true); assert.ok(world.residents.every(p => !p.working));
  frames(90, environment('clear')); assert.equal(world.pathLights.getState().on, false); assert.equal(world.homes.getState().bedtime, false);
});
world.dispose();
