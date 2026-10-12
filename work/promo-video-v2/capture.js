const shots=await(await fetch('/shots.json')).json();
const previous=await fetch('/capture-report.json').then(r=>r.ok?r.json():{shots:[]}).catch(()=>({shots:[]}));
const W=1080,H=1920,wait=ms=>new Promise(r=>setTimeout(r,ms));
const rootFor=id=>document.getElementById('world-'+id)?.shadowRoot;
const style=document.createElement('style');style.textContent='body{grid-template-rows:minmax(0,1fr)!important}.world-host,#transit{grid-area:1/1!important}.universe-bar,.display-controls,#screen-tip{visibility:hidden!important}#promo-preview{position:fixed;inset:0;width:100%;height:100%;z-index:100;pointer-events:none}#promo-status{position:fixed;left:12px;bottom:12px;z-index:110;background:#f7f1dd;color:#34574b;padding:8px 12px;border-radius:10px;font:12px sans-serif}';document.head.append(style);
const canvas=document.createElement('canvas');canvas.id='promo-preview';canvas.width=W;canvas.height=H;document.body.append(canvas);
const ctx=canvas.getContext('2d',{alpha:false}),status=document.createElement('div');status.id='promo-status';document.body.append(status);
let shotIndex=0,capturing=false,ready=false,error=null,recorded=previous.shots||[],drawCount=0,lastDraw=0,frameGaps=[],captureStart=0,clockTick=-1,samples=[],sampleTick=-1;
const result={shots:recorded,width:W,height:H,requestedFps:30,source:'Live WebGL canvas capture, existing scene time and view controls, editorial typography'};
const state=()=>shots[shotIndex].world==='sunny'?window.littleBloom?.getState():window.umiWorld?.getState();
function setHour(hour){const input=rootFor('sunny').querySelector('#time-range');input.value=String(hour);input.dispatchEvent(new Event('input',{bubbles:true}));}
async function waitWorld(id){for(let n=0;n<400;n++){if(window.bloomUniverse?.getState().active===id&&document.getElementById('world-'+id).dataset.ready==='true')return;await wait(50);}throw Error('World did not become ready: '+id);}
async function prepare(index){
 if(capturing)throw Error('Recording in progress');ready=false;shotIndex=index;const shot=shots[index];status.textContent='取景：'+shot.label;
 document.querySelector(`[data-world-button="${shot.world}"]`).click();await waitWorld(shot.world);
 const host=document.getElementById('world-'+shot.world),root=rootFor(shot.world);host.dataset.immersive='true';host.dataset.tools='false';
 if(shot.world==='coast'){
  root.querySelector(`[data-view-button="${shot.view}"]`).click();root.querySelector(`[data-phase-button="${shot.phase}"]`).click();
 }else{
  if(!window.littleBloom.getState().construction.preview)root.querySelector('#build-preview').click();
  root.querySelector('#'+shot.view).click();root.querySelector('[data-weather="clear"]').click();setHour(shot.hour);
  const rotation=root.querySelector('#rotate-toggle');if(shot.view==='globe-view'&&rotation.getAttribute('aria-pressed')!=='true')rotation.click();
 }
 await wait(shot.phase==='night'||shot.hour===22?5000:shot.phase==='dusk'||shot.hour===17.5?4000:2600);
 const source=root.querySelector('canvas');if(Math.abs(source.width/source.height-W/H)>.002)throw Error('Source aspect ratio must match portrait output');
 ready=true;status.textContent='就绪：'+shot.label;return {index,world:shot.world,view:shot.view,canvas:[source.width,source.height],state:compactState()};
}
function compactState(){const s=state();if(!s)return null;return shots[shotIndex].world==='sunny'?{timeHour:s.timeHour,night:s.night,sunset:s.sunset,nightSky:s.nightSky,streetLights:s.streetLights,homes:s.homes,viewMode:s.viewMode}:{mode:s.mode,phase:s.phase,time:s.time,train:s.train,beacons:s.beacons};}
function write(text,x,y,size,color,weight=400){while(size>20){ctx.font=`${weight} ${size}px "Microsoft YaHei",sans-serif`;if(ctx.measureText(text).width<=936)break;size--;}ctx.fillStyle=color;ctx.fillText(text,x,y);}
function draw(now){
 requestAnimationFrame(draw);const shot=shots[shotIndex],root=rootFor(shot.world),source=root?.querySelector('canvas');
 if(capturing&&shot.dayNight){
  const t=(now-captureStart)/1000-.25,bucket=Math.floor(t*10);if(bucket!==clockTick){clockTick=bucket;const h=t<1?8.5:t<4?8.5+(t-1)*3:t<5.4?17.5:t<7.1?17.5+(t-5.4)*4.5/1.7:22;setHour(Math.min(22,h));}
 }
 const s=state(),night=shot.world==='sunny'?(s?.night||0):shot.phase==='night'?1:0,dusk=shot.world==='sunny'?(s?.sunset||0):shot.phase==='dusk'?1:0;
 let top=night>.5?'#203446':dusk>.45?'#c6c7dc':'#9bc9d6',bottom=night>.5?'#486b75':dusk>.45?'#efd3ae':'#e0e8cb';
 if(shot.world==='sunny'){const c=getComputedStyle(document.getElementById('world-sunny')).backgroundColor;if(c!=='rgba(0, 0, 0, 0)')top=bottom=c;}
 const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,top);bg.addColorStop(1,bottom);ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 if(shot.world==='coast'){ctx.fillStyle=night>.5?'#fff1c9':dusk>.45?'#ffe7a0':'#fff4cd';ctx.globalAlpha=.76;ctx.beginPath();ctx.arc(W*.83,H*(dusk>.45?.30:.20),night>.5?24:39,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
 if(source?.width)ctx.drawImage(source,0,0,W,H);
 const upper=ctx.createLinearGradient(0,0,0,shot.headline?410:210);upper.addColorStop(0,night>.5?'rgba(13,25,41,.36)':'rgba(244,248,231,.65)');upper.addColorStop(1,'rgba(244,248,231,0)');ctx.fillStyle=upper;ctx.fillRect(0,0,W,shot.headline?410:210);
 const lower=ctx.createLinearGradient(0,H-430,0,H);lower.addColorStop(0,'rgba(14,35,38,0)');lower.addColorStop(1,'rgba(14,35,38,.75)');ctx.fillStyle=lower;ctx.fillRect(0,H-430,W,430);
 const ink=night>.48&&dusk<.6?'#fff2db':'#294e45';ctx.textAlign='left';write('LITTLE BLOOM  /  '+(shot.world==='sunny'?'晴日小岛':'海风来信'),68,92,23,ink,500);ctx.fillStyle=night>.48?'#eaca94':'#648477';ctx.fillRect(70,119,42,3);
 if(shot.headline){write(shot.headline[0],65,222,64,ink,600);write(shot.headline[1],65,308,64,ink,600);}
 if(shot.dayNight&&s){const minutes=Math.round(s.timeHour*60);write(String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0'),68,224,56,ink,400);write(s.night>.75?'星夜':s.sunset>.3?'晚霞':'晴日',68,272,25,ink);}
 ctx.textAlign='center';write(shot.label,W/2,1615,46,'#fff5e4',500);write(shot.sub,W/2,1690,31,'#fff5e4');
 write(shotIndex===14?'评论区留下一座城市  ·  天气 App 构想':'交互场景实录  ·  天气 App 构想',W/2,1750,22,'#dce5d8');
 ctx.fillStyle='#fff9';ctx.fillRect(446,1805,188*(shotIndex+1)/shots.length,2);ctx.fillStyle='#fff3';ctx.fillRect(446,1805,188,2);
 if(capturing){if(lastDraw)frameGaps.push(now-lastDraw);lastDraw=now;drawCount++;const tick=Math.floor((now-captureStart)/200);if(tick!==sampleTick){sampleTick=tick;samples.push({at:(now-captureStart)/1000,...compactState()});}}
}
requestAnimationFrame(draw);
async function record(index){
 if(capturing)throw Error('Already recording');if(!ready||shotIndex!==index||shots[index].dayNight)await prepare(index);const shot=shots[index];
 if(shot.meteor){status.textContent='等待真实流星进入画面';const deadline=performance.now()+24000;while(performance.now()<deadline){const sky=window.littleBloom.getState().nightSky;if(!sky.meteorActive&&sky.nextMeteorIn<=1.8)break;await wait(120);}}
 const stream=canvas.captureStream(30),mime='video/webm;codecs=vp9',recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:14000000}),chunks=[];
 const done=new Promise((resolve,reject)=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=e=>reject(e.error);recorder.onstop=resolve;});
 capturing=true;drawCount=0;lastDraw=0;frameGaps=[];clockTick=-1;sampleTick=-1;samples=[];captureStart=performance.now();status.textContent='录制中：'+shot.label;
 recorder.start(1000);await wait((shot.duration+1)*1000);recorder.stop();await done;capturing=false;stream.getTracks().forEach(t=>t.stop());
 const blob=new Blob(chunks,{type:mime}),name=String(index+1).padStart(2,'0')+'.webm';const response=await fetch('/save/'+name,{method:'POST',body:blob});if(!response.ok)throw Error('Save failed');
 const details={index,name,world:shot.world,view:shot.view,phase:shot.phase,editedDuration:shot.duration,rawDuration:(performance.now()-captureStart)/1000,framesDrawn:drawCount,averageDrawFps:Math.round(drawCount/(performance.now()-captureStart)*10000)/10,maxFrameGapMs:Math.max(0,...frameGaps),bytes:blob.size,meteorVisible:samples.some(s=>s.nightSky?.meteorActive),samples};
 recorded=recorded.filter(r=>r.index!==index);recorded.push(details);result.shots=recorded;await fetch('/save/capture-report.json',{method:'POST',body:JSON.stringify(result,null,2)});status.textContent='已保存：'+name;
 return {...details,samples:undefined,start:samples[0],end:samples.at(-1)};
}
window.promoRecorder={prepare,record,shots,getState:()=>({shotIndex,capturing,ready,error,recorded:recorded.map(r=>({index:r.index,name:r.name,bytes:r.bytes,meteorVisible:r.meteorVisible}))}),preview:()=>new Promise(resolve=>canvas.toBlob(async blob=>resolve(await(await fetch('/save/preview-'+String(shotIndex+1).padStart(2,'0')+'.png',{method:'POST',body:blob})).json()),'image/png'))};
prepare(0).catch(e=>{error=e.message;status.textContent=error;});
