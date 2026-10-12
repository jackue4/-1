const {chromium}=require('C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/playwright-core');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const [view='cove',phase='day',width='1030',height='920',base='http://127.0.0.1:4187/sakura-season.html']=process.argv.slice(2);
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:+width,height:+height},deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(base+'#desert');await page.waitForFunction(()=>window.desertWorld?.getState().render.calls>0,{timeout:30000});
  await page.evaluate(({view,phase})=>{window.desertWorld.setView(view,true);window.desertWorld.setPhase(phase);},{view,phase});
  await page.waitForFunction(phase=>{const s=window.desertWorld.getState();return phase==='night'?s.env.night>.995:phase==='dusk'?s.env.dusk>.995:s.env.daylight>.995;},phase);
  await page.waitForTimeout(450);
  const state=await page.evaluate(()=>window.desertWorld.getState());
  const screenshot=path.join(__dirname,`${view}-${phase}-${width}x${height}.png`);await page.screenshot({path:screenshot});
  const report={url:page.url(),view,phase,viewport:{width:+width,height:+height},errors,state,screenshot,physicalPhoneVerified:false,method:'Isolated headless Chromium with real WebGL rendering; not a physical-device performance measurement.'};
  await fs.writeFile(path.join(__dirname,`${view}-${phase}-${width}x${height}.json`),JSON.stringify(report,null,2));
  console.log(JSON.stringify({errors,screenshot,roaming:state.worldState?.roaming,mummies:state.worldState?.mummies,cacti:state.scenery?.cacti,render:state.render},null,2));assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
