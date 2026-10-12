const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),original='C:/Users/chenyahan/Documents/Codex/2026-09-15/neng';
const link='<nav class="bloom-planets" aria-label="选择星球"><a href="little-bloom.html" aria-current="page">晴日星球</a><a href="sakura-season.html">✿ 樱花季</a></nav>';
const css='<style id="bloom-planets-style">.bloom-planets{position:absolute;z-index:6;top:84px;left:23px;display:flex;gap:4px;padding:4px;border:1px solid #ffffffb8;background:#fffdf0de;backdrop-filter:blur(12px);border-radius:22px}.bloom-planets a{font-size:10px;letter-spacing:.6px;text-decoration:none;color:#64806a;border-radius:18px;padding:9px 13px}.bloom-planets a[aria-current]{background:#dce9ca}.bloom-planets a:last-child{color:#a4778b}.bloom-planets a:hover{background:#f1dee7}@media(max-width:600px){.bloom-planets{top:126px;left:18px}.bloom-planets a{font-size:9px;padding:8px 11px}}</style>';
for(const file of [path.join(root,'outputs/little-bloom.html'),path.join(original,'outputs/little-bloom.html'),path.join(original,'work/planet-v2/page.html')]){
  let text=fs.readFileSync(file,'utf8');if(text.includes('bloom-planets-style'))continue;
  const backup=path.join(root,'work',file.endsWith('page.html')?'sunny-page-before-switch.html':file.startsWith(root)?'sunny-current-before-switch.html':'sunny-original-before-switch.html');
  fs.copyFileSync(file,backup);text=text.replace('</head>',css+'\n</head>').replace('</header>','</header>\n'+link);fs.writeFileSync(file,text);
}
fs.copyFileSync(path.join(root,'outputs/sakura-season.html'),path.join(original,'outputs/sakura-season.html'));
console.log('Two-way local planet links added; sakura copied beside the original planet.');
