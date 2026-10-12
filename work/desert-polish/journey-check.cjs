const {chromium}=require('C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/playwright-core');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 const checks=[],errors=[];try{
  const page=await browser.newPage({viewport:{width:1030,height:920}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const state=()=>page.evaluate(()=>window.desertWorld.getState()),distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
  await page.goto('http://127.0.0.1:4187/sakura-season.html#desert');await page.waitForFunction(()=>window.desertWorld?.getState().render.calls>0);
  await page.getByRole('button',{name:'♧ 驼铃漫游',exact:true}).click();await page.waitForTimeout(1900);
  let first=await state();await page.waitForTimeout(1500);let after=await state();
  assert(after.following&&distance(first.worldState.roaming.position,after.worldState.roaming.position)>.025&&distance(first.cameraTarget,after.cameraTarget)>.015);checks.push('Real rendered camel and follow camera move together');
  await page.mouse.move(520,410);await page.mouse.down();await page.mouse.move(600,430,{steps:8});await page.mouse.up();assert(!(await state()).following);checks.push('Dragging stops follow camera');
  await page.getByRole('button',{name:'♧ 驼铃漫游',exact:true}).click();assert((await state()).following);checks.push('Selecting tour again resumes follow');
  await page.getByRole('button',{name:'☾ 月光奇遇',exact:true}).click();await page.waitForFunction(()=>window.desertWorld.getState().env.night>.9999);after=await state();
  assert(after.phase==='night'&&after.worldState.mummies.visibleCount>=2&&after.worldState.mummies.visibleCount<=4);checks.push('Moonlight entry turns on night and shows two to four visitors');
  await page.getByRole('button',{name:'♧ 驼铃漫游',exact:true}).click();await page.waitForTimeout(1900);
  await page.getByRole('button',{name:'暂停沙海拾光',exact:true}).click();await page.waitForTimeout(350);first=await state();await page.waitForTimeout(700);after=await state();
  assert.equal(first.time,after.time);assert.equal(first.performance.renderFrames,after.performance.renderFrames);assert.equal(first.performance.simulationFrames,after.performance.simulationFrames);assert.deepEqual(first.worldState.roaming.position,after.worldState.roaming.position);checks.push('Pause stops rendered tour and simulation');
  const saved={time:after.time,following:after.following,camera:after.camera,roaming:after.worldState.roaming,mummies:after.worldState.mummies};
  await page.getByRole('button',{name:'返回星球选择',exact:true}).click();await page.getByRole('button',{name:'进入沙海拾光游戏',exact:true}).waitFor();await page.getByRole('button',{name:'进入沙海拾光游戏',exact:true}).click();await page.waitForTimeout(350);after=await state();
  assert.equal(after.time,saved.time);assert.equal(after.following,saved.following);assert.deepEqual(after.camera,saved.camera);assert.deepEqual(after.worldState.roaming,saved.roaming);assert.deepEqual(after.worldState.mummies,saved.mummies);checks.push('Selector preview restores paused night actors, following, and camera exactly');
  await page.getByRole('button',{name:'☀ 晴昼',exact:true}).click();await page.waitForFunction(()=>window.desertWorld.getState().env.night<.001);assert.equal((await state()).worldState.mummies.visible,false);checks.push('Daylight hides all night visitors');
  for(const [width,height]of [[390,844],[844,390]]){
   await page.setViewportSize({width,height});await page.getByRole('button',{name:'返回星球选择',exact:true}).click();await page.getByRole('button',{name:'进入沙海拾光游戏',exact:true}).waitFor();
   const entry=await page.getByRole('button',{name:'进入沙海拾光游戏',exact:true}).boundingBox();assert(entry&&entry.y>=0&&entry.y+entry.height<=height+1);assert.equal(await page.locator('[data-planet-choice]').count(),5);
   await page.getByRole('button',{name:'进入沙海拾光游戏',exact:true}).click();const tools=page.getByRole('button',{name:'展开工具',exact:true});if(await tools.isVisible())await tools.click();
   await page.getByRole('button',{name:'☾ 月光奇遇',exact:true}).click();await page.waitForFunction(()=>window.desertWorld.getState().env.night>.995);
   const button=await page.getByRole('button',{name:'☾ 月光奇遇',exact:true}).boundingBox();assert(button&&button.x>=0&&button.x+button.width<=width+1);
   await page.screenshot({path:path.join(__dirname,`moon-mobile-${width}x${height}.png`)});checks.push(`Selector entry and moonlight camera accessible at ${width}x${height}`);
  }
  assert.deepEqual(errors,[]);checks.push('No runtime or shader errors');
  await fs.writeFile(path.join(__dirname,'browser-interaction-report.json'),JSON.stringify({passed:true,checkedAt:new Date().toISOString(),checks,errors,physicalPhoneVerified:false},null,2));console.log(JSON.stringify({passed:true,checks,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
