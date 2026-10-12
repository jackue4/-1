import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
async function template(folder){
 const [html,rawCSS]=await Promise.all([fs.readFile(path.join(folder,'page.html'),'utf8'),fs.readFile(path.join(folder,'style.css'),'utf8')]);
 const markup=html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1].replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<nav class="bloom-planets"[\s\S]*?<\/nav>/g,'');
 let css=rawCSS.replace(/html(\[[^\]]+\])+/g,match=>`:host(${match.slice(4)})`).replace(/:root|(?<![\w.#-])(?:html|body)(?![\w-])/g,':host');
 css+='\n:host{display:block;min-height:0;min-width:0;font-family:"Segoe UI","Microsoft YaHei",sans-serif} :host([hidden]){display:none!important}#app{height:100%!important;min-height:0!important}';
 const attributes=Object.fromEntries([...html.match(/<html([^>]*)>/i)[1].matchAll(/(data-[\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
 return {markup,css,attributes};
}
const [coast,sunny]=await Promise.all([template(path.join(dir,'../kamakura-planet')),template(path.join(dir,'sunny'))]);
await fs.writeFile(path.join(dir,'templates.generated.js'),`export const coast=${JSON.stringify(coast)};\nexport const sunny=${JSON.stringify(sunny)};\n`);
const result=await build({entryPoints:[path.join(dir,'app.js')],nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],bundle:true,minify:true,format:'iife',target:'es2020',write:false,legalComments:'inline'});
const [page,css]=await Promise.all([fs.readFile(path.join(dir,'page.html'),'utf8'),fs.readFile(path.join(dir,'style.css'),'utf8')]);
const output=page.replace('/*__STYLE__*/',()=>css).replace('/*__SCRIPT__*/',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
// The two existing bookmarks receive the identical unified application.
for(const name of ['sakura-season.html','little-bloom.html'])await fs.writeFile(path.join(dir,'../../outputs',name),output,'utf8');
console.log(JSON.stringify({entry:'outputs/sakura-season.html',bytes:Buffer.byteLength(output),worlds:2,singleDocument:true,externalAssets:false}));
