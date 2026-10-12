// Run the real transition controller against controllable Web Animations doubles.
// This checks concurrency, fill/cancel and reduced-motion behavior; it does not
// establish rendered smoothness or browser composition, which need visual QA.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

const sourceURL = new URL('../twin-planets/planet-transitions.js', import.meta.url);
const original = await fs.readFile(sourceURL, 'utf8');
const source = original.replace('export function createPlanetTransitions', 'function createPlanetTransitions');
const checks = [];
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const plain = value => JSON.parse(JSON.stringify(value));

function fixture({reduced = false} = {}) {
  const animations = [], samples = [];
  const root = {dataset: {}};
  const makeElement = name => ({
    name,
    baseline: {opacity: '1', transform: 'none'},
    current() {
      const animation = [...animations].reverse().find(item => item.element === this && !item.cancelled);
      return animation ? animation.sample : this.baseline;
    },
    animate(keyframes, options) {
      let resolve, reject;
      const finished = new Promise((yes, no) => { resolve = yes; reject = no; });
      const animation = {
        element: this, keyframes: plain(keyframes), options: plain(options), finished,
        sample: plain(keyframes[0]), cancelled: false, completed: false, cancelCount: 0,
        progress(sample) { assert(!this.cancelled); this.sample = {...this.sample, ...sample}; },
        finish() {
          if (this.cancelled || this.completed) return;
          this.completed = true;
          this.sample = plain(this.keyframes.at(-1));
          resolve(this);
        },
        cancel() {
          this.cancelCount++;
          if (this.cancelled) return;
          this.cancelled = true;
          if (!this.completed) reject(new Error('Animation cancelled'));
        }
      };
      animations.push(animation);
      return animation;
    }
  });
  const preview = makeElement('preview'), story = makeElement('story');
  const context = vm.createContext({
    Promise,
    window: {matchMedia: query => {
      assert.equal(query, '(prefers-reduced-motion: reduce)');
      return {matches: reduced};
    }},
    getComputedStyle: element => {
      const sample = {...element.current()}; samples.push({name: element.name, sample});
      return {opacity: String(sample.opacity), transform: sample.transform};
    }
  });
  vm.runInContext(source, context, {filename: sourceURL.pathname});
  const transition = context.createPlanetTransitions({root, preview, story});
  const active = () => animations.filter(animation => !animation.cancelled);
  const complete = async () => { active().forEach(animation => animation.finish()); await flush(); };
  function expectClean() {
    assert.equal(root.dataset.transition, 'idle');
    assert.equal(transition.getState().phase, 'idle');
    assert.deepEqual(active(), [], 'No fill-forwards animation may remain on an idle selector');
    for (const element of [preview, story]) assert.deepEqual(element.current(), element.baseline);
  }
  return {root, preview, story, transition, animations, samples, active, complete, expectClean};
}

async function check(name, run) {
  try { checks.push({name, passed: true, ...await run()}); }
  catch (error) { checks.push({name, passed: false, error: error.stack || String(error)}); }
}

await check('Departure holds both layers at zero opacity until incoming frames are ready', async () => {
  const f = fixture(); let resolved = false;
  const leaving = f.transition.leave(1).then(value => { resolved = true; return value; });
  assert.equal(f.root.dataset.transition, 'leaving');
  assert.deepEqual(f.active().map(animation => animation.options.duration), [310, 200]);
  f.active()[1].finish(); await flush();
  assert.equal(resolved, false, 'Short story fade must not prematurely resolve the planet departure');
  await f.complete(); assert.equal(await leaving, true);
  assert.equal(f.root.dataset.transition, 'leaving');
  assert.equal(f.active().length, 2);
  for (const element of [f.preview, f.story]) assert.equal(Number(element.current().opacity), 0);
  await flush();
  for (const element of [f.preview, f.story]) assert.equal(Number(element.current().opacity), 0);
  const leavingAnimations = [...f.active()];
  const entering = f.transition.enter(1);
  assert(leavingAnimations.every(animation => animation.cancelled));
  for (const element of [f.preview, f.story]) assert.equal(Number(element.current().opacity), 0);
  assert.equal(f.active()[1].options.delay, 80);
  await f.complete(); assert.equal(await entering, true); f.expectClean();
  return {leaveDurations: [310, 200], entryDurations: [740, 500], descriptionDelay: 80};
});

