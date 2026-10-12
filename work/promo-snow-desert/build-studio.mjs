import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const rig=`
 let captureShot=null,captureIndex=0;
 function capturePose(){
  if(!captureShot)return;
  const shot=captureShot,p=poseFor(shot.view),u=captureIndex/(shot.duration*30+11);
  const offset=p.position.clone().sub(p.target).multiplyScalar((shot.zoom||1)*(1-u*.025));
  const axis=shot.view==='globe'?new THREE.Vector3(0,1,0):p.up;
  offset.applyAxisAngle(axis,(shot.heading||0)+(u-.5)*(shot.orbit||.1));
  camera.position.copy(p.target).add(offset);camera.up.copy(p.up);camera.lookAt(p.target);controls.target.copy(p.target);camera.updateMatrixWorld();
 }
 window.captureRig={renderer,camera,scene,planet,sky,env,
  configure(shot){captureShot=shot;captureIndex=0;flight=null;paused=false;previewing=false;planet.rotation.set(0,0,0);time=shot.time;setPhase(shot.phase);Object.assign(env,targetEnv);world.update(time,env);ANIMAL_UPDATE setView(shot.view,true);controls.enabled=false;for(let i=0;i<36;i++)sky.update(.25,env);last=0;renderer.shadowMap.needsUpdate=true;},
  step(index){captureIndex=index;time=captureShot.time+index/30-1/30;const now=100000+index*1000/30;last=now-1000/30;frame(now);return{frame:index,time,camera:camera.position.toArray(),target:controls.target.toArray(),night:env.night,daylight:env.daylight,dusk:env.dusk,render:anime.getInfo()};}
 };
`;
for(const name of ['snow','desert']){
 const folder=path.resolve(dir,`../${name}-planet`);
 const result=await build({stdin:{contents:`import {mount${name==='snow'?'Snow':'Desert'}} from './app.js'; mount${name==='snow'?'Snow':'Desert'}(document);`,resolveDir:folder,sourcefile:'capture-entry.js'},bundle:true,minify:true,format:'iife',write:false,target:'es2020',nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],plugins:[{name:'isolated-film-rig',setup(b){b.onLoad({filter:/(snow|desert)-planet[\\/]app\.js$/},async args=>{
  let code=await fs.readFile(args.path,'utf8');
  code=code.replace('alpha:true,powerPreference:','alpha:true,preserveDrawingBuffer:true,powerPreference:');
  code=code.replaceAll('requestAnimationFrame(frame)','0');
  code=code.replace('if(!paused&&!flight&&!previewing){const ratio=budget.sample(elapsed);','if(false){const ratio=budget.sample(elapsed);');
  if(name==='snow')code=code.replace('world.waterSurface.renderReflection(renderer,scene,camera,','capturePose();world.waterSurface.renderReflection(renderer,scene,camera,');
  else code=code.replace('anime.render(scene,camera,env);','capturePose();anime.render(scene,camera,env);');
  code=code.replace('function dispose(){',rig.replace('ANIMAL_UPDATE',name==='snow'?'animals.update(time,env);':'')+'\nfunction dispose(){');
  return{contents:code,loader:'js',resolveDir:path.dirname(args.path)};
 });}}]});
 const markup=await fs.readFile(path.join(folder,'page.html'),'utf8'),css=await fs.readFile(path.join(folder,'style.css'),'utf8');
 const extra='html,body,#app{width:1080px!important;height:1920px!important;margin:0;overflow:hidden}.snow-tools,.desert-tools,#loading{display:none!important}#film{position:fixed;inset:0;z-index:100;width:1080px;height:1920px;pointer-events:none}';
 const html=markup.replace('</head>',()=>`<style>${css}\n${extra}</style></head>`).replace('</body>',()=>`<script>${result.outputFiles[0].text.replaceAll('</script','<\\/script')}</script><script type="module" src="/compositor.js"></script></body>`);
 await fs.writeFile(path.join(dir,name+'.html'),html);
 console.log(name,Buffer.byteLength(html));
}
