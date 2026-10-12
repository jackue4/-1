import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createStorybookSky} from '../twin-planets/storybook-sky.js';

const dir=path.dirname(fileURLToPath(import.meta.url)),checks=[];
const check=(name,passed,details={})=>checks.push({name,passed:!!passed,...details});
class Signals extends EventTarget{
 constructor(){super();this.listeners=new Map();}
 addEventListener(type,fn,opts){super.addEventListener(type,fn,opts);if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}
 removeEventListener(type,fn,opts){super.removeEventListener(type,fn,opts);this.listeners.get(type)?.delete(fn);}
 count(type){return this.listeners.get(type)?.size||0;}
}
function fingerprint(value){
 if(typeof value==='number')return Number.isFinite(value)?Math.round(value*1e5)/1e5:String(value);
 if(value?.isCanvasStub)return`canvas:${value.width}x${value.height}:${value.context.hash}`;
 if(value?.stops)return{gradient:value.kind,args:value.args,stops:value.stops};
 if(value?.commands)return value.commands;
 return value;
}
class CanvasContext{
 constructor(canvas){this.canvas=canvas;this.hash=2166136261;this.clears=0;this.operations=0;this.invalid=[];this.stack=[];this.styles={};Object.assign(this,{globalAlpha:1,fillStyle:'#000000',strokeStyle:'#000000',lineWidth:1,globalCompositeOperation:'source-over',shadowBlur:0,shadowColor:'rgba(0, 0, 0, 0)',lineCap:'butt',lineJoin:'miter',font:'10px sans-serif',textAlign:'start',textBaseline:'alphabetic'});
  return new Proxy(this,{get:(self,key)=>key in self?self[key]: (...args)=>self.command(key,args),set:(self,key,value)=>{if(['globalAlpha','lineWidth','shadowBlur'].includes(key)&&typeof value==='number'&&(!Number.isFinite(value)||key==='globalAlpha'&&(value<0||value>1)))self.invalid.push({key,value});self[key]=value;if(!['hash','clears','operations','invalid','stack','styles','canvas'].includes(key))self.command(`set:${key}`,[value]);return true;}});
 }
 command(name,args=[]){
  if(args.some(v=>typeof v==='number'&&!Number.isFinite(v)))this.invalid.push({name,args});
  if(name==='arc'&&args[2]<0)this.invalid.push({name,args});
  const text=JSON.stringify([name,...args.map(fingerprint)]);let h=this.hash;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);this.hash=h>>>0;this.operations++;
 }
 clearRect(...args){this.hash=2166136261;this.clears++;this.command('clearRect',args);}
 createLinearGradient(...args){this.command('createLinearGradient',args);return{kind:'linear',args,stops:[],addColorStop(at,color){this.stops.push([at,color]);}};}
 createRadialGradient(...args){this.command('createRadialGradient',args);return{kind:'radial',args,stops:[],addColorStop(at,color){this.stops.push([at,color]);}};}
 save(){const snapshot={};for(const key of ['globalAlpha','fillStyle','strokeStyle','lineWidth','globalCompositeOperation','shadowBlur','shadowColor','lineCap','lineJoin','font','textAlign','textBaseline'])snapshot[key]=this[key];this.stack.push(snapshot);this.command('save');}restore(){if(!this.stack.length)this.invalid.push({name:'unbalanced restore'});else Object.assign(this,this.stack.pop());this.command('restore');}
 measureText(text){return{width:String(text).length*8};}
 getImageData(x,y,width,height){this.command('getImageData',[x,y,width,height]);return{data:new Uint8ClampedArray(width*height*4),width,height};}
}
class Canvas{
 constructor(doc){this.ownerDocument=doc;this.style={};this.dataset={};this.width=300;this.height=150;this.isCanvasStub=true;this.context=new CanvasContext(this);}
 getContext(){return this.context;}setAttribute(name,value){this[name]=value;}
 remove(){if(this.parent){this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null;}}
}
globalThis.Path2D=class{constructor(){this.commands=[];return new Proxy(this,{get:(self,key)=>key in self?self[key]:(...args)=>self.commands.push([key,...args])});}};
function environment({width=1000,height=720,dpr=2,reduced=false,observer=true}={}){
 const win=new Signals(),motion=new Signals(),canvases=[],observers=[];motion.matches=reduced;win.devicePixelRatio=dpr;win.matchMedia=()=>motion;let autonomousFrames=0;win.requestAnimationFrame=()=>{autonomousFrames++;throw new Error('The sky must use its host clock, not an independent RAF');};
 if(observer)win.ResizeObserver=class{constructor(fn){this.fn=fn;this.active=false;observers.push(this);}observe(container){this.container=container;this.active=true;}disconnect(){this.active=false;}};
 const doc={defaultView:win,createElement(tag){if(tag!=='canvas')throw new Error(`Unexpected element ${tag}`);const canvas=new Canvas(doc);canvases.push(canvas);return canvas;}};
 function container(){return{ownerDocument:doc,children:[],width,height,get firstChild(){return this.children[0]||null;},insertBefore(el,first){if(el.parent)el.remove();el.parent=this;const at=this.children.indexOf(first);if(at<0)this.children.push(el);else this.children.splice(at,0,el);},getBoundingClientRect(){return{width:this.width,height:this.height};}};}
 const host=container();
 return{host,doc,win,motion,canvases,observers,container,get autonomousFrames(){return autonomousFrames;},resize(w,h,ratio=win.devicePixelRatio){host.width=w;host.height=h;win.devicePixelRatio=ratio;if(observer){for(const o of observers)if(o.active)o.fn();}else win.dispatchEvent(new Event('resize'));},setReduced(value){motion.matches=value;const e=new Event('change');Object.defineProperty(e,'matches',{value});motion.dispatchEvent(e);}};
}
const night={night:1,dusk:0,sunset:0,cloud:0,rain:0,snow:0},day={night:0,dusk:0,cloud:0,rain:0,snow:0};
function advance(sky,seconds,env,step=1/60){for(let i=0;i<Math.round(seconds/step);i++)sky.update(step,env);}
function mount(config={},options={}){const e=environment(config),sky=createStorybookSky({container:e.host,seed:62771,...options});return{e,sky,ctx:sky.element.context};}
const worlds=[];const keep=(...args)=>{const x=mount(...args);worlds.push(x);return x;};
try{
 const {e,sky,ctx}=keep();
 check('Public sky interface and accessible noninteractive canvas remain compatible',['update','setActive','getState','dispose'].every(k=>typeof sky[k]==='function')&&sky.element.parent===e.host&&sky.element['aria-hidden']==='true'&&sky.element.style.cssText.includes('pointer-events:none'));
 sky.update(0,day);advance(sky,2,day);check('Non-lobby daylight stays completely transparent',sky.getState().visibility===0&&sky.getState().nightVisibility===0&&sky.getState().duskVisibility===0,{state:sky.getState()});
 advance(sky,8,night);check('A clear night converges to a visible sky with stars and moon',sky.getState().nightVisibility>.99&&sky.getState().stars>0&&sky.getState().moon,{state:sky.getState()});
 const allocated=e.canvases.length;advance(sky,4,night);check('Steady animation reuses cached canvas assets and owns no RAF',e.canvases.length===allocated&&e.autonomousFrames===0,{canvases:allocated,autonomousFrames:e.autonomousFrames});
 const pauseState=JSON.stringify(sky.getState()),pauseHash=ctx.hash,pauseDraws=ctx.clears;for(let i=0;i<240;i++)sky.update(0,night);check('dt=0 freezes particle state and performs no repeated sky drawing',JSON.stringify(sky.getState())===pauseState&&ctx.hash===pauseHash&&ctx.clears===pauseDraws,{drawDelta:ctx.clears-pauseDraws});
 const inactiveWidth=sky.getState().width;sky.setActive(false);const inactiveDraws=ctx.clears,inactiveCanvases=e.canvases.length;e.resize(390,844,3);advance(sky,8,night);check('Inactive preview or hidden world does no drawing or resize asset work',!sky.getState().active&&sky.getState().width===inactiveWidth&&ctx.clears===inactiveDraws&&e.canvases.length===inactiveCanvases&&e.observers.every(o=>!o.active)&&e.motion.count('change')===0);
 sky.setActive(true);sky.update(0,night);check('Reactivation adopts the latest mobile viewport once and bounds pixel density',sky.getState().width===390&&sky.getState().height===844&&sky.getState().dpr<=1.5&&ctx.clears>inactiveDraws&&e.motion.count('change')===1,{state:sky.getState()});
 const sameSize=e.canvases.length;e.resize(390,844,3);sky.update(0,night);check('Unchanged resize does not reconstruct sky assets',e.canvases.length===sameSize);
 e.resize(844,390);sky.update(0,night);check('Landscape rotation updates canvas size with finite drawing coordinates',sky.getState().width===844&&sky.getState().height===390&&sky.element.width>0&&sky.element.height>0&&e.canvases.every(c=>c.context.invalid.length===0));
 e.resize(0,0);sky.update(0,night);const zeroDraws=ctx.clears;advance(sky,1,night);check('A zero-sized canvas does not draw or emit invalid coordinates',ctx.clears===zeroDraws&&e.canvases.every(c=>c.context.invalid.length===0));e.resize(1000,720);
 const twilightA=keep(),twilightB=keep();advance(twilightA.sky,8,{...day,sunset:1});advance(twilightB.sky,8,{...day,dusk:1});check('Sunny sunset and other-world dusk aliases both produce the same visible twilight',twilightA.sky.getState().duskVisibility>.9&&twilightB.sky.getState().duskVisibility>.9&&Math.abs(twilightA.sky.getState().duskVisibility-twilightB.sky.getState().duskVisibility)<.001,{sunset:twilightA.sky.getState(),dusk:twilightB.sky.getState()});
 const alias=keep();advance(alias.sky,8,{...day,sunset:0,dusk:1});check('Explicit sunset zero takes precedence over a stale dusk alias',alias.sky.getState().duskVisibility===0);
 const preview=keep();advance(preview.sky,8,night);preview.sky.update(.25,night);const previewClearBefore=preview.ctx.clears;preview.sky.update(0,{...night,preview:true});check('Explicit preview immediately clears the actual canvas even with dt=0 just after a draw',preview.sky.getState().visibility===0&&preview.ctx.clears===previewClearBefore+1,{clearDelta:preview.ctx.clears-previewClearBefore,state:preview.sky.getState()});
 const immediateDay=keep();advance(immediateDay.sky,8,night);immediateDay.sky.update(.25,night);const dayClearBefore=immediateDay.ctx.clears;immediateDay.sky.update(0,day);check('An immediate daylight environment clears a paused night canvas without waiting for a frame budget',immediateDay.sky.getState().visibility===0&&immediateDay.ctx.clears===dayClearBefore+1,{clearDelta:immediateDay.ctx.clears-dayClearBefore});
 const weather=keep();advance(weather.sky,8,night);const clearDim=weather.sky.getState().weatherDim;advance(weather.sky,8,{...night,cloud:1,rain:1,snow:1});check('Heavy weather dims the sky and suppresses incidental meteors',weather.sky.getState().weatherDim<clearDim&&weather.sky.getState().weatherDim>=0&&weather.sky.getState().meteors===0,{clearDim,stormState:weather.sky.getState()});
 const reduced=keep({reduced:true});advance(reduced.sky,18,night);const reducedDraws=reduced.ctx.clears;advance(reduced.sky,20,night);check('Reduced motion has no meteors or continuous redrawing after lighting settles',reduced.sky.getState().reducedMotion&&reduced.sky.getState().meteors===0&&reduced.ctx.clears===reducedDraws,{drawDelta:reduced.ctx.clears-reducedDraws});
 reduced.e.setReduced(false);advance(reduced.sky,2,night);check('Changing reduced-motion preference re-enables animated sky drawing',!reduced.sky.getState().reducedMotion&&reduced.ctx.clears>reducedDraws);reduced.e.setReduced(true);advance(reduced.sky,1,night);const fixedDraws=reduced.ctx.clears;advance(reduced.sky,2,night);check('Changing reduced-motion preference back settles to a static sky',reduced.sky.getState().reducedMotion&&reduced.ctx.clears===fixedDraws);
 const seedA=keep({}, {seed:42}),seedB=keep({}, {seed:42}),seedC=keep({}, {seed:43});advance(seedA.sky,4,night);advance(seedB.sky,4,night);advance(seedC.sky,4,night);check('Equal seed, viewport and host time produce deterministic drawing commands',seedA.ctx.hash===seedB.ctx.hash&&seedA.ctx.hash!==seedC.ctx.hash,{sameSeedHashes:[seedA.ctx.hash,seedB.ctx.hash],differentSeedHash:seedC.ctx.hash});
 const lobby=keep({}, {variant:'lobby'});advance(lobby.sky,4,day);check('The lobby retains its night sky even with day environment input',lobby.sky.getState().nightVisibility>.99&&lobby.sky.getState().duskVisibility===0);
 const fallback=keep({observer:false});fallback.e.resize(460,720);fallback.sky.update(0,night);check('Resize event fallback works without ResizeObserver',fallback.sky.getState().width===460&&fallback.e.win.count('resize')===1);
 const shared=keep(),sharedOther=createStorybookSky({container:shared.e.container(),seed:671}),cloudCanvases=shared.e.canvases.filter(c=>Math.abs(c.width/c.height-640/300)<.01&&c.width>=320);check('A document shares exactly six cached night/dusk cloud plates across instances',shared.sky.getState().cachedCloudSprites===6&&sharedOther.getState().cachedCloudSprites===6&&cloudCanvases.length===6,{cloudCanvases:cloudCanvases.length});shared.sky.dispose();check('Disposing one sky does not release cloud plates still used by another',cloudCanvases.every(c=>c.width>1&&c.height>1));sharedOther.dispose();check('Last sky disposal releases the shared cloud plate backing canvases',cloudCanvases.every(c=>c.width===1&&c.height===1));
 const disposeTest=keep();advance(disposeTest.sky,2,night);const beforeDispose=disposeTest.ctx.clears;disposeTest.sky.dispose();disposeTest.sky.dispose();disposeTest.e.resize(400,800);disposeTest.e.setReduced(true);disposeTest.sky.setActive(true);advance(disposeTest.sky,1,night);check('Disposal is idempotent and removes canvas, resize and motion resources',disposeTest.e.host.children.length===0&&disposeTest.e.observers.every(o=>!o.active)&&disposeTest.e.motion.count('change')===0&&disposeTest.ctx.clears===beforeDispose);
 check('All exercised Canvas2D commands have finite coordinates and balanced save/restore',worlds.every(({e})=>e.canvases.every(c=>c.context.invalid.length===0&&c.context.stack.length===0)),{invalid:worlds.flatMap(({e})=>e.canvases.flatMap(c=>c.context.invalid)).slice(0,8)});
}catch(error){check('Sky module executes the tested lifecycle without an exception',false,{error:error.stack});}
finally{for(const {sky}of worlds)sky.dispose();}
const report={checkedAt:new Date().toISOString(),passed:checks.every(c=>c.passed),method:'Production storybook-sky.js and cloud atlas execute against a command-recording Canvas2D/DOM stub. Tests verify timing, caching, finite commands, lifecycle and interface contracts. No pixels are rasterized; composition, perceived quality and browser performance require the parent browser review.',checks};await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,'sky-module-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
