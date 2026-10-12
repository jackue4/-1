import {createCloudAtlas} from './sky-clouds.js';

// Cached paint plates shared by every planet. No extra WebGL pass or RAF.
const TAU=Math.PI*2,atlases=new WeakMap();
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,Number(n)||0));
const smooth=(a,b,n)=>{const t=clamp((n-a)/(b-a));return t*t*(3-2*t);};
function random(seed){let n=(Number(seed)||13729)>>>0;return()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function acquire(doc){let e=atlases.get(doc);if(!e){e={atlas:createCloudAtlas({document:doc}),users:0};atlases.set(doc,e);}e.users++;return e.atlas;}
function release(doc){const e=atlases.get(doc);if(e&&!--e.users){e.atlas.dispose();atlases.delete(doc);}}

export function createStorybookSky({container,variant='night',seed=13729}={}){
 if(!container?.ownerDocument)throw new TypeError('The storybook sky needs a DOM container.');
 const doc=container.ownerDocument,win=doc.defaultView||window,lobby=variant==='lobby';
 const element=doc.createElement('canvas');element.className='storybook-sky';element.dataset.variant=variant;element.setAttribute('aria-hidden','true');
 element.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:0;';container.insertBefore(element,container.firstChild);
 const ctx=element.getContext('2d',{alpha:true}),motion=win.matchMedia?.('(prefers-reduced-motion: reduce)');
 let active=true,disposed=false,width=0,height=0,dpr=1,mobile=false,reduced=!!motion?.matches,observing=false;
 let elapsed=0,accumulator=1,needsDraw=true,nightVisibility=lobby?1:0,duskVisibility=0,weatherDim=1;
 let lastNight=-1,lastDusk=-1,lastDim=-1,renderedFrames=0,lastEnv={},nextMeteor=14,meteor=null;
 let atlas=null,nightPlate=null,duskPlate=null,moonSprite=null,cloudLayout=[],stars=[],dust=[];
 let rng=random(seed),moonX=.83,moonY=.21,moonRadius=17;
 const starSprites=new Map();
 function surface(w,h){const canvas=doc.createElement('canvas');canvas.width=Math.max(1,Math.ceil(w));canvas.height=Math.max(1,Math.ceil(h));return{canvas,c:canvas.getContext('2d')};}
 function gradient(c,w,h,stops){const g=c.createLinearGradient(0,0,0,h);for(const [p,color]of stops)g.addColorStop(p,color);c.fillStyle=g;c.fillRect(0,0,w,h);}
 function haze(c,x,y,rx,ry,color,alpha){c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,color);g.addColorStop(.4,color+'82');g.addColorStop(1,color+'00');c.globalAlpha=alpha;c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();}
 function starSprite(radius,cool){const key=radius+'/'+cool;if(starSprites.has(key))return starSprites.get(key);const size=radius*10,{canvas,c}=surface(size,size),m=size/2;
  haze(c,m,m,m,m,cool?'#5bcfff':'#ffe4ab',.55);c.translate(m,m);const g=c.createLinearGradient(0,-radius*2,0,radius*2);g.addColorStop(0,'#d9f5ff00');g.addColorStop(.4,'#e0f6ff9c');g.addColorStop(.5,'#fffaf0');g.addColorStop(.6,'#e0f6ff9c');g.addColorStop(1,'#d9f5ff00');c.fillStyle=g;
  c.beginPath();c.moveTo(0,-radius*2);c.quadraticCurveTo(radius*.17,-radius*.18,radius*1.45,0);c.quadraticCurveTo(radius*.17,radius*.18,0,radius*2);c.quadraticCurveTo(-radius*.17,radius*.18,-radius*1.45,0);c.quadraticCurveTo(-radius*.17,-radius*.18,0,-radius*2);c.fill();
  c.fillStyle='#fffdf0';c.beginPath();c.arc(0,0,.65+radius*.12,0,TAU);c.fill();const sprite={canvas,size};starSprites.set(key,sprite);return sprite;
 }
 function createMoon(){const size=160,{canvas,c}=surface(size,size),m=size/2;haze(c,m,m,76,76,'#b4ddf7',.2);haze(c,m,m,39,39,'#fff1c5',.2);
  const cut=surface(48,48),q=cut.c;gradient(q,48,48,[[0,'#fff8db'],[1,'#c8dce7']]);q.globalCompositeOperation='destination-in';q.beginPath();q.arc(24,24,17,0,TAU);q.fill();q.globalCompositeOperation='destination-out';q.beginPath();q.arc(31,20,16,0,TAU);q.fill();c.drawImage(cut.canvas,m-24,m-24);cut.canvas.width=cut.canvas.height=1;return{canvas,size};
 }
 function paintBase(night){const w=Math.min(1280,Math.max(480,width)),h=Math.max(240,Math.min(1100,Math.round(w*height/Math.max(1,width)))),{canvas,c}=surface(w,h),rand=random(seed+(night?53:301));
  if(night){gradient(c,w,h,[[0,'#08162e'],[.30,'#142e54'],[.62,'#25618b'],[1,'#466d98']]);
   // Broad translucent galaxy glazes and pinpricks are baked just once.
   for(let i=0;i<19;i++){const t=i/18,x=(.06+t*.88)*w,y=(.06+t*.52+Math.sin(t*9)*.045)*h;haze(c,x,y,w*(.11+rand()*.06),h*(.055+rand()*.07),i%3?'#308bb6':'#8299ce',.045+rand()*.07);}
   haze(c,w*.52,h*.58,w*.52,h*.32,'#42b7d3',.27);haze(c,w*.53,h*.76,w*.40,h*.17,'#f8d39b',.14);
   const count=mobile?480:970;dust=[];for(let i=0;i<count;i++){const x=rand()*w,y=rand()*h*.91,r=.25+rand()*.62,a=(.13+rand()*.64)*(1-smooth(.50,.95,y/h)*.7);c.globalAlpha=a;c.fillStyle=i%7===0?'#f3db9d':i%3?'#b1d9f2':'#eef7ff';c.beginPath();c.arc(x,y,r,0,TAU);c.fill();dust.push({x:x/w,y:y/h});}
   for(let i=0;i<(mobile?330:680);i++){const t=rand(),spread=(rand()+rand()+rand()-1.5)*.105,x=(.06+t*.88+spread*.3)*w,y=(.06+t*.52+Math.sin(t*9)*.045+spread)*h;c.globalAlpha=.1+rand()*.42;c.fillStyle=i%8?'#8dcff2':'#ffe4bb';c.beginPath();c.arc(x,y,.2+rand()*.55,0,TAU);c.fill();dust.push({x:x/w,y:y/h});}c.globalAlpha=1;
  }else{gradient(c,w,h,[[0,'#62648f'],[.28,'#ab87ad'],[.54,'#e7a1b2'],[.76,'#ffc7b0'],[1,'#ffe8c4']]);haze(c,w*.37,h*.61,w*.56,h*.44,'#ffd0ba',.45);haze(c,w*.36,h*.67,w*.24,h*.30,'#ffecb6',.7);
   c.save();for(let i=0;i<22;i++){const x=rand()*w,y=(.15+rand()*.52)*h,len=w*(.08+rand()*.25);c.globalAlpha=.03+rand()*.07;c.strokeStyle=i%3?'#ffe3cc':'#e2bfd4';c.lineWidth=1+rand()*5;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+len*.25,y-8,x+len*.6,y+5,x+len,y-10);c.stroke();}c.restore();
   const sunx=w*.36,suny=h*.67;haze(c,sunx,suny,w*.105,h*.17,'#fff2c7',.48);c.fillStyle='#fff0cd';c.globalAlpha=.82;c.beginPath();c.arc(sunx,suny,Math.max(9,Math.min(w,h)*.025),0,TAU);c.fill();c.globalAlpha=1;
  }return canvas;
 }
 function clearPlates(){for(const c of[nightPlate,duskPlate,moonSprite?.canvas])if(c)c.width=c.height=1;for(const s of starSprites.values())s.canvas.width=s.canvas.height=1;starSprites.clear();nightPlate=duskPlate=moonSprite=null;}
 function rebuild(){clearPlates();rng=random(seed);mobile=width<700||height<520;if(!atlas)atlas=acquire(doc);nightPlate=paintBase(true);duskPlate=paintBase(false);moonSprite=createMoon();moonRadius=mobile?13:17;moonX=mobile&&height>width?.84:.79;moonY=mobile&&height>width?.28:.21;
  stars=Array.from({length:mobile?19:34},(_,i)=>{let x=.025+rng()*.95,y=.035+rng()*.74;if(lobby&&x<.37&&y>.20)y*=.23;const radius=i%11===0?3.4:1.1+rng()*1.5;return{x,y,phase:rng()*TAU,speed:.45+rng()*.8,alpha:.35+rng()*.55,sprite:starSprite(radius,i%5!==0)};});
  // Distant banks surround an opening; large foreground towers crop at edges.
  cloudLayout=[
   {x:-.02,y:.61,s:.46,a:.40,i:1,depth:.2},{x:.24,y:.64,s:.42,a:.37,i:1,depth:.2},{x:.57,y:.66,s:.48,a:.36,i:1,depth:.2},{x:.87,y:.62,s:.51,a:.42,i:1,depth:.2},{x:1.12,y:.62,s:.5,a:.43,i:1,depth:.2},
   {x:.04,y:.78,s:.73,a:.83,i:0,depth:.55},{x:.91,y:.76,s:.88,a:.86,i:2,depth:.55},{x:.41,y:.87,s:.77,a:.71,i:1,depth:.5},{x:.69,y:.91,s:.74,a:.78,i:1,depth:.55},
   {x:-.13,y:.46,s:1.04,a:.82,i:2,depth:.8},{x:1.15,y:.49,s:1.16,a:.86,i:0,depth:.8},
   {x:.02,y:1.02,s:1.15,a:1,i:0,depth:1},{x:.95,y:1.04,s:1.24,a:1,i:2,depth:1},{x:.48,y:1.12,s:1.1,a:.97,i:1,depth:1}
  ];needsDraw=true;
 }
 function resize(){if(!active||disposed)return;const rect=container.getBoundingClientRect(),w=Math.max(0,Math.round(rect.width)),h=Math.max(0,Math.round(rect.height)),pixelRatio=Math.min(1.35,win.devicePixelRatio||1);if(w===width&&h===height&&pixelRatio===dpr)return;width=w;height=h;dpr=pixelRatio;element.width=Math.max(1,Math.round(width*dpr));element.height=Math.max(1,Math.round(height*dpr));ctx?.setTransform(dpr,0,0,dpr,0,0);if(width&&height&&ctx)rebuild();needsDraw=true;}
 function drawClouds(plates,alpha){if(alpha<.003)return;const base=Math.max(width/1280,height/800),portrait=width<height,scale=base*(portrait?.70:1),t=reduced?0:elapsed;
  for(let i=0;i<cloudLayout.length;i++){const p=cloudLayout[i],plate=plates[p.i],w=plate.width*p.s*scale,h=plate.height*p.s*scale,drift=Math.sin(t*(.012+p.depth*.01)+i*1.73)*(3+p.depth*8),lift=Math.cos(t*.009+i)*p.depth*2;ctx.globalAlpha=alpha*p.a;ctx.drawImage(plate.canvas,p.x*width-w/2+drift,p.y*height-h/2+lift,w,h);}
 }
 function draw(){if(!ctx||!width||!height)return;ctx.clearRect(0,0,width,height);lastNight=nightVisibility;lastDusk=duskVisibility;lastDim=weatherDim;renderedFrames++;if(Math.max(nightVisibility,duskVisibility)<.003||!atlas)return;
  ctx.save();const dusk=duskVisibility,night=nightVisibility;
  if(dusk>.003){ctx.globalAlpha=dusk;ctx.drawImage(duskPlate,0,0,width,height);drawClouds(atlas.dusk,dusk);}
  if(night>.003){ctx.globalAlpha=night;ctx.drawImage(nightPlate,0,0,width,height);
   for(const star of stars){const t=reduced?0:elapsed,pulse=.72+Math.sin(t*star.speed+star.phase)*.28,s=star.sprite;ctx.globalAlpha=night*weatherDim*star.alpha*pulse;ctx.drawImage(s.canvas,star.x*width-s.size/2,star.y*height-s.size/2,s.size,s.size);}
   const moonScale=moonRadius/17;ctx.globalAlpha=night*.78*weatherDim;ctx.drawImage(moonSprite.canvas,moonX*width-moonSprite.size*moonScale/2,moonY*height-moonSprite.size*moonScale/2,moonSprite.size*moonScale,moonSprite.size*moonScale);
   if(meteor){const t=meteor.age/meteor.duration,len=Math.min(width,height)*.18,x=meteor.x*width-t*width*.22,y=meteor.y*height+t*height*.23,dx=len*.8,dy=-len*.55;ctx.globalAlpha=night*weatherDim*Math.sin(t*Math.PI)*.62;const trail=ctx.createLinearGradient(x,y,x+dx,y+dy);trail.addColorStop(0,'#edfaff');trail.addColorStop(.15,'#91d3f6b8');trail.addColorStop(1,'#91d3f600');ctx.strokeStyle=trail;ctx.lineWidth=1.1;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx,y+dy);ctx.stroke();}
   drawClouds(atlas.night,night);
  }
  ctx.globalAlpha=Math.max(night,dusk)*(1-weatherDim)*.66;ctx.fillStyle='#192c4b';ctx.fillRect(0,0,width,height);
  if(lobby){const veil=ctx.createLinearGradient(0,0,width,0);veil.addColorStop(0,'#17273e99');veil.addColorStop(.4,'#17273e2b');veil.addColorStop(1,'#17273e00');ctx.globalAlpha=.8;ctx.fillStyle=veil;ctx.fillRect(0,0,width,height);}ctx.restore();
 }
 const observer=typeof win.ResizeObserver==='function'?new win.ResizeObserver(resize):null;
 function motionChanged(e){reduced=e.matches;meteor=null;needsDraw=true;}
 function observe(){if(observing)return;observing=true;observer?.observe(container);if(!observer)win.addEventListener('resize',resize);motion?.addEventListener?.('change',motionChanged);}
 function disconnect(){if(!observing)return;observing=false;observer?.disconnect();win.removeEventListener('resize',resize);motion?.removeEventListener?.('change',motionChanged);}
 observe();resize();
 return{element,update(dt=0,env=lastEnv){if(!active||disposed)return;lastEnv=env||{};const delta=clamp(dt,0,.25),preview=!!lastEnv.preview,night=clamp(lastEnv.night),twilight=clamp(lastEnv.sunset??lastEnv.dusk);
   const storm=Math.max(clamp(lastEnv.storm),clamp(lastEnv.tornado)),dim=Math.max(.22,1-clamp(lastEnv.cloud)*.13-clamp(lastEnv.rain)*.38-clamp(lastEnv.snow)*.20-storm*.30),targetNight=preview?0:lobby?1:smooth(.12,.94,night)*(1-twilight*.98),targetDusk=preview||lobby?0:twilight*(1-targetNight);
   const ease=1-Math.exp(-delta*3);function approach(value,target){if(Math.abs(value-target)<.001)return target;return value+(target-value)*ease;}
   nightVisibility=approach(nightVisibility,targetNight);duskVisibility=approach(duskVisibility,targetDusk);weatherDim=approach(weatherDim,dim);
   if(preview||!lobby&&night<.04&&twilight<.01){if(lastNight>0||lastDusk>0)needsDraw=true;nightVisibility=duskVisibility=0;meteor=null;}
   if(!reduced)elapsed+=delta;accumulator+=delta;
   if(!preview&&!reduced&&nightVisibility>.7&&weatherDim>.56){if(meteor){meteor.age+=delta;if(meteor.age>=meteor.duration)meteor=null;}else if(delta>0&&elapsed>=nextMeteor){meteor={x:.52+rng()*.4,y:.07+rng()*.25,age:0,duration:1.7+rng()*.5};nextMeteor=elapsed+17+rng()*11;}}else meteor=null;
   const changed=Math.abs(nightVisibility-lastNight)>.0005||Math.abs(duskVisibility-lastDusk)>.0005||Math.abs(weatherDim-lastDim)>.0005,animated=delta>0&&!reduced&&Math.max(nightVisibility,duskVisibility)>.003;
   if((needsDraw||accumulator>=1/(mobile?24:30))&&(needsDraw||changed||animated)){draw();needsDraw=false;accumulator=0;}
  },setActive(value){if(disposed||active===!!value)return;active=!!value;element.style.visibility=active?'':'hidden';if(active){reduced=!!motion?.matches;observe();resize();needsDraw=true;accumulator=1;}else{disconnect();meteor=null;}},
  getState:()=>({variant,active,reducedMotion:reduced,width,height,dpr,stars:stars.length,dust:dust.length,moon:!!moonSprite,clouds:cloudLayout.length,visibility:Number(Math.max(nightVisibility,duskVisibility).toFixed(3)),nightVisibility:Number(nightVisibility.toFixed(3)),duskVisibility:Number(duskVisibility.toFixed(3)),weatherDim:Number(weatherDim.toFixed(3)),meteors:meteor?1:0,renderedFrames,elapsed,cachedCloudSprites:atlas?6:0}),
  dispose(){if(disposed)return;disposed=true;active=false;disconnect();element.remove();clearPlates();if(atlas)release(doc);atlas=null;stars=[];dust=[];cloudLayout=[];meteor=null;}
 };
}
