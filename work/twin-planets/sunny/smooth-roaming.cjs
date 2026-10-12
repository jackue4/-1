const fs=require('fs'),path=require('path');function edit(f,fn){const p=path.join(__dirname,f);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
edit('villagers.js',s=>s.replace(" {name:'桃桃',species:'奶油猫',fur:'#ddc7ad',shirt:'#c3939f',job:'花艺师'},\n",''));
edit('farm-ui.js',s=>s.replace("[3,'harvest']","[1,'harvest']").replace('if(p.normal.distanceTo(j.normal)', 'if(!p){jobs.delete(id);continue;}if(p.normal.distanceTo(j.normal)'));
edit('world.js',s=>s.replace('fishing.pose(sheltered?-1:p.i,env)','fishing.pose(sheltered?-1:p.i,env,t)').replace('[fishing.root,fishing.bobber,','[fishing.root,').replace('[{normal:fishing.normal}]','fishing.normals.map(normal=>({normal}))').replace("a.g.visible=env.rain<.5&&env.night<.62&&!(env.petAway&&a===travelPet)","a.g.visible=false /* travel companion stays in its postcard story; three island residents */").replace("p.activity=settled?'坐在小凳子上，等鱼儿咬钩':'沿着岸边去钓鱼'","p.activity=settled?fishing.getState().activity:'提着心情，沿岸边换个钓点'"));
edit('app.js',s=>{
 s=s.replace('let focusedResident=null;', 'let focusedResident=null,surfaceDrag=null;');
 s=s.replace('function setView(mode){','function setView(mode){\n    surfaceDrag?.reset();const keepOrientation=world.planet.quaternion.clone();');
 s=s.replace('controls.enableRotate=!close','controls.enableRotate=false');
 s=s.replace('world.planet.userData.closeView=close','world.planet.userData.closeView=true');
 s=s.replace('world.planet.rotation.set(0,0,-.09);controls.target.set(0,.12,0);camera.position.copy(homePosition);',"world.planet.quaternion.copy(keepOrientation);controls.target.set(0,0,0);camera.position.set(.45,3.28,2.15).normalize().multiplyScalar(9.6);");
 s=s.replace("const stopSurfaceDrag=installSurfaceDrag(renderer.domElement,camera,world.planet,()=>viewMode==='meadow'",'const stopSurfaceDrag=surfaceDrag=installSurfaceDrag(renderer.domElement,camera,world.planet,()=>true');
 s=s.replace("if(viewMode==='meadow'){const d=",'if(true){surfaceDrag.reset();const d=');
 s=s.replace("nightSky.update(dt,elapsed,env,camera,Math.min(devicePixelRatio,1.25));", "surfaceDrag.update(dt);nightSky.update(dt,elapsed,env,camera,Math.min(devicePixelRatio,1.25));");
 s=s.replace('这是四位小伙伴一起造的家','这是三位小伙伴一起造的家');
 s=s.replace('getState:()=>({scenic,','getState:()=>({scenic,drag:surfaceDrag.getState(),renderProfile:{exposure:renderer.toneMappingExposure,cloudShell:false,grassCount:world.meadow.blades.count},');
 return s;
});
edit('style.css',s=>s+'\n/* Shared paper wash in meadow and globe; distance does not select a different art style. */\nhtml[data-experience=scenic] .paper{opacity:.03}\n');
edit('page.html',s=>s.replace('id="resident-count">4','id="resident-count">3').replace('桃桃可以帮忙收获','麦麦可以帮忙收获').replace('阿栗白天在另一片海湾坐着钓鱼','阿栗白天会在另一片海湾换着钓点坐下钓鱼，偶尔抛竿、提竿，看鱼儿跃出水面').replace('一根手指拖动，探索星球每一面','一根手指拖动，松手后星球会轻轻缓停，探索星球每一面'));
console.log('Updated three residents and shared smooth rotation/rendering');
