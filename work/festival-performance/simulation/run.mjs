import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import {fileURLToPath} from 'node:url';import path from 'node:path';import fs from 'node:fs/promises';
const here=path.dirname(fileURLToPath(import.meta.url)),variant=process.argv[2]||'after';
const plugins=variant==='before'?[{name:'baseline',setup(b){b.onLoad({filter:/festival-planet[\\/](coaster|rides|festival-effects)\.js$/},async({path:p})=>({contents:await fs.readFile(path.join(here,path.basename(p)),'utf8'),loader:'js',resolveDir:path.dirname(p)}));}}]:[];
await build({entryPoints:[path.join(here,'benchmark.js')],bundle:true,platform:'node',format:'esm',outfile:path.join(here,`${variant}.bundle.mjs`),nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],plugins,logLevel:'silent'});
