const {chromium}=require('playwright-core'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});try{
const page=await browser.newPage({viewport:{width:440,height:956},isMobile:true,hasTouch:true,deviceScaleFactor:2}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto(process.env.BLOOM_TEST_URL||pathToFileURL(path.resolve(__dirname,'../../outputs/little-bloom.html')).href);await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
const state=()=>page.evaluate(()=>window.littleBloom.getState()),angle=(a,b)=>2*Math.acos(Math.min(1,Math.abs(a.reduce((s,x,i)=>s+x*b[i],0))));
const cdp=await page.context().newCDPSession(page),touch=(type,x)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:x===null?[]:[{x,y:440,id:1,radiusX:4,radiusY:4,force:1}]});
const checks=[];
for(const view of ['meadow','coast','fishing','animal','globe']){
 await page.locator('#'+view+'-view').tap();await page.waitForTimeout(220);
 const before=(await state()).orientation;
 await touch('touchStart',150);for(const x of [175,205,240]){await touch('touchMove',x);await page.waitForTimeout(20);}await touch('touchEnd',null);
 const released=(await state()).orientation;await page.waitForTimeout(140);const gliding=await state();
 assert.ok(angle(before,gliding.orientation)>.04,view+' rotates');assert.ok(angle(released,gliding.orientation)>.005,view+' coasts after release');
 await page.waitForTimeout(1600);assert.ok((await state()).drag.speed<1,view+' settles');checks.push(view+' smooth drag and inertia');
}
await page.locator('#meadow-view').tap();const meadow=await state();await page.locator('#globe-view').tap();const globe=await state();
assert.ok(angle(meadow.orientation,globe.orientation)<.00001);assert.deepEqual(meadow.renderProfile,globe.renderProfile);assert.equal(globe.residents,3);assert.equal(globe.drag.speed,0);
await page.waitForTimeout(350);await page.screenshot({path:path.join(__dirname,'smooth-globe.png')});checks.push('Meadow-to-globe retains orientation, exposure, foliage quality and cloud treatment');
await page.locator('#fishing-view').tap();await page.waitForTimeout(450);await page.screenshot({path:path.join(__dirname,'smooth-fishing.png')});
const final=await state();assert.equal(final.fishing.spotCount,3);assert.equal(final.residents,3);assert.deepEqual(errors,[]);
console.log(JSON.stringify({checks,final:{residents:final.residents,fishing:final.fishing},errors,note:'Real Chromium WebGL and touch simulation, not physical Safari.'},null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
