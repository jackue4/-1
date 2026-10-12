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
const [coast,sunny,festival]=await Promise.all([template(path.join(dir,'../kamakura-planet')),template(path.join(dir,'sunny')),template(path.join(dir,'../festival-planet'))]);
await fs.writeFile(path.join(dir,'templates.generated.js'),`export const coast=${JSON.stringify(coast)};\nexport const sunny=${JSON.stringify(sunny)};\nexport const festival=${JSON.stringify(festival)};\n`);
const result=await build({entryPoints:[path.join(dir,'app.js')],nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],bundle:true,minify:true,format:'iife',target:'es2020',write:false,legalComments:'inline'});
const [page,shellCSS,selectorCSS]=await Promise.all([fs.readFile(path.join(dir,'page.html'),'utf8'),fs.readFile(path.join(dir,'style.css'),'utf8'),fs.readFile(path.join(dir,'planet-selector.css'),'utf8')]);
const css=shellCSS+'\n'+selectorCSS;
const output=page.replace('/*__STYLE__*/',()=>css).replace('/*__SCRIPT__*/',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
// The two existing bookmarks receive the identical unified application.
for(const name of ['sakura-season.html','little-bloom.html'])await fs.writeFile(path.join(dir,'../../outputs',name),output,'utf8');
await fs.mkdir(path.join(dir,'../../outputs/icons'),{recursive:true});
for(const file of ['manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'])await fs.copyFile(path.join(dir,file),path.join(dir,'../../outputs',file));
console.log(JSON.stringify({entry:'outputs/sakura-season.html',bytes:Buffer.byteLength(output),worlds:3,singleDocument:true,sceneAssetsInline:true,installAssets:4}));
