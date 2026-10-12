const {chromium}=require('C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/playwright-core');
const fs=require('node:fs/promises'),path=require('node:path'),{spawn}=require('node:child_process');
const {once}=require('node:events');
const shots=require('./shots.json'),ffmpeg=path.resolve(__dirname,'../promo-video/vendor/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const preview=process.argv.includes('--preview'),selected=process.argv.find(a=>a.startsWith('--shots='))?.slice(8).split(',').map(Number)||shots.map((_,i)=>i);
(async()=>{
 await fs.mkdir(path.join(__dirname,'raw'),{recursive:true});await fs.mkdir(path.join(__dirname,'previews'),{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 const report={method:'Deterministic actual WebGL scene render, fixed 1/30 second simulation per video frame, capture-only camera orbit; no production edits',width:1080,height:1920,fps:30,shots:[]};
 try{
  const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message);});let current='';
  for(const index of selected){
   const shot=shots[index],name=String(index+1).padStart(2,'0');
   if(shot.world!==current){await page.goto('http://127.0.0.1:4190/'+shot.world+'.html');await page.waitForFunction(()=>window.film&&window.captureRig);current=shot.world;await page.waitForTimeout(200);}
   await page.evaluate(({shot,index})=>window.film.configure(shot,index),{shot,index});
   // Real simulation pre-roll settles snowfall, cloth and the shared sky.
   for(let j=0;j<15;j++)await page.evaluate(j=>window.captureRig.step(-15+j),j);
   if(preview){const result=await page.evaluate(()=>window.film.preview(0));await fs.writeFile(path.join(__dirname,'previews',name+'.png'),Buffer.from(result.image,'base64'));console.log(JSON.stringify({preview:name,world:shot.world,view:shot.view,state:result.state}));continue;}
   const file=path.join(__dirname,'raw',name+'.mp4'),log=await fs.open(path.join(__dirname,'raw',name+'.log'),'w');
   const encoder=spawn(ffmpeg,['-hide_banner','-y','-f','image2pipe','-framerate','30','-vcodec','mjpeg','-i','pipe:0','-an','-c:v','libx264','-threads','4','-preset','fast','-crf','16','-pix_fmt','yuv420p','-r','30','-movflags','+faststart',file],{stdio:['pipe','ignore',log.fd],windowsHide:true});
   const done=once(encoder,'close');encoder.stdin.on('error',()=>{});
   const count=shot.duration*30+12,samples=[],start=Date.now();
   for(let i=0;i<count;i++){
    const result=await page.evaluate(i=>window.film.frame(i),i);
    if(!encoder.stdin.write(Buffer.from(result.image,'base64')))await once(encoder.stdin,'drain');
    if(i%30===0||i===count-1)samples.push(result.state);
    if(i===Math.floor(count/2))await fs.writeFile(path.join(__dirname,'previews',name+'-mid.jpg'),Buffer.from(result.image,'base64'));
    if(i%60===0)console.log(JSON.stringify({shot:index+1,of:shots.length,frame:i,total:count,elapsed:Math.round((Date.now()-start)/1000)}));
   }
   encoder.stdin.end();const [code]=await done;await log.close();if(code!==0)throw Error('FFmpeg shot '+name+' failed '+code);
   const info={index,name:name+'.mp4',world:shot.world,view:shot.view,phase:shot.phase,frames:count,duration:count/30,samples,bytes:(await fs.stat(file)).size,secondsToRender:(Date.now()-start)/1000};report.shots.push(info);
   await fs.writeFile(path.join(__dirname,'raw','capture-report-'+name+'.json'),JSON.stringify(info,null,2));await fs.writeFile(path.join(__dirname,'raw','capture-report.json'),JSON.stringify(report,null,2));
   console.log(JSON.stringify({completed:name,seconds:info.secondsToRender,bytes:info.bytes}));
  }
  if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({done:true,preview,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
