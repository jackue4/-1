const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 try{
 const context=await browser.newContext({viewport:{width:440,height:956},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 await page.goto(process.env.BLOOM_TEST_URL||pathToFileURL(path.resolve(__dirname,'../../outputs/little-bloom.html')).href);
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true',{},{timeout:90000});
 await page.waitForTimeout(1200);
 async function layout(){return page.evaluate(()=>({size:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth,hidden:[...document.querySelectorAll('.island-nav,#farm-panel,.pet-card,.build-card,.weather-card,#farm-focus,.intro,.footer')].every(e=>getComputedStyle(e).display==='none'),buttons:[...document.querySelectorAll('.view-switch button,.time-presets button,#help-button')].map(e=>{const b=e.getBoundingClientRect();return{id:e.id||e.textContent,w:b.width,h:b.height,x:b.x,y:b.y};}),state:window.littleBloom.getState(),scene:{width:document.querySelector('#scene').clientWidth,height:document.querySelector('#scene').clientHeight}}));}
 const portrait=await layout();assert.deepEqual(portrait.size,[440,956]);assert.ok(portrait.hidden);assert.ok(!portrait.overflow);assert.equal(portrait.scene.width,440);assert.ok(portrait.buttons.every(b=>b.w>=44&&b.h>=44&&b.x>=0&&b.x+b.w<=441&&b.y>=0&&b.y+b.h<=956));assert.ok(portrait.state.fishing.seated);assert.equal(portrait.state.residents,3);
 await page.screenshot({path:path.join(__dirname,'mobile-meadow.png')});
 await page.locator('#fishing-view').tap();await page.waitForTimeout(1000);
 assert.equal(await page.locator('#fishing-view').getAttribute('aria-pressed'),'true');
 await page.screenshot({path:path.join(__dirname,'mobile-fishing.png')});
 const cdp=await context.newCDPSession(page),before=await page.evaluate(()=>window.littleBloom.getState().orientation);
 const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y,id])=>({x,y,id,radiusX:4,radiusY:4,force:1}))});
 await touch('touchStart',[[200,440,1]]);await touch('touchMove',[[290,470,1]]);await touch('touchEnd',[]);
 await page.waitForTimeout(180);const after=await page.evaluate(()=>window.littleBloom.getState().orientation);assert.ok(before.some((v,i)=>Math.abs(v-after[i])>.01),'single finger rotates globe');
 const oldDistance=await page.evaluate(()=>window.littleBloom.getState().cameraDistance);
 await touch('touchStart',[[180,450,1],[260,450,2]]);await touch('touchMove',[[145,450,1],[295,450,2]]);await touch('touchEnd',[]);
 assert.ok(await page.evaluate(()=>window.littleBloom.getState().cameraDistance)<oldDistance,'pinch zooms camera');
 await page.evaluate(()=>{document.querySelector('[data-pane="farm"]').click();document.querySelector('#farm-focus').click();});assert.ok((await layout()).hidden);assert.equal(await page.evaluate(()=>document.documentElement.dataset.panel),'none');
 await page.locator('#fishing-view').tap();
 await page.locator('[data-time="22"]').tap();await page.waitForFunction(()=>window.littleBloom.getState().night>.8);await page.screenshot({path:path.join(__dirname,'mobile-night.png')});assert.equal((await layout()).state.fishing.seated,false);
 await page.setViewportSize({width:956,height:440});await page.waitForTimeout(700);const landscape=await layout();assert.ok(!landscape.overflow);assert.ok(landscape.buttons.every(b=>b.w>=44&&b.h>=44&&b.x>=0&&b.x+b.w<=957&&b.y>=0&&b.y+b.h<=440));
 await page.screenshot({path:path.join(__dirname,'mobile-landscape.png')});
 await page.setViewportSize({width:1440,height:900});await page.locator('[data-time="8.5"]').click();await page.locator('#meadow-view').click();await page.waitForTimeout(700);const desktop=await layout();assert.equal(desktop.scene.width,1440);assert.ok(desktop.hidden);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:9,portrait,landscape:{size:landscape.size,buttons:landscape.buttons},desktop:{size:desktop.size,scene:desktop.scene},errors,note:'Actual headless Chromium WebGL; emulated mobile viewport and touch input, not physical iPhone Safari.'},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