await check('Superseding a transition samples its live pose and cannot clear the newer animation', async () => {
  const f = fixture(); const first = f.transition.leave(1);
  const firstAnimations = [...f.active()];
  firstAnimations[0].progress({opacity: .43, transform: 'matrix(0.93,0,0,0.93,-21,0)'});
  firstAnimations[1].progress({opacity: .27, transform: 'matrix(1,0,0,1,0,-5)'});
  const second = f.transition.leave(-1), secondAnimations = [...f.active()];
  assert(firstAnimations.every(animation => animation.cancelled));
  assert.equal(secondAnimations[0].keyframes[0].opacity, '0.43');
  assert.equal(secondAnimations[0].keyframes[0].transform, 'matrix(0.93,0,0,0.93,-21,0)');
  assert.equal(secondAnimations[1].keyframes[0].opacity, '0.27');
  assert.equal(await first, false); await flush();
  assert.deepEqual(f.active(), secondAnimations, 'The cancelled generation must not clear the latest effect');
  assert.equal(f.root.dataset.transition, 'leaving');
  assert.match(secondAnimations[0].keyframes.at(-1).transform, /translateX\(52px\)/);
  await f.complete(); assert.equal(await second, true);
  const entering = f.transition.enter(-1); await f.complete();
  assert.equal(await entering, true); f.expectClean();
  return {sampledOpacity: .43, cancelledGenerationResult: false, latestGenerationResult: true};
});

await check('Rapid leave-enter-leave replacement finishes idle with no opacity or transform residue', async () => {
  const f = fixture();
  const departure = f.transition.leave(1); await f.complete(); assert.equal(await departure, true);
  const oldArrival = f.transition.enter(1);
  f.active()[0].progress({opacity: .62, transform: 'matrix(.94,0,0,.94,19,0)'});
  const middleDeparture = f.transition.leave(-1);
  const finalDeparture = f.transition.leave(1);
  assert.equal(await oldArrival, false); assert.equal(await middleDeparture, false);
  assert.equal(f.active().length, 2); assert.equal(f.root.dataset.transition, 'leaving');
  await f.complete(); assert.equal(await finalDeparture, true);
  const finalArrival = f.transition.enter(1); await f.complete(); assert.equal(await finalArrival, true);
  f.expectClean();
  assert(f.animations.every(animation => animation.cancelled));
  return {animationCount: f.animations.length, finalState: plain(f.transition.getState())};
});

await check('Explicit cancellation during either phase settles pending callers and restores the layout', async () => {
  for (const phase of ['leave', 'enter']) {
    const f = fixture(); const pending = f.transition[phase](1);
    f.transition.cancel(); assert.equal(await pending, false); f.expectClean();
    f.transition.cancel(); f.expectClean();
    const next = f.transition.enter(-1); await f.complete(); assert.equal(await next, true); f.expectClean();
  }
  return {phases: ['leave', 'enter']};
});

await check('System reduced-motion preference uses 90 ms opacity fades with no displacement or delay', async () => {
  const f = fixture({reduced: true});
  const identityPoses = new Set(['none', 'translate(0,0) scale(1)', 'translateX(0) scale(1) rotate(0deg)', 'translateY(0)']);
  for (const phase of ['leave', 'enter']) {
    const pending = f.transition[phase](-1);
    for (const animation of f.active()) {
      assert.equal(animation.options.duration, 90);
      assert.equal(animation.options.delay, 0);
      for (const keyframe of animation.keyframes) {
        assert(identityPoses.has(keyframe.transform), `Reduced motion contains a displacement: ${keyframe.transform}`);
      }
    }
    await f.complete(); assert.equal(await pending, true);
  }
  f.expectClean();
  return {duration: 90, delay: 0, displacement: false};
});

const report = {
  checkedAt: new Date().toISOString(),
  scope: 'Actual planet-transitions.js executed with controllable Web Animations promises, computed styles, cancellation and preference mocks. Visual smoothness and browser rendering require separate QA.',
  sourceSha256: createHash('sha256').update(original).digest('hex'),
  passed: checks.every(check => check.passed), total: checks.length, checks
};
await fs.writeFile(new URL('./transition-report.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
