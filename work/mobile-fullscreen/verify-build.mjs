import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {transform} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import * as templates from '../twin-planets/templates.generated.js';

const [html, alias, shell] = await Promise.all([
  fs.readFile('outputs/sakura-season.html', 'utf8'),
  fs.readFile('outputs/little-bloom.html', 'utf8'),
  fs.readFile('work/twin-planets/style.css', 'utf8')
]);
const checks = await Promise.all(Object.entries({shell, ...Object.fromEntries(Object.entries(templates).map(([key,value])=>[key,value.css]))}).map(async ([name, css]) => {
  const result = await transform(css, {loader: 'css', target: ['safari14', 'chrome90']});
  assert.equal(result.warnings.length, 0, name + ' CSS warnings');
  return {name, warnings: result.warnings};
}));
new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
assert.equal(html, alias);
assert(html.includes('id="screen-toggle"') && html.includes('id="tools-toggle"'));
const manifest = JSON.parse(await fs.readFile('outputs/manifest.webmanifest', 'utf8'));
const report = {checks, syntax: true, entriesIdentical: true, hasControls: true, bytes: Buffer.byteLength(html), manifest};
await fs.writeFile('work/mobile-fullscreen/build-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({passed: true, bytes: report.bytes, cssWarnings: 0, entriesIdentical: true}));
