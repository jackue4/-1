// Always bundle current source. No generated test bundle is reused.
import { build } from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import { parseHTML } from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/linkedom/esm/index.js';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const dir = path.dirname(fileURLToPath(import.meta.url));
globalThis.__sunnyRegressionDOM = parseHTML(await fs.readFile(path.join(dir, '../twin-planets/sunny/page.html'), 'utf8')).document;
const built = await build({ entryPoints: [path.join(dir, 'regression.test.js')], bundle: true, write: false, platform: 'node', format: 'esm', nodePaths: ['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'] });
const { report } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
delete globalThis.__sunnyRegressionDOM;
await fs.writeFile(path.join(dir, 'regression-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (report.failed) process.exitCode = 1;
