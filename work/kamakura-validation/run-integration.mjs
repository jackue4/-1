import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),file=path.join(dir,'integration-bundle.mjs');
await build({entryPoints:[path.join(dir,'integration-entry.js')],outfile:file,nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],bundle:true,platform:'node',format:'esm'});
process.env.KAMAKURA_TEST_REPORT=path.join(dir,'integration-report.json');
await import(pathToFileURL(file).href);
