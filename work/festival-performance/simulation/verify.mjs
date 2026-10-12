import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import {fileURLToPath,pathToFileURL} from 'node:url';import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url)),outfile=path.join(here,'effects-tests.bundle.mjs');
await build({entryPoints:[path.join(here,'../../festival-planet/effects-test.mjs')],bundle:true,platform:'node',format:'esm',outfile,nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],logLevel:'silent'});
await import(pathToFileURL(outfile));
const safety=path.join(here,'safety.bundle.mjs');await build({entryPoints:[path.join(here,'safety.js')],bundle:true,platform:'node',format:'esm',outfile:safety,nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],logLevel:'silent'});await import(pathToFileURL(safety));
