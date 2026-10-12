(() => {
 const W=1080,H=1920,shots=[
  {world:'sunny',view:'sunny-view',label:'晴日小岛',top:['我用 AI','做了一颗小星球'],sub:'把想象，变成可以走进去的世界。',duration:4},
  {world:'coast',view:'train',phase:'day',label:'海风电车',top:['让海风','慢一点'],sub:'电车穿过小城，也穿过一个午后。',duration:5},
  {world:'coast',view:'cruise',phase:'day',label:'追一场海上的风',top:['把忙碌','留在海的那边'],sub:'游船、水花，还有水下的小小世界。',duration:5},
  {world:'sunny',view:'meadow-view',weather:'rain',label:'下一步的想象',top:['如果天气','也可以被看见'],sub:'想把它，做成一个治愈系天气 App。',duration:5},
  {world:'coast',view:'coast',phase:'night',label:'留一盏灯，等你回来',top:['你想装进','哪座城市的天气？'],sub:'在评论区，留下一座城市。',duration:5}
 ];
 const style=document.createElement('style');style.textContent='body{grid-template-rows:minmax(0,1fr)!important}.world-host,#transit{grid-area:1/1!important}.universe-bar,.display-controls,#screen-tip{visibility:hidden!important}#promo-preview{position:fixed;inset:0;width:100%;height:100%;z-index:100;pointer-events:none}#promo-status{position:fixed;left:12px;bottom:12px;z-index:110;background:#f7f1dd;color:#34574b;padding:8px 12px;border-radius:10px;font:12px sans-serif}';document.head.append(style);
 const canvas=document.createElement('canvas');canvas.id='promo-preview';canvas.width=W;canvas.height=H;document.body.append(canvas);
 const ctx=canvas.getContext('2d',{alpha:false});const status=document.createElement('div');status.id='promo-status';status.textContent='宣传片录制工作台';document.body.append(status);
 let shotIndex=0,capturing=false,ready=false,error=null,recorded=[],drawCount=0,lastDraw=0,frameGaps=[];
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const rootFor=id=>document.getElementById('world-'+id).shadowRoot;
 const result={shots:recorded,width:W,height:H,requestedFps:30,source:'Live WebGL canvas capture with promotional typography; no city weather data'};
 async function waitWorld(id){for(let n=0;n<400;n++){if(window.bloomUniverse?.getState().active===id&&document.getElementById('world-'+id).dataset.ready==='true')return;await wait(50);}throw Error('World did not become ready: '+id);}
 async function prepare(index){
  ready=false;shotIndex=index;const shot=shots[index];status.textContent='取景：'+shot.label;
  document.querySelector(`[data-world-button="${shot.world}"]`).click();await waitWorld(shot.world);
  const root=rootFor(shot.world);document.getElementById('world-'+shot.world).dataset.immersive='true';document.getElementById('world-'+shot.world).dataset.tools='false';
  if(shot.world==='coast'){
   root.querySelector(`[data-view-button="${shot.view}"]`).click();root.querySelector(`[data-phase-button="${shot.phase}"]`).click();
  }else{
   root.querySelector('#sunny-view').click();if(shot.view!=='sunny-view')root.querySelector('#'+shot.view).click();if(shot.weather)root.querySelector(`[data-weather="${shot.weather}"]`).click();
  }
  await wait(shot.phase==='night'?5000:2500);ready=true;status.textContent='就绪：'+shot.label;return {index,world:shot.world,view:shot.view};
 }
 function line(text,x,y,font,color){ctx.font=font;ctx.fillStyle=color;ctx.fillText(text,x,y);}
 function draw(now){
  requestAnimationFrame(draw);const shot=shots[shotIndex],root=rootFor(shot.world),source=root?.querySelector('canvas');
  const night=shot.phase==='night',rain=shot.weather==='rain';
  let top=night?'#263951':rain?'#afc6c6':'#a8d1d9',bottom=night?'#759091':rain?'#dce3d8':'#e7eedc';
  if(shot.world==='sunny') {const c=getComputedStyle(document.getElementById('world-sunny')).backgroundColor;if(c!=='rgba(0, 0, 0, 0)'){top=c;bottom=c;}}
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,top);bg.addColorStop(1,bottom);ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  if(shot.world==='coast'){
   const sx=W*.83,sy=H*.20,r=night?24:39;ctx.fillStyle=night?'#fff2d4':'#fff4cb';ctx.beginPath();ctx.arc(sx,sy,r,0,Math.PI*2);ctx.fill();
  }
  if(source?.width){ctx.drawImage(source,0,0,W,H);}
  const shade=ctx.createLinearGradient(0,0,0,540);shade.addColorStop(0,night?'rgba(20,36,50,.72)':'rgba(239,245,225,.85)');shade.addColorStop(1,'rgba(239,245,225,0)');ctx.fillStyle=shade;ctx.fillRect(0,0,W,540);
  const foot=ctx.createLinearGradient(0,H-450,0,H);foot.addColorStop(0,'rgba(20,49,45,0)');foot.addColorStop(1,'rgba(17,42,39,.76)');ctx.fillStyle=foot;ctx.fillRect(0,H-450,W,450);
  const ink=night?'#fff2db':'#294e45';
  ctx.textAlign='left';line('LITTLE BLOOM  /  AI CREATIVE JOURNAL',70,102,'500 22px "Segoe UI",sans-serif',ink);
  ctx.fillStyle=night?'#f1ce99':'#608777';ctx.fillRect(72,134,48,4);
  line(shot.top[0],66,249,'600 80px "Microsoft YaHei",sans-serif',ink);line(shot.top[1],66,356,'600 80px "Microsoft YaHei",sans-serif',ink);
  ctx.textAlign='center';line(shot.label,W/2,1575,'400 29px "Microsoft YaHei",sans-serif','#fff4df');
  line(shot.sub,W/2,1656,'400 36px "Microsoft YaHei",sans-serif','#fff7e7');
  line('交互场景实录  ·  天气 App 构想',W/2,1727,'400 23px "Microsoft YaHei",sans-serif','#e0e8d9');
  ctx.fillStyle='#e0e7d888';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(W/2+(i-2)*25,1800,i===shotIndex?5:3,0,Math.PI*2);ctx.fill();}
  if(capturing){if(lastDraw)frameGaps.push(now-lastDraw);lastDraw=now;drawCount++;}
 }
 requestAnimationFrame(draw);
 async function record(index){
  if(capturing)throw Error('Already recording');await prepare(index);const shot=shots[index];
  const stream=canvas.captureStream(30),mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm;codecs=vp8';
  const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:10000000}),chunks=[];
  const done=new Promise((resolve,reject)=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=e=>reject(e.error);recorder.onstop=resolve;});
  capturing=true;drawCount=0;lastDraw=0;frameGaps=[];status.textContent='录制中：'+shot.label;const start=performance.now();recorder.start(1000);await wait((shot.duration+1)*1000);recorder.stop();await done;capturing=false;stream.getTracks().forEach(track=>track.stop());
  const blob=new Blob(chunks,{type:mime}),name=String(index+1).padStart(2,'0')+'.webm',response=await fetch('/save/'+name,{method:'POST',body:blob});if(!response.ok)throw Error('Save failed');
  const details={index,name,world:shot.world,view:shot.view,duration:(performance.now()-start)/1000,framesDrawn:drawCount,averageDrawFps:Math.round(drawCount/(performance.now()-start)*10000)/10,maxFrameGapMs:Math.max(0,...frameGaps),bytes:blob.size};recorded.push(details);
  await fetch('/save/capture-report.json',{method:'POST',body:JSON.stringify(result,null,2)});status.textContent='已保存：'+name;return details;
 }
 window.promoRecorder={prepare,record,shots,getState:()=>({shotIndex,capturing,ready,error,recorded}),preview:()=>new Promise(resolve=>canvas.toBlob(async blob=>resolve(await(await fetch('/save/preview.png',{method:'POST',body:blob})).json()),'image/png'))};
 prepare(0).catch(e=>{error=e.message;status.textContent=error;});
})();
